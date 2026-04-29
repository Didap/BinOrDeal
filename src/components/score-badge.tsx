import { cn } from "@/lib/cn"
import type { Score } from "@/lib/types"
import { TIER_LABELS } from "@/lib/format"

interface Props {
  score: Score
  size?: "sm" | "md" | "lg"
  variant?: "ticker" | "stamp" | "bar"
}

/**
 * The product is this badge. Every visual decision around it must amplify
 * the score's legibility at a glance. Three visual variants depending on context.
 */
export function ScoreBadge({ score, size = "md", variant = "ticker" }: Props) {
  const tier = score.tier
  const label = TIER_LABELS[tier]
  const pct = Math.abs(score.percent)
  // positive delta = CHEAPER than ref → display minus sign on the discount
  const pctStr = score.delta >= 0 ? `−${pct}%` : `+${pct}%`

  const palette = {
    deal: { bg: "bg-deal", ink: "text-paper" },
    fair: { bg: "bg-fair", ink: "text-ink" },
    bin: { bg: "bg-bin", ink: "text-paper" },
    unknown: { bg: "bg-paper-deep", ink: "text-ink-muted" },
  }[tier]

  if (tier === "unknown") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono font-bold tracking-wider",
          "px-2 py-0.5 rounded-[2px] border border-line-strong",
          "bg-transparent text-ink-muted",
          size === "sm" && "text-[10px] py-[1px] px-1.5",
          size === "md" && "text-xs",
          size === "lg" && "text-sm py-1 px-2.5",
        )}
        title="Prezzo non indicato dal venditore"
      >
        <span aria-hidden>?</span>
        <span>{label}</span>
      </span>
    )
  }

  if (variant === "stamp") {
    return (
      <div
        className={cn(
          "stamp inline-flex flex-col items-start leading-none",
          "border-[2.5px] border-current",
          "px-2.5 py-1.5",
          tier === "deal" && "text-deal",
          tier === "fair" && "text-fair",
          tier === "bin" && "text-bin",
          size === "sm" && "text-[11px]",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
        )}
      >
        <span className="display font-black uppercase tracking-tightest">
          {label}
        </span>
        <span className="font-mono tabular text-[0.75em] opacity-80">
          {pctStr}
        </span>
      </div>
    )
  }

  if (variant === "bar") {
    return (
      <div
        className={cn(
          "inline-flex items-stretch",
          size === "sm" && "text-[11px]",
          size === "md" && "text-xs",
          size === "lg" && "text-sm",
        )}
      >
        <span className={cn("w-1", palette.bg)} aria-hidden />
        <span className="bg-ink text-paper px-1.5 py-0.5 font-mono font-bold tracking-wider tabular">
          {label}
        </span>
        <span className={cn("px-1.5 py-0.5 font-mono font-bold tabular", palette.bg, palette.ink)}>
          {pctStr}
        </span>
      </div>
    )
  }

  // ticker
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-bold tracking-wider tabular",
        "px-2 py-0.5 rounded-[2px]",
        palette.bg,
        palette.ink,
        size === "sm" && "text-[10px] py-[1px] px-1.5",
        size === "md" && "text-xs",
        size === "lg" && "text-sm py-1 px-2.5",
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-80" />
      <span>{label}</span>
      <span className="opacity-85">{pctStr}</span>
    </span>
  )
}
