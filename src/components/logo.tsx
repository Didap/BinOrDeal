import { cn } from "@/lib/cn"

interface Props {
  size?: "sm" | "md" | "lg"
  className?: string
}

/**
 * Wordmark: "Bin" (ink) + "or" (italic Fraunces) + "Deal" (deal-green).
 * The chromatic answer sits inside the logo itself.
 */
export function Logo({ size = "md", className }: Props) {
  return (
    <span
      className={cn(
        "display font-black leading-none tracking-tightest inline-flex items-baseline",
        size === "sm" && "text-[20px]",
        size === "md" && "text-[28px]",
        size === "lg" && "text-[40px]",
        className,
      )}
    >
      <span className="text-bin">Bin</span>
      <span
        className="mx-[0.22em] italic font-light text-ink-muted"
        style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
      >
        or
      </span>
      <span className="text-deal">Deal</span>
      <span
        className={cn(
          "text-ink",
          size === "sm" && "text-[20px]",
          size === "md" && "text-[28px]",
          size === "lg" && "text-[40px]",
        )}
        aria-hidden
      >
        ?
      </span>
    </span>
  )
}
