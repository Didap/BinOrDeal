import { marketplaceAdapters, catalogAdapters } from "@/lib/adapters"
import { scoreListing, tallyTiers } from "@/lib/scoring"
import { allCatalogEntries, resolveCatalogById } from "@/lib/mock/catalog"
import { refineGamesQuery, titleIsConsoleHardware } from "@/lib/games"
import { refineShoesQuery, titleIsShoe } from "@/lib/shoes"
import { refinePokemonQuery } from "@/lib/pokemon"
import {
  RELEVANCE_THRESHOLD,
  combinedRank,
  relevanceOf,
} from "@/lib/relevance"
import type {
  CatalogRef,
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
  const catalog = catalogAdapters[params.vertical]

  // Resolve the reference price. Priority:
  //   1. Explicit override by productId (user picked a specific item via UI)
  //   2. Auto-lookup from the catalog adapter, optionally scoped by
  //      games-specific kind/platform.
  let ref: CatalogRef | null = null
  if (params.refOverride) {
    const byId = resolveCatalogById(params.refOverride)
    if (byId && byId.vertical === params.vertical) ref = byId
  }
  if (!ref) {
    const refHit = await catalog.lookup(params.q, params.vertical, {
      kind: params.gameKind,
      platform: params.gamePlatform,
      pokemonSet: params.pokemonSet,
    })
    ref = refHit
      ? {
          vertical: params.vertical,
          query: params.q,
          refPriceCents: refHit.refPriceCents,
          refSource: catalog.source,
          productName: refHit.productName,
          productId: refHit.productId,
        }
      : null
  }

  // Build the final keyword for marketplace adapters. Per-vertical rules:
  //   - games: append "console" or platform token depending on kind
  //   - shoes: append size if one was specified
  //   - pokemon: append set name if user picked one
  const marketplaceQuery =
    params.vertical === "games" && params.gameKind
      ? refineGamesQuery(params.q, params.gameKind, params.gamePlatform)
      : params.vertical === "shoes"
        ? refineShoesQuery(params.q, params.shoeSize)
        : params.vertical === "pokemon"
          ? refinePokemonQuery(params.q, params.pokemonSet)
          : params.q

  // Candidates for the "Cambia riferimento" dropdown — all catalog entries
  // in this vertical that could plausibly match the query (fuzzy), scoped
  // by kind/platform when set.
  const refCandidates = findCandidates(params)

  // Fan-out in parallel. Per-adapter failures are isolated.
  const chunks = await Promise.all(
    marketplaceAdapters
      .filter((a) => !params.platforms || params.platforms.includes(a.platform))
      .map(async (a) => {
        try {
          return await a.search({ q: marketplaceQuery, vertical: params.vertical })
        } catch {
          return []
        }
      }),
  )
  let all = chunks.flat()

  // When the user explicitly asked for a console (not a game), drop any
  // listing whose title matches a game franchise pattern. The marketplace
  // keyword search returns both hardware and software from Subito's c=9
  // category — this is what enforces the UI's "titoli di giochi verranno
  // esclusi" promise.
  if (params.vertical === "games" && params.gameKind === "console") {
    all = all.filter((l) => titleIsConsoleHardware(l.title, params.q))
  }

  // Shoes: the title must signal "shoe" (size or shoe-vocab) and NOT
  // match the apparel blocklist — kills Jordan-branded t-shirts, hoodies,
  // stickers, etc. See src/lib/shoes.ts for the signal rules.
  if (params.vertical === "shoes") {
    all = all.filter((l) => titleIsShoe(l.title))
  }

  // Generic relevance filter (applies to every vertical). We score each
  // title against the user's original query (params.q, NOT the marketplace-
  // refined keyword — that one was padded with "console", platform tokens,
  // set names, etc., which would distort the match).
  //
  // Drops:
  //   - hard-noise hits (broken / replica / empty box / spare parts / preorder)
  //   - titles where < RELEVANCE_THRESHOLD of significant query tokens appear
  //
  // Keeps the per-listing relevance for use in the default sort below.
  // See src/lib/relevance.ts for the rules.
  const relevanceById = new Map<string, number>()
  all = all.filter((l) => {
    const r = relevanceOf(l.title, params.q)
    if (r.score < RELEVANCE_THRESHOLD) return false
    relevanceById.set(l.id, r.score)
    return true
  })

  // Score every listing against the ref, fall back to a heuristic median if no ref.
  const effectiveRef =
    ref?.refPriceCents ??
    heuristicRef(all.map((l) => l.priceCents))

  const effectiveSource = ref?.refSource ?? "heuristic"

  let scored: ScoredListing[] = all.map((l) => ({
    ...l,
    score: scoreListing(l, effectiveRef, effectiveSource),
  }))

  // Suspicious-score detection. Two kinds of false positives get re-tagged
  // as "unknown" tier:
  //   1. Placeholder prices: seller listed €0 / €1 as a dummy.
  //   2. "Too good to be true": delta > 30% below market. Legitimate
  //      deals land in the -10% to -30% band; beyond that it's almost
  //      always an item mismatch (keychain, accessory, wrong SKU, lot
  //      of unrelated items) rather than a real steal.
  scored = scored.map((l) => {
    const placeholder =
      l.priceCents <= 0 ||
      (effectiveRef > 0 &&
        l.priceCents <= 100 &&
        effectiveRef - l.priceCents > 500)
    if (placeholder) {
      return {
        ...l,
        score: {
          tier: "unknown" as const,
          delta: 0,
          percent: 0,
          ref: effectiveRef,
          refSource: effectiveSource,
          note: "prezzo non indicato dal venditore",
        },
      }
    }
    if (l.score.delta > 0.3) {
      return {
        ...l,
        score: {
          ...l.score,
          tier: "unknown" as const,
          note: "troppo economico rispetto al riferimento — verifica l'annuncio",
        },
      }
    }
    return l
  })

  // For kind=console: also drop any listing that got flagged as "unknown"
  // by the too-good-to-be-true rule. These are overwhelmingly games or
  // accessories whose titles happened to include the console keyword —
  // the user explicitly said they're shopping for hardware.
  if (params.vertical === "games" && params.gameKind === "console") {
    scored = scored.filter((l) => l.score.tier !== "unknown")
  }

  // Filters
  if (params.minPriceCents != null)
    scored = scored.filter((l) => l.priceCents >= params.minPriceCents!)
  if (params.maxPriceCents != null)
    scored = scored.filter((l) => l.priceCents <= params.maxPriceCents!)
  if (params.tiers && params.tiers.length > 0)
    scored = scored.filter((l) => params.tiers!.includes(l.score.tier))

  // Sort. Default ("score") combines relevance with deal delta — a fairly
  // priced item that perfectly matches the query beats an irrelevant cheap
  // one. Other modes are pure dimensions (price, freshness).
  const sort = params.sort ?? "score"
  scored.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.priceCents - b.priceCents
      case "price-desc":
        return b.priceCents - a.priceCents
      case "posted-desc":
        return (
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        )
      case "score":
      default: {
        const ra = relevanceById.get(a.id) ?? 1
        const rb = relevanceById.get(b.id) ?? 1
        const d = combinedRank(rb, b.score.delta) - combinedRank(ra, a.score.delta)
        if (d !== 0) return d
        return (
          new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        )
      }
    }
  })

  return {
    query: params.q,
    vertical: params.vertical,
    ref,
    refCandidates,
    listings: scored,
    fetchedAt: new Date().toISOString(),
    tallies: tallyTiers(scored.map((l) => l.score)),
  }
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
