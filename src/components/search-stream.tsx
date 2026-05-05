"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ListingCard } from "@/components/listing-card"
import { RefMatch } from "@/components/ref-match"
import { ScoreBadge } from "@/components/score-badge"
import { cn } from "@/lib/cn"
import { PLATFORM_LABELS } from "@/lib/format"
import type { SearchStreamEvent, StreamedListing } from "@/lib/search"
import type { CatalogRef, Platform } from "@/lib/types"

interface Props {
  /** The search-page URL params, already serialized — used as the streaming
   *  endpoint query. Re-mounting the component (new key) restarts the stream. */
  query: string
  sort: "score" | "price-asc" | "price-desc" | "posted-desc"
  /** Server-rendered status strip — passed as children so this client
   *  component doesn't pull `marketplaceAdapters` (and Playwright with it)
   *  into the client bundle. */
  statusStrip: ReactNode
}

interface State {
  ref: CatalogRef | null
  /** Whether the catalog ref event has actually arrived. Distinct from
   *  `ref === null`, which is a legitimate final state. */
  refResolved: boolean
  refCandidates: CatalogRef[]
  /** Set after the `start` event lands — once true, we know the n of
   *  marketplaces the server will fan out to. */
  started: boolean
  activePlatforms: Platform[]
  /** Platforms that have already returned a chunk (live or empty). */
  arrived: Set<Platform>
  listings: StreamedListing[]
  tallies: { deal: number; fair: number; bin: number }
  fetchedAt: string | null
  done: boolean
  error: string | null
}

const initial: State = {
  ref: null,
  refResolved: false,
  refCandidates: [],
  started: false,
  activePlatforms: [],
  arrived: new Set(),
  listings: [],
  tallies: { deal: 0, fair: 0, bin: 0 },
  fetchedAt: null,
  done: false,
  error: null,
}

const FALLBACK_PLATFORMS: Platform[] = ["subito", "vinted", "wallapop", "ebay"]

export function SearchStream({ query, sort, statusStrip }: Props) {
  const [state, setState] = useState<State>(initial)
  // Track the latest query string so we can ignore in-flight chunks from a
  // stale stream when the user changes filters/keyword mid-flight.
  const activeQueryRef = useRef(query)

  useEffect(() => {
    activeQueryRef.current = query
    setState(initial)

    const controller = new AbortController()
    const url = `/api/search/stream?${query}`

    void streamNdjson(url, controller.signal, (event) => {
      if (activeQueryRef.current !== query) return
      setState((prev) => reduce(prev, event))
    }).catch((err: unknown) => {
      if (controller.signal.aborted) return
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "stream failed",
        done: true,
      }))
    })

    return () => controller.abort()
  }, [query])

  const sorted = sortListings(state.listings, sort)
  const expectedPlatforms =
    state.activePlatforms.length > 0 ? state.activePlatforms : FALLBACK_PLATFORMS
  const pendingPlatforms = expectedPlatforms.filter((p) => !state.arrived.has(p))
  const allArrived = pendingPlatforms.length === 0
  // Each pending adapter gets ~2 skeletons so the loading area visibly shrinks
  // as adapters report. Cap at 3 to keep the page from looking bottomless.
  const skeletonCount = Math.min(pendingPlatforms.length * 2, 8)

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      <FilterSidebar tallies={state.tallies} />

      <section className="space-y-8">
        {statusStrip}

        {state.refResolved ? (
          <RefMatch matched={state.ref} candidates={state.refCandidates} />
        ) : (
          <RefMatchSkeleton />
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <TallyPill tier="deal" count={state.tallies.deal} total={state.listings.length} loading={state.listings.length === 0 && !state.done} />
          <TallyPill tier="fair" count={state.tallies.fair} total={state.listings.length} loading={state.listings.length === 0 && !state.done} />
          <TallyPill tier="bin" count={state.tallies.bin} total={state.listings.length} loading={state.listings.length === 0 && !state.done} />
          <span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            {state.listings.length} annunci
            {state.done && state.fetchedAt ? (
              <>
                {" · "}
                <span className="normal-case tracking-normal">
                  fetched {new Date(state.fetchedAt).toLocaleTimeString("it-IT")}
                </span>
              </>
            ) : pendingPlatforms.length > 0 ? (
              <>
                {" · "}
                <span className="normal-case tracking-normal text-deal-deep">
                  in arrivo da {pendingPlatforms.map((p) => PLATFORM_LABELS[p] ?? p).join(", ")}…
                </span>
              </>
            ) : (
              <>
                {" · "}
                <span className="normal-case tracking-normal text-ink-muted">
                  elaborazione…
                </span>
              </>
            )}
          </span>
        </div>

        {state.error ? (
          <div className="border-2 border-bin border-dashed p-6 text-sm">
            <div className="font-mono text-[11px] uppercase tracking-widest text-bin">
              Errore stream
            </div>
            <div className="mt-1 text-ink-soft">{state.error}</div>
          </div>
        ) : null}

        {sorted.length === 0 && state.done ? (
          <div className="border-2 border-ink border-dashed p-10 text-center">
            <div className="display text-2xl font-bold">Nessun match con i filtri attuali.</div>
            <p className="mt-2 text-ink-muted">Prova ad allargare il prezzo o a riattivare più marketplace.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
            {!allArrived && skeletonCount > 0 && (
              <SkeletonStack count={skeletonCount} />
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function reduce(prev: State, event: SearchStreamEvent): State {
  switch (event.kind) {
    case "start":
      return {
        ...prev,
        started: true,
        activePlatforms: event.activePlatforms,
        refCandidates: event.refCandidates,
      }
    case "ref":
      return { ...prev, ref: event.ref, refResolved: true }
    case "chunk": {
      const arrived = new Set(prev.arrived)
      arrived.add(event.platform)
      const seen = new Set(prev.listings.map((l) => l.id))
      const merged = prev.listings.concat(
        event.listings.filter((l) => !seen.has(l.id)),
      )
      return {
        ...prev,
        listings: merged,
        tallies: event.tallies,
        arrived,
      }
    }
    case "done":
      return {
        ...prev,
        fetchedAt: event.fetchedAt,
        tallies: event.tallies,
        done: true,
      }
    case "error":
      return { ...prev, error: event.message, done: true }
  }
}

function sortListings(
  listings: StreamedListing[],
  sort: Props["sort"],
): StreamedListing[] {
  const out = [...listings]
  switch (sort) {
    case "price-asc":
      out.sort((a, b) => a.priceCents - b.priceCents)
      return out
    case "price-desc":
      out.sort((a, b) => b.priceCents - a.priceCents)
      return out
    case "posted-desc":
      out.sort(
        (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      )
      return out
    case "score":
    default:
      out.sort((a, b) => {
        const d = b.rank - a.rank
        if (d !== 0) return d
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
      })
      return out
  }
}

/**
 * Read an NDJSON stream and invoke `onEvent` for each parsed line.
 * Handles split chunks (a JSON line may straddle two TCP frames) by buffering
 * up to the last newline.
 */
async function streamNdjson(
  url: string,
  signal: AbortSignal,
  onEvent: (event: SearchStreamEvent) => void,
): Promise<void> {
  const res = await fetch(url, { signal, headers: { Accept: "application/x-ndjson" } })
  if (!res.ok || !res.body) {
    throw new Error(`stream HTTP ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let newlineIdx = buffer.indexOf("\n")
    while (newlineIdx >= 0) {
      const line = buffer.slice(0, newlineIdx).trim()
      buffer = buffer.slice(newlineIdx + 1)
      if (line) {
        try {
          onEvent(JSON.parse(line) as SearchStreamEvent)
        } catch {
          // ignore malformed line — server already wrapped fatal errors as
          // {kind:"error"} events
        }
      }
      newlineIdx = buffer.indexOf("\n")
    }
  }
  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer.trim()) as SearchStreamEvent)
    } catch {
      /* ignore */
    }
  }
}

function TallyPill({
  tier,
  count,
  total,
  loading,
}: {
  tier: "deal" | "fair" | "bin"
  count: number
  total: number
  loading: boolean
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="inline-flex items-center gap-2">
      <ScoreBadge
        size="sm"
        score={{
          tier,
          delta: 0,
          percent: 0,
          ref: 0,
          refSource: "cardmarket",
        }}
      />
      {loading ? (
        <>
          <span className="font-mono tabular text-sm font-bold text-ink-muted">—</span>
          <span className="font-mono text-[11px] text-ink-faint">···</span>
        </>
      ) : (
        <>
          <span className="font-mono tabular text-sm font-bold">{count}</span>
          <span className="font-mono text-[11px] text-ink-muted">{pct}%</span>
        </>
      )}
    </div>
  )
}

// ---- Skeletons -------------------------------------------------------------

function SkeletonStack({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} delayMs={Math.min(i * 60, 480)} />
      ))}
    </>
  )
}

/**
 * Match the structure of `<ListingCard>` so when a real card slots in, the
 * layout doesn't jump: same border treatment, same thumbnail box, same row
 * heights. Width-randomized bars give a paper-newsprint feel rather than a
 * uniform shimmer wall.
 */
function SkeletonCard({ delayMs = 0 }: { delayMs?: number }) {
  return (
    <article
      className={cn(
        "group relative bg-surface border-2 border-ink border-l-[6px] border-l-line-strong",
        "overflow-hidden",
      )}
      aria-hidden
    >
      <div
        className="flex gap-0 animate-pulse"
        style={{ animationDelay: `${delayMs}ms` }}
      >
        {/* thumbnail block */}
        <div className="relative shrink-0 w-28 sm:w-32 bg-ink/5 border-r-2 border-ink">
          <div className="w-full aspect-[4/5] bg-ink/10" />
          <div className="absolute bottom-0 left-0 right-0 h-[18px] bg-ink/40" />
        </div>

        {/* body */}
        <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-4 w-[78%]" />
              <SkeletonBar className="h-4 w-[52%]" />
            </div>
            <SkeletonBar className="h-6 w-16 shrink-0" />
          </div>

          {/* meta row */}
          <div className="mt-3 flex items-center gap-2">
            <SkeletonBar className="h-3 w-12" />
            <SkeletonBar className="h-3 w-10" />
            <SkeletonBar className="h-3 w-14" />
            <SkeletonBar className="h-3 w-10" />
          </div>

          {/* price + ref row */}
          <div className="mt-auto pt-4 flex items-end justify-between gap-4">
            <div className="space-y-2">
              <SkeletonBar className="h-7 w-28 bg-ink/15" />
              <SkeletonBar className="h-3 w-24" />
            </div>
            <div className="text-right space-y-2">
              <SkeletonBar className="h-2.5 w-20 ml-auto" />
              <SkeletonBar className="h-3.5 w-16 ml-auto" />
            </div>
          </div>

          {/* action row */}
          <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
            <SkeletonBar className="h-2.5 w-[40%]" />
            <SkeletonBar className="h-2.5 w-20" />
          </div>
        </div>
      </div>
    </article>
  )
}

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("bg-ink/10 rounded-[1px]", className)} />
}

function RefMatchSkeleton() {
  return (
    <div className="rule-double pt-5" aria-hidden>
      <div className="flex items-start justify-between gap-5 flex-wrap animate-pulse">
        <div className="min-w-0 space-y-2 flex-1">
          <SkeletonBar className="h-2.5 w-44" />
          <SkeletonBar className="h-5 w-[60%]" />
          <div className="pt-2">
            <SkeletonBar className="h-6 w-40" />
          </div>
        </div>
        <div className="text-right shrink-0 space-y-2">
          <SkeletonBar className="h-2.5 w-10 ml-auto" />
          <SkeletonBar className="h-9 w-24 ml-auto bg-ink/15" />
        </div>
      </div>
    </div>
  )
}
