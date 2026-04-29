"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { cn } from "@/lib/cn"
import type { Platform, ScoreTier } from "@/lib/types"
import { PLATFORM_LABELS, TIER_LABELS } from "@/lib/format"

const ALL_PLATFORMS: Platform[] = ["ebay", "vinted", "wallapop", "subito"]
// Only real-score tiers are filterable. "unknown" is a visual state, not a
// classification the user chose to apply to real listings.
const FILTERABLE_TIERS = ["deal", "fair", "bin"] as const

interface Props {
  tallies: { deal: number; fair: number; bin: number }
}

export function FilterSidebar({ tallies }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const currentPlatforms = (params.get("p")?.split(",").filter(Boolean) ?? []) as Platform[]
  const currentTiers = (params.get("t")?.split(",").filter(Boolean) ?? []) as ScoreTier[]
  const [minPrice, setMinPrice] = useState(params.get("min") ?? "")
  const [maxPrice, setMaxPrice] = useState(params.get("max") ?? "")

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
    <aside className="lg:sticky lg:top-6 space-y-6 text-sm">
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
                    "w-full flex items-center justify-between gap-3 px-2.5 py-2 border-2 border-ink transition-all",
                    active ? "bg-surface" : "bg-transparent opacity-55",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className={cn("font-mono text-[10px] font-bold tracking-widest px-1.5 py-0.5", chip)}>
                      {TIER_LABELS[tier]}
                    </span>
                    <span className="font-mono text-[11px] text-ink-muted">
                      {tier === "deal" && "sotto il mercato"}
                      {tier === "fair" && "prezzo equo"}
                      {tier === "bin" && "sopra il mercato"}
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
        <ul className="grid grid-cols-2 gap-1.5">
          {ALL_PLATFORMS.map((p) => {
            const active = currentPlatforms.length === 0 || currentPlatforms.includes(p)
            return (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => toggle("p", currentPlatforms, p)}
                  className={cn(
                    "w-full px-2.5 py-2 border-2 border-ink font-mono text-[11px] uppercase tracking-widest transition-all",
                    active
                      ? "bg-ink text-paper"
                      : "bg-transparent text-ink-muted opacity-55 hover:opacity-90",
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
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={() => update("min", minPrice || null)}
            className="w-full border-2 border-ink bg-surface px-2.5 py-2 text-sm font-mono tabular focus:outline-none focus:bg-paper"
          />
          <input
            type="number"
            placeholder="max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={() => update("max", maxPrice || null)}
            className="w-full border-2 border-ink bg-surface px-2.5 py-2 text-sm font-mono tabular focus:outline-none focus:bg-paper"
          />
        </div>
      </Block>

      <Block title="Ordina">
        <select
          value={params.get("s") ?? "score"}
          onChange={(e) => update("s", e.target.value === "score" ? null : e.target.value)}
          className="w-full border-2 border-ink bg-surface px-2.5 py-2 text-sm font-mono uppercase tracking-wider cursor-pointer"
        >
          <option value="score">Miglior score</option>
          <option value="price-asc">Prezzo ↑</option>
          <option value="price-desc">Prezzo ↓</option>
          <option value="posted-desc">Più recenti</option>
        </select>
      </Block>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            setMinPrice(""); setMaxPrice("")
            startTransition(() => router.push("/search?" + new URLSearchParams({
              q: params.get("q") ?? "",
              v: params.get("v") ?? "pokemon",
            }).toString()))
          }}
          className="text-[11px] font-mono uppercase tracking-widest text-ink-muted hover:text-bin underline decoration-dotted underline-offset-4"
        >
          Azzera filtri
        </button>
      </div>
    </aside>
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
