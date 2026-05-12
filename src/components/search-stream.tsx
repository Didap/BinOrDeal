"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ListingCard } from "@/components/listing-card"
import { RefMatch } from "@/components/ref-match"
import { ThresholdEditor } from "@/components/threshold-editor"
import { ScoreBadge } from "@/components/score-badge"
import {
  RefMatchSkeleton,
  SkeletonStack,
} from "@/components/skeletons"
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
  /** Wallclock time when this stream started (component mount). Used to show
   *  the user how long it took to get the first result vs. completion. */
  streamStartedAt: number
  /** Wallclock time when the first `chunk` event landed. */
  firstChunkAt: number | null
  /** Wallclock time when the `done` event landed. */
  doneAt: number | null
  /** User-specific thresholds for the current product. */
  customThresholds?: {
    deal?: number
    bin?: number
    dealPriceCents?: number
    binPriceCents?: number
  }
}

function makeInitial(): State {
  return {
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
    streamStartedAt: Date.now(),
    firstChunkAt: null,
    doneAt: null,
  }
}

const FALLBACK_PLATFORMS: Platform[] = ["subito", "vinted", "wallapop", "ebay"]

export function SearchStream({ query, sort, statusStrip }: Props) {
  const [state, setState] = useState<State>(makeInitial)
  // Track the latest query string so we can ignore in-flight chunks from a
  // stale stream when the user changes filters/keyword mid-flight.
  const activeQueryRef = useRef(query)

  useEffect(() => {
    activeQueryRef.current = query
    setState(makeInitial())

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
          <div className="space-y-4">
            <RefMatch matched={state.ref} candidates={state.refCandidates} />
            {state.ref && state.ref.productId && state.ref.refSource !== "heuristic" && (
              <ThresholdEditor
                productId={state.ref.productId}
                marketRefCents={state.ref.refPriceCents}
                initialDealPriceCents={state.customThresholds?.dealPriceCents}
                initialBinPriceCents={state.customThresholds?.binPriceCents}
                onSaved={() => {
                  // Re-fetching or re-running search would be ideal, 
                  // but for now we just show it's saved.
                }}
              />
            )}
          </div>
        ) : (
          <RefMatchSkeleton />
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <TallyPill tier="deal" count={state.tallies.deal} total={state.listings.length} loading={state.listings.length === 0 && !state.done} />
          <TallyPill tier="fair" count={state.tallies.fair} total={state.listings.length} loading={state.listings.length === 0 && !state.done} />
          <TallyPill tier="bin" count={state.tallies.bin} total={state.listings.length} loading={state.listings.length === 0 && !state.done} />
          <div className="ml-auto flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            <span>{state.listings.length} annunci</span>
            {state.done && state.doneAt ? (
              <span className="normal-case tracking-normal">
                {state.firstChunkAt
                  ? `1° in ${formatSeconds(state.firstChunkAt - state.streamStartedAt)} · totale ${formatSeconds(state.doneAt - state.streamStartedAt)}`
                  : `totale ${formatSeconds(state.doneAt - state.streamStartedAt)}`}
              </span>
            ) : (
              <>
                <ElapsedClock since={state.streamStartedAt} />
                <span className="normal-case tracking-normal text-deal-deep">
                  {pendingPlatforms.length > 0
                    ? `${pendingPlatforms.map((p) => PLATFORM_LABELS[p] ?? p).join(", ")} in arrivo…`
                    : "elaborazione…"}
                </span>
              </>
            )}
          </div>
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
      return { 
        ...prev, 
        ref: event.ref, 
        refResolved: true,
        customThresholds: event.customThresholds
      }
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
        firstChunkAt: prev.firstChunkAt ?? Date.now(),
      }
    }
    case "adapter_done": {
      const arrived = new Set(prev.arrived)
      arrived.add(event.platform)
      return { ...prev, arrived }
    }
    case "done":
      return {
        ...prev,
        fetchedAt: event.fetchedAt,
        tallies: event.tallies,
        done: true,
        doneAt: Date.now(),
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
 * Read a Server-Sent Events stream (text/event-stream) and invoke `onEvent`
 * for each `data: {...}` frame. We use fetch + ReadableStream rather than
 * the EventSource API because EventSource auto-reconnects on close — wrong
 * behavior for a one-shot search whose `done` event closes the stream.
 *
 * Frame format we accept: lines of the form `data: <json>` terminated by a
 * blank line. Comments (`: ...`) and other event types are ignored. The
 * reader buffers across TCP chunk boundaries.
 */
async function streamNdjson(
  url: string,
  signal: AbortSignal,
  onEvent: (event: SearchStreamEvent) => void,
): Promise<void> {
  const res = await fetch(url, {
    signal,
    headers: { Accept: "text/event-stream" },
    // Defensive: avoid fetch's HTTP cache reusing a previous stream.
    cache: "no-store",
  })
  if (!res.ok || !res.body) {
    throw new Error(`stream HTTP ${res.status}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  const flushFrame = (frame: string) => {
    // An SSE frame is one or more lines; collect contiguous `data:` lines
    // and concat their payloads (per spec, joined by '\n'). We only emit
    // when we have a non-empty data payload.
    const dataLines: string[] = []
    for (const raw of frame.split("\n")) {
      const line = raw.replace(/\r$/, "")
      if (line.startsWith(":")) continue // comment / heartbeat
      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).replace(/^\s/, ""))
      }
    }
    if (dataLines.length === 0) return
    const json = dataLines.join("\n")
    try {
      onEvent(JSON.parse(json) as SearchStreamEvent)
    } catch {
      // ignore malformed frame — server wraps fatals as {kind:"error"}
    }
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // Frames are terminated by a blank line (\n\n). Some servers/proxies
    // may use \r\n\r\n; normalize first.
    buffer = buffer.replace(/\r\n/g, "\n")
    let split = buffer.indexOf("\n\n")
    while (split >= 0) {
      flushFrame(buffer.slice(0, split))
      buffer = buffer.slice(split + 2)
      split = buffer.indexOf("\n\n")
    }
  }
  if (buffer.trim()) flushFrame(buffer)
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

/**
 * Live clock that ticks once per 100ms during loading. Stops being mounted
 * once the stream is `done`, so it doesn't keep firing setInterval forever.
 */
function ElapsedClock({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="font-mono tabular text-[11px] text-deal-deep">
      {formatSeconds(now - since)}
    </span>
  )
}

function formatSeconds(ms: number): string {
  if (ms < 0) ms = 0
  return `${(ms / 1000).toFixed(1)}s`
}
