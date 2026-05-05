import { AdapterStatusStrip } from "@/components/adapter-status-strip"
import { Nav } from "@/components/nav"
import { Footer } from "@/components/footer"
import {
  FilterSidebarSkeleton,
  RefMatchSkeleton,
  SkeletonStack,
} from "@/components/skeletons"

/**
 * Rendered instantly by Next during navigation to /search, while the server
 * works on the actual page render. The shape mirrors `app/search/page.tsx`
 * (hero placeholder, filter sidebar, status strip, ref-match, listing stack)
 * so when the real page arrives nothing visually shifts.
 */
export default function SearchLoading() {
  return (
    <>
      <Nav compact />

      {/* Hero placeholder — same height/border treatment as the real hero so
          the page doesn't pop when it arrives. */}
      <section className="border-b-2 border-ink bg-surface relative">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-8 grid gap-5">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div className="space-y-2 max-w-[60%]">
              <div className="h-3 w-44 bg-ink/10 animate-pulse" />
              <div className="h-12 w-[70%] bg-ink/15 animate-pulse" />
            </div>
            <div className="h-3 w-20 bg-ink/10" />
          </div>
          <div className="h-[58px] w-full bg-surface border-2 border-ink animate-pulse" />
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-5 sm:px-8 py-10 relative z-10">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <FilterSidebarSkeleton />

          <section className="space-y-8">
            <AdapterStatusStrip />
            <RefMatchSkeleton />

            {/* Tally row placeholder */}
            <div className="flex items-center gap-3 flex-wrap">
              {[0, 1, 2].map((i) => (
                <div key={i} className="inline-flex items-center gap-2">
                  <div className="h-5 w-12 bg-ink/15 animate-pulse" />
                  <span className="font-mono tabular text-sm font-bold text-ink-muted">—</span>
                  <span className="font-mono text-[11px] text-ink-faint">···</span>
                </div>
              ))}
              <span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-deal-deep">
                avvio ricerca…
              </span>
            </div>

            <div className="space-y-3">
              <SkeletonStack count={6} />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
