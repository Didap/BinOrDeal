import { cn } from "@/lib/cn"

/**
 * Reusable skeletons for the /search route. Shape-matches `<ListingCard>` and
 * `<RefMatch>` so when real data slots in, the layout doesn't reflow.
 *
 * These are server components (no "use client") so they can be used both from
 * `app/search/loading.tsx` (rendered instantly during navigation) and from
 * the streaming client component while chunks are still in flight.
 */

export function SkeletonStack({
  count,
  startIndex = 0,
}: {
  count: number
  /** Stagger animation-delay across multiple stacks rendered sequentially. */
  startIndex?: number
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} delayMs={Math.min((startIndex + i) * 60, 480)} />
      ))}
    </>
  )
}

export function SkeletonCard({ delayMs = 0 }: { delayMs?: number }) {
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
        <div className="relative shrink-0 w-28 sm:w-32 bg-ink/5 border-r-2 border-ink">
          <div className="w-full aspect-[4/5] bg-ink/10" />
          <div className="absolute bottom-0 left-0 right-0 h-[18px] bg-ink/40" />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <SkeletonBar className="h-4 w-[78%]" />
              <SkeletonBar className="h-4 w-[52%]" />
            </div>
            <SkeletonBar className="h-6 w-16 shrink-0" />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <SkeletonBar className="h-3 w-12" />
            <SkeletonBar className="h-3 w-10" />
            <SkeletonBar className="h-3 w-14" />
            <SkeletonBar className="h-3 w-10" />
          </div>

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

          <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
            <SkeletonBar className="h-2.5 w-[40%]" />
            <SkeletonBar className="h-2.5 w-20" />
          </div>
        </div>
      </div>
    </article>
  )
}

export function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("bg-ink/10 rounded-[1px]", className)} />
}

export function RefMatchSkeleton() {
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

/**
 * Static placeholder for the FilterSidebar — used by `loading.tsx` only.
 * The actual sidebar is interactive (URL-driven) and renders synchronously
 * once the page lands; this is a visual stand-in during the navigation gap.
 */
export function FilterSidebarSkeleton() {
  return (
    <aside className="lg:sticky lg:top-6 space-y-6 text-sm" aria-hidden>
      <SkeletonBlock title="Score">
        <ul className="space-y-1.5">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="w-full h-[42px] border-2 border-ink bg-surface animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </ul>
      </SkeletonBlock>
      <SkeletonBlock title="Marketplace">
        <ul className="grid grid-cols-2 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className="w-full h-[34px] border-2 border-ink bg-surface animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </ul>
      </SkeletonBlock>
      <SkeletonBlock title="Prezzo (€)">
        <div className="grid grid-cols-2 gap-2">
          <div className="w-full h-[38px] border-2 border-ink bg-surface" />
          <div className="w-full h-[38px] border-2 border-ink bg-surface" />
        </div>
      </SkeletonBlock>
    </aside>
  )
}

function SkeletonBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="rule-thick pt-2 pb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink">
        {title}
      </h3>
      {children}
    </section>
  )
}
