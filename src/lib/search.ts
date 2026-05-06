import { marketplaceAdapters, catalogAdapters } from "@/lib/adapters"
import { scoreListing, tallyTiers } from "@/lib/scoring"
import { allCatalogEntries, resolveCatalogById } from "@/lib/mock/catalog"
import { refineGamesQuery, titleIsConsoleHardware } from "@/lib/games"
import { refineShoesQuery, titleIsShoe } from "@/lib/shoes"
import { refinePokemonQuery } from "@/lib/pokemon"
import { isPokemonLottery } from "@/lib/pokemon-lottery"
import {
  RELEVANCE_THRESHOLD,
  combinedRank,
  relevanceOf,
} from "@/lib/relevance"
import type {
  CatalogRef,
  Listing,
  Platform,
  ScoredListing,
  SearchParams,
  SearchResult,
} from "@/lib/types"

/**
 * Execute an aggregated search across all marketplace adapters in parallel,
 * resolve the reference price via the vertical's catalog adapter, and score
 * every listing.
 *
 * This is the product: fan-out to the marketplaces, collapse around the ref.
 */
export async function runSearch(params: SearchParams): Promise<SearchResult> {
  const ref = await resolveRef(params)
  const refCandidates = findCandidates(params)
  const marketplaceQuery = buildMarketplaceQuery(params)
  const adapters = activeAdapters(params)

  // Fan-out in parallel. Per-adapter failures are isolated.
  const chunks = await Promise.all(
    adapters.map(async (a) => {
      try {
        return await a.search({ q: marketplaceQuery, vertical: params.vertical })
      } catch {
        return []
      }
    }),
  )
  const all = applyVerticalFilters(chunks.flat(), params)

  // Generic relevance filter (applies to every vertical). We score each
  // title against the user's original query (params.q, NOT the marketplace-
  // refined keyword — that one was padded with "console", platform tokens,
  // set names, etc., which would distort the match).
  const { listings: filtered, relevanceById } = applyRelevance(all, params.q)

  const effectiveRef =
    ref?.refPriceCents ?? heuristicRef(filtered.map((l) => l.priceCents))
  const effectiveSource = ref?.refSource ?? "heuristic"

  const scored = scoreAndRetag(filtered, effectiveRef, effectiveSource, params.vertical)
  const finalListings = applyFiltersAndSort(scored, params, relevanceById)

  return {
    query: params.q,
    vertical: params.vertical,
    ref,
    refCandidates,
    listings: finalListings,
    fetchedAt: new Date().toISOString(),
    tallies: tallyTiers(finalListings.map((l) => l.score)),
  }
}

// ---- Streaming variant ------------------------------------------------------

/**
 * A scored listing carrying its `combinedRank` (relevance × deal delta).
 * The streaming endpoint emits this so the client can sort by the same
 * default ranking used by `runSearch` without needing the relevance map.
 */
export interface StreamedListing extends ScoredListing {
  rank: number
}

/**
 * Streaming events emitted by `runSearchStream`. Designed to be JSON-encodable
 * (NDJSON over HTTP). Order is guaranteed:
 *   1. exactly one `start` event (first — lets the client size skeletons)
 *   2. exactly one `ref` event (when the catalog lookup completes — may carry
 *      `null`; arrives independently of `chunk` order since ref + adapters
 *      run in parallel)
 *   3. zero or more `chunk` events (one per adapter, in completion order)
 *   4. exactly one `done` event (last)
 *   5. an `error` event may replace the `done` event on fatal failure
 */
export type SearchStreamEvent =
  | {
      kind: "start"
      query: string
      vertical: import("@/lib/types").Vertical
      activePlatforms: Platform[]
      refCandidates: CatalogRef[]
    }
  | {
      kind: "ref"
      ref: CatalogRef | null
    }
  | {
      kind: "chunk"
      platform: Platform
      listings: StreamedListing[]
      /** running tally across all chunks emitted so far */
      tallies: { deal: number; fair: number; bin: number }
      /** total accumulated listing count after this chunk */
      total: number
    }
  | {
      kind: "done"
      fetchedAt: string
      tallies: { deal: number; fair: number; bin: number }
      total: number
    }
  | {
      kind: "error"
      message: string
    }

/**
 * Stream search results as each adapter resolves, instead of awaiting the
 * slowest one.
 *
 * Why: the bottleneck is Wallapop (~3-5s warm, ~10-15s cold via Playwright).
 * The other three adapters (Subito/Vinted/eBay) typically return in <1s.
 * Streaming lets the UI paint the fast adapters' results immediately while
 * Wallapop fills in.
 *
 * Tradeoff: scoring uses an "effective ref". When the catalog adapter resolves
 * a real ref price, every chunk is scored against it (stable). When it
 * doesn't, we fall back to a running median over the prices seen so far —
 * scores in early chunks may shift slightly as more data arrives. That's OK:
 * the heuristic was already approximate, and the client can re-rank on each
 * chunk anyway.
 */
export async function* runSearchStream(
  params: SearchParams,
): AsyncGenerator<SearchStreamEvent> {
  const refCandidates = findCandidates(params)
  const marketplaceQuery = buildMarketplaceQuery(params)
  const adapters = activeAdapters(params)

  // Kick off ref lookup AND all adapters in parallel — the ref lookup can
  // be slow (cardmarket scrape via Playwright sometimes >5s), so we don't
  // gate the marketplace fan-out on it.
  const refPromise = resolveRef(params).catch((e) => {
    console.warn("[search] ref lookup failed:", e instanceof Error ? e.message : e)
    return null
  })

  const adapterPromises = adapters.map((a, idx) =>
    a
      .search({ q: marketplaceQuery, vertical: params.vertical })
      .then(
        (listings) => ({ idx, platform: a.platform, listings }),
        () => ({ idx, platform: a.platform, listings: [] as Listing[] }),
      ),
  )

  // `start` lets the client paint skeletons sized to the actual fan-out
  // (n=activePlatforms.length) while the slow work runs in the background.
  yield {
    kind: "start",
    query: params.q,
    vertical: params.vertical,
    activePlatforms: adapters.map((a) => a.platform),
    refCandidates,
  }

  // Tag the ref promise so it can join the same race as the adapter promises.
  // If ref resolves first, we yield a ref-update; if adapters resolve first,
  // we score them with the heuristic and re-emit the ref later.
  type Settled =
    | { kind: "ref"; ref: CatalogRef | null }
    | { kind: "adapter"; idx: number; platform: Platform; listings: Listing[] }

  const taggedRef: Promise<Settled> = refPromise.then((ref) => ({ kind: "ref", ref }))
  const taggedAdapters: Promise<Settled>[] = adapterPromises.map((p) =>
    p.then((s) => ({ kind: "adapter", ...s })),
  )

  const tallies = { deal: 0, fair: 0, bin: 0 }
  let total = 0
  let resolvedRef: CatalogRef | null = null
  let refResolved = false
  // Running price pool used when there is no catalog ref yet.
  const runningPrices: number[] = []

  // Race ref against adapters. Track each pending promise so we can drop the
  // winner from the pool after each Promise.race.
  const pending = new Set<Promise<Settled>>([taggedRef, ...taggedAdapters])
  // For removal, keep a parallel index → promise map.
  const adapterByIdx = new Map<number, Promise<Settled>>()
  taggedAdapters.forEach((p, i) => adapterByIdx.set(i, p))

  while (pending.size > 0) {
    const settled = await Promise.race(pending)

    if (settled.kind === "ref") {
      pending.delete(taggedRef)
      resolvedRef = settled.ref
      refResolved = true
      yield { kind: "ref", ref: settled.ref }
      continue
    }

    // adapter chunk
    const promise = adapterByIdx.get(settled.idx)
    if (promise) pending.delete(promise)

    const filtered = applyVerticalFilters(settled.listings, params)
    const { listings: relevant, relevanceById } = applyRelevance(filtered, params.q)

    // Score with the best ref we have right now: catalog ref if it already
    // resolved, otherwise running heuristic. If ref arrives later, the
    // already-emitted chunks keep their heuristic scores — same behavior as
    // the non-streaming runSearch when no catalog match exists.
    if (!resolvedRef) {
      for (const l of relevant) runningPrices.push(l.priceCents)
    }
    const effectiveRef = resolvedRef?.refPriceCents ?? heuristicRef(runningPrices)
    const effectiveSource = resolvedRef?.refSource ?? "heuristic"

    const scored = scoreAndRetag(relevant, effectiveRef, effectiveSource, params.vertical)
    const filteredScored = applyUserFilters(scored, params)
    const ranked: StreamedListing[] = filteredScored.map((l) => ({
      ...l,
      rank: combinedRank(relevanceById.get(l.id) ?? 1, l.score.delta),
    }))

    for (const l of ranked) {
      if (l.score.tier === "deal" || l.score.tier === "fair" || l.score.tier === "bin") {
        tallies[l.score.tier] += 1
      }
    }
    total += ranked.length

    yield {
      kind: "chunk",
      platform: settled.platform,
      listings: ranked,
      tallies: { ...tallies },
      total,
    }
  }

  // Defensive: if the ref promise somehow never resolved (shouldn't happen
  // given .catch() above), surface the null so the client stops "loading…".
  if (!refResolved) {
    yield { kind: "ref", ref: null }
  }
  yield {
    kind: "done",
    fetchedAt: new Date().toISOString(),
    tallies,
    total,
  }
}

// ---- Shared helpers ---------------------------------------------------------

async function resolveRef(params: SearchParams): Promise<CatalogRef | null> {
  // Resolve the reference price. Priority:
  //   1. Explicit override by productId (user picked a specific item via UI)
  //   2. Auto-lookup from the catalog adapter, optionally scoped by
  //      games-specific kind/platform.
  if (params.refOverride) {
    const byId = resolveCatalogById(params.refOverride)
    if (byId && byId.vertical === params.vertical) return byId
  }
  const catalog = catalogAdapters[params.vertical]
  const refHit = await catalog.lookup(params.q, params.vertical, {
    kind: params.gameKind,
    platform: params.gamePlatform,
    pokemonSet: params.pokemonSet,
  })
  if (!refHit) return null
  return {
    vertical: params.vertical,
    query: params.q,
    refPriceCents: refHit.refPriceCents,
    refSource: catalog.source,
    productName: refHit.productName,
    productId: refHit.productId,
  }
}

function buildMarketplaceQuery(params: SearchParams): string {
  // Build the final keyword for marketplace adapters. Per-vertical rules:
  //   - games: append "console" or platform token depending on kind
  //   - shoes: append size if one was specified
  //   - pokemon: append set name if user picked one
  if (params.vertical === "games" && params.gameKind) {
    return refineGamesQuery(params.q, params.gameKind, params.gamePlatform)
  }
  if (params.vertical === "shoes") return refineShoesQuery(params.q, params.shoeSize)
  if (params.vertical === "pokemon") return refinePokemonQuery(params.q, params.pokemonSet)
  return params.q
}

function activeAdapters(params: SearchParams) {
  return marketplaceAdapters.filter(
    (a) => !params.platforms || params.platforms.includes(a.platform),
  )
}

/**
 * Vertical-specific noise filters — kill listings that the marketplace keyword
 * search returned but that aren't what the user is shopping for.
 */
function applyVerticalFilters(listings: Listing[], params: SearchParams): Listing[] {
  let out = listings
  // When the user explicitly asked for a console (not a game), drop any
  // listing whose title matches a game franchise pattern.
  if (params.vertical === "games" && params.gameKind === "console") {
    out = out.filter((l) => titleIsConsoleHardware(l.title, params.q))
  }
  // Shoes: title must signal "shoe" and not match the apparel blocklist.
  if (params.vertical === "shoes") {
    out = out.filter((l) => titleIsShoe(l.title))
  }
  // Pokémon: drop raffles / mystery boxes by default. The price on those is
  // the ticket cost, not the card cost — they would otherwise score as huge
  // fake deals against the catalog ref. The user can opt back in by
  // unchecking "Escludi lotterie" in the search box (clears `excludeLotteries`,
  // which we then carry as `false` and only flag instead of drop).
  if (params.vertical === "pokemon" && params.excludeLotteries !== false) {
    out = out.filter((l) => !isPokemonLottery(l.title))
  }
  return out
}

function applyRelevance(
  listings: Listing[],
  query: string,
): { listings: Listing[]; relevanceById: Map<string, number> } {
  // Drops:
  //   - hard-noise hits (broken / replica / empty box / spare parts / preorder)
  //   - titles where < RELEVANCE_THRESHOLD of significant query tokens appear
  // Keeps the per-listing relevance for use in the default sort below.
  const relevanceById = new Map<string, number>()
  const filtered = listings.filter((l) => {
    const r = relevanceOf(l.title, query)
    if (r.score < RELEVANCE_THRESHOLD) return false
    relevanceById.set(l.id, r.score)
    return true
  })
  return { listings: filtered, relevanceById }
}

/**
 * Score every listing and re-tag suspicious results to the "unknown" tier:
 *   1. Lottery / mystery-box (pokémon only): the price shown is the ticket
 *      cost, not the card. Tag with `flag: "lottery"` so the UI shows a
 *      distinct chip. Only reaches here when the user opted to KEEP lotteries
 *      in the results (default behaviour drops them upstream).
 *   2. Placeholder prices: seller listed €0 / €1 as a dummy. `flag: "placeholder"`.
 *   3. "Too good to be true": delta > 30% below market — usually item mismatch
 *      (keychain, accessory, wrong SKU, lot of unrelated items) rather than a
 *      real steal. `flag: "too-cheap"`.
 */
function scoreAndRetag(
  listings: Listing[],
  effectiveRef: number,
  effectiveSource: import("@/lib/types").RefSource,
  vertical: import("@/lib/types").Vertical,
): ScoredListing[] {
  return listings.map((l) => {
    const score = scoreListing(l, effectiveRef, effectiveSource)
    if (vertical === "pokemon" && isPokemonLottery(l.title)) {
      return {
        ...l,
        score: {
          tier: "unknown" as const,
          delta: 0,
          percent: 0,
          ref: effectiveRef,
          refSource: effectiveSource,
          flag: "lottery" as const,
          note: "lotteria — il prezzo è del ticket, non della carta",
        },
      }
    }
    const placeholder =
      l.priceCents <= 0 ||
      (effectiveRef > 0 && l.priceCents <= 100 && effectiveRef - l.priceCents > 500)
    if (placeholder) {
      return {
        ...l,
        score: {
          tier: "unknown" as const,
          delta: 0,
          percent: 0,
          ref: effectiveRef,
          refSource: effectiveSource,
          flag: "placeholder" as const,
          note: "prezzo non indicato dal venditore",
        },
      }
    }
    if (score.delta > 0.3) {
      return {
        ...l,
        score: {
          ...score,
          tier: "unknown" as const,
          flag: "too-cheap" as const,
          note: "troppo economico rispetto al riferimento — verifica l'annuncio",
        },
      }
    }
    return { ...l, score }
  })
}

function applyUserFilters(
  scored: ScoredListing[],
  params: SearchParams,
): ScoredListing[] {
  let out = scored
  // For kind=console: drop "unknown" tier (overwhelmingly games or accessories
  // whose titles happened to include the console keyword).
  if (params.vertical === "games" && params.gameKind === "console") {
    out = out.filter((l) => l.score.tier !== "unknown")
  }
  if (params.minPriceCents != null) {
    out = out.filter((l) => l.priceCents >= params.minPriceCents!)
  }
  if (params.maxPriceCents != null) {
    out = out.filter((l) => l.priceCents <= params.maxPriceCents!)
  }
  if (params.tiers && params.tiers.length > 0) {
    out = out.filter((l) => params.tiers!.includes(l.score.tier))
  }
  return out
}

function applyFiltersAndSort(
  scored: ScoredListing[],
  params: SearchParams,
  relevanceById: Map<string, number>,
): ScoredListing[] {
  const filtered = applyUserFilters(scored, params)
  const sort = params.sort ?? "score"
  return [...filtered].sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.priceCents - b.priceCents
      case "price-desc":
        return b.priceCents - a.priceCents
      case "posted-desc":
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      case "score":
      default: {
        const ra = relevanceById.get(a.id) ?? 1
        const rb = relevanceById.get(b.id) ?? 1
        const d = combinedRank(rb, b.score.delta) - combinedRank(ra, a.score.delta)
        if (d !== 0) return d
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      }
    }
  })
}

function heuristicRef(prices: number[]): number {
  if (prices.length === 0) return 0
  const sorted = [...prices].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid]
}

/**
 * Surface up to N catalog refs that plausibly match the query — used to
 * populate the "Cambia riferimento" dropdown. Fuzzy: token overlap on
 * lowercased words, ranked by overlap count. Always includes kind/platform
 * filters so the list is scoped.
 */
function findCandidates(params: SearchParams, limit = 8): CatalogRef[] {
  const scope = allCatalogEntries(params.vertical, {
    kind: params.gameKind,
    platform: params.gamePlatform,
    pokemonSet: params.pokemonSet,
  })
  const qTokens = params.q.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (qTokens.length === 0) return scope.slice(0, limit)
  const scored = scope.map((ref) => {
    const haystack = `${ref.query} ${ref.productName}`.toLowerCase()
    let overlap = 0
    for (const t of qTokens) if (haystack.includes(t)) overlap += 1
    return { ref, overlap }
  })
  return scored
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((x) => x.ref)
}
