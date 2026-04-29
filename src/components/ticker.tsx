import { cn } from "@/lib/cn"

interface Tick {
  tier: "deal" | "fair" | "bin"
  label: string
  delta: number
}

const TICKS: Tick[] = [
  { tier: "deal", label: "Charizard base ITA NM", delta: -34 },
  { tier: "bin", label: "500 lire argento 1961", delta: 22 },
  { tier: "deal", label: "Blastoise olo shadowless", delta: -28 },
  { tier: "fair", label: "Pikachu base ENG", delta: -4 },
  { tier: "deal", label: "2€ Grecia 2004 olimpiadi", delta: -41 },
  { tier: "bin", label: "Venusaur 1ED ITA", delta: 18 },
  { tier: "fair", label: "Mewtwo base EX", delta: 2 },
  { tier: "deal", label: "50 lire Vulcano 1958 FDC", delta: -26 },
  { tier: "deal", label: "Eevee gold star POP 5", delta: -22 },
  { tier: "bin", label: "Blastoise base PL condition", delta: 31 },
]

export function DealTicker() {
  const tokens = [...TICKS, ...TICKS]
  return (
    <div
      aria-hidden
      className="border-y-2 border-ink bg-ink/[0.04] overflow-hidden select-none"
    >
      <div className="flex items-center">
        <div className="shrink-0 bg-ink text-paper px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-deal pulse-dot" />
          Live feed
        </div>
        <div className="flex-1 overflow-hidden py-2">
          <div className="ticker-track flex gap-10 whitespace-nowrap will-change-transform">
            {tokens.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 font-mono text-xs tabular"
              >
                <span
                  className={cn(
                    "font-bold uppercase tracking-widest",
                    t.tier === "deal" && "text-deal",
                    t.tier === "fair" && "text-fair",
                    t.tier === "bin" && "text-bin",
                  )}
                >
                  {t.tier === "deal" ? "▼" : t.tier === "bin" ? "▲" : "◆"}{" "}
                  {t.tier}
                </span>
                <span className="text-ink-soft">{t.label}</span>
                <span
                  className={cn(
                    "tabular font-bold",
                    t.tier === "deal" && "text-deal",
                    t.tier === "fair" && "text-fair",
                    t.tier === "bin" && "text-bin",
                  )}
                >
                  {t.delta > 0 ? "+" : "−"}
                  {Math.abs(t.delta)}%
                </span>
                <span className="text-ink-faint">—</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
