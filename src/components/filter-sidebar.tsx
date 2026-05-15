"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, useEffect } from "react"
import { Filter, X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/cn"
import type { Platform, ScoreTier } from "@/lib/types"
import { PLATFORM_LABELS, TIER_LABELS } from "@/lib/format"

const ALL_PLATFORMS: Platform[] = ["ebay", "vinted", "wallapop", "subito", "facebook"]
const FILTERABLE_TIERS = ["deal", "fair", "bin"] as const

interface Props {
  tallies: { deal: number; fair: number; bin: number }
  className?: string
}

export function FilterSidebar({ tallies, className }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  
  const [minPrice, setMinPrice] = useState(params.get("min") ?? "")
  const [maxPrice, setMaxPrice] = useState(params.get("max") ?? "")

  const currentPlatforms = (params.get("p")?.split(",").filter(Boolean) ?? []) as Platform[]
  const currentTiers = (params.get("t")?.split(",").filter(Boolean) ?? []) as ScoreTier[]

  // Block scroll when mobile filters are open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const activeFilterCount =
    (currentPlatforms.length > 0 ? 1 : 0) +
    (currentTiers.length > 0 ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0)

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())
    if (!value) next.delete(key)
    else next.set(key, value)
    startTransition(() => {
      router.push(`/search?${next.toString()}`, { scroll: false })
    })
  }

  function toggle(key: string, current: string[], value: string) {
    const has = current.includes(value)
    const nextArr = has ? current.filter((v) => v !== value) : [...current, value]
    update(key, nextArr.length ? nextArr.join(",") : null)
  }

  return (
    <>
      {/* Mobile Floating Toggle Button (Bottom Right) */}
      <div className="lg:hidden fixed bottom-32 right-6 z-[100]">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="size-14 flex items-center justify-center bg-ink/95 backdrop-blur-md text-paper border-2 border-ink shadow-[6px_6px_0_var(--deal)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all rounded-full relative"
        >
          <Filter size={22} className="text-deal" strokeWidth={2.5} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-deal text-paper size-6 rounded-full flex items-center justify-center text-[10px] tabular font-bold border-2 border-ink shadow-sm">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Sidebar Content (Desktop + Mobile Drawer) */}
      {/* Mobile Filters Overlay (Dims the header area) */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 bg-ink/20 backdrop-blur-[2px] z-[105] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Content (Desktop + Mobile Full-width) */}
      <aside
        className={cn(
          "lg:block lg:sticky lg:top-6 space-y-6 text-sm transition-all duration-300 ease-out",
          // Mobile specific: Full screen below header
          "fixed top-[64px] inset-x-0 bottom-0 z-[110] w-full bg-paper lg:static lg:inset-auto lg:z-auto lg:bg-transparent lg:w-auto",
          isOpen 
            ? "translate-y-0 opacity-100" 
            : "translate-y-10 opacity-0 pointer-events-none lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto",
          className,
        )}
      >
        <div className="flex flex-col h-full lg:h-auto">
          {/* Internal Title for Mobile */}
          <div className="lg:hidden px-6 pt-8 pb-2">
            <div className="flex items-center justify-between">
              <h2 className="display text-4xl font-black tracking-tightest uppercase leading-none">
                Filtri
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="size-10 flex items-center justify-center border-2 border-ink bg-paper text-ink shadow-[2px_2px_0_var(--ink)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                aria-label="Chiudi filtri"
              >
                <X size={24} />
              </button>
            </div>
            <div className="h-1 bg-ink mt-6 w-full" />
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 lg:p-0 lg:space-y-6">
            <Block title="Score">
              <ul className="space-y-1.5">
                {FILTERABLE_TIERS.map((tier) => {
                  const active = currentTiers.length === 0 || currentTiers.includes(tier)
                  const chip =
                    tier === "deal" ? "bg-deal text-paper" :
                    tier === "fair" ? "bg-fair text-ink" :
                    "bg-bin text-paper"
                  return (
                    <li key={tier}>
                      <button
                        type="button"
                        onClick={() => toggle("t", currentTiers, tier)}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 px-3 py-2.5 border-2 border-ink transition-all",
                          active ? "bg-surface" : "bg-transparent opacity-40 grayscale-[0.5]",
                          "min-h-[48px] lg:min-h-0",
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className={cn("font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 uppercase", chip)}>
                            {TIER_LABELS[tier]}
                          </span>
                          <span className="font-mono text-[11px] text-ink-muted">
                            {tier === "deal" && "sotto mercato"}
                            {tier === "fair" && "prezzo equo"}
                            {tier === "bin" && "sopra mercato"}
                          </span>
                        </span>
                        <span className="font-mono tabular text-xs text-ink-soft">
                          {tallies[tier]}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Block>

            <Block title="Marketplace">
              <ul className="grid grid-cols-2 gap-2">
                {ALL_PLATFORMS.map((p) => {
                  const active = currentPlatforms.length === 0 || currentPlatforms.includes(p)
                  return (
                    <li key={p}>
                      <button
                        type="button"
                        onClick={() => toggle("p", currentPlatforms, p)}
                        className={cn(
                          "w-full px-2.5 py-3 border-2 border-ink font-mono text-[10px] uppercase tracking-widest transition-all",
                          "min-h-[48px] lg:min-h-0",
                          active
                            ? "bg-ink text-paper shadow-[3px_3px_0_var(--deal)]"
                            : "bg-transparent text-ink-muted opacity-40 hover:opacity-100",
                        )}
                      >
                        {PLATFORM_LABELS[p]}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Block>

            <Block title="Prezzo (€)">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-tighter">Minimo</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    onBlur={() => update("min", minPrice || null)}
                    className="w-full border-2 border-ink bg-surface px-3 py-2.5 text-sm font-mono tabular focus:outline-none focus:bg-paper focus:ring-2 focus:ring-deal/20 min-h-[48px] lg:min-h-0"
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-ink-muted uppercase tracking-tighter">Massimo</span>
                  <input
                    type="number"
                    placeholder="max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    onBlur={() => update("max", maxPrice || null)}
                    className="w-full border-2 border-ink bg-surface px-3 py-2.5 text-sm font-mono tabular focus:outline-none focus:bg-paper focus:ring-2 focus:ring-deal/20 min-h-[48px] lg:min-h-0"
                  />
                </div>
              </div>
            </Block>

            <Block title="Ordina per">
              <select
                value={params.get("s") ?? "score"}
                onChange={(e) => update("s", e.target.value === "score" ? null : e.target.value)}
                className="w-full border-2 border-ink bg-surface px-3 py-2.5 text-sm font-mono uppercase tracking-wider cursor-pointer focus:ring-2 focus:ring-deal/20 min-h-[48px] lg:min-h-0"
              >
                <option value="score">Miglior score</option>
                <option value="price-asc">Prezzo: Crescente</option>
                <option value="price-desc">Prezzo: Decrescente</option>
                <option value="posted-desc">Data: Più recenti</option>
              </select>
            </Block>

            <div className="lg:block hidden pt-4">
              <button
                type="button"
                onClick={() => {
                  setMinPrice(""); setMaxPrice("")
                  startTransition(() => router.push("/search?" + new URLSearchParams({
                    q: params.get("q") ?? "",
                    v: params.get("v") ?? "pokemon",
                  }).toString()))
                }}
                className="text-[10px] font-mono uppercase tracking-widest text-ink-muted hover:text-bin underline underline-offset-4 w-fit transition-colors"
              >
                Azzera tutti i filtri
              </button>
            </div>
          </div>

          {/* Mobile Footer - Sticky */}
          <div className="lg:hidden p-6 border-t-2 border-ink bg-paper sticky bottom-0 z-20 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={() => {
                setMinPrice(""); setMaxPrice("")
                startTransition(() => router.push("/search?" + new URLSearchParams({
                  q: params.get("q") ?? "",
                  v: params.get("v") ?? "pokemon",
                }).toString()))
              }}
              className="w-full text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted text-center"
            >
              Reset Filtri
            </button>
            
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full bg-ink text-paper py-4 font-mono font-black uppercase tracking-[0.2em] shadow-[4px_4px_0_var(--deal)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-3 border-2 border-ink"
            >
              Vedi {tallies.deal + tallies.fair + tallies.bin} annunci
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="rule-thick pt-2 pb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ink">
        {title}
      </h3>
      {children}
    </section>
  )
}
