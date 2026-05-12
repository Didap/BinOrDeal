import type { Condition, Listing, Score, ScoreTier } from "@/lib/types"

/**
 * Thresholds tuned for collector categories. See info.md §Deal scoring.
 * delta = (ref - listing) / ref    →  positive = below market
 */
export const THRESHOLDS = {
  deal: 0.18, // ≥18% below ref → DEAL
  bin: -0.08, // >8% above ref → BIN
} as const

/** Multipliers applied to ref price to reflect the listing's stated condition. */
const CONDITION_FACTOR: Record<Condition, number> = {
  mint: 1.0,
  "near-mint": 0.95,
  excellent: 0.88,
  good: 0.78,
  played: 0.62,
  poor: 0.45,
  unknown: 0.9,
}

export function tierOf(
  delta: number,
  customThresholds?: { deal?: number; bin?: number },
): ScoreTier {
  const deal = customThresholds?.deal ?? THRESHOLDS.deal
  const bin = customThresholds?.bin ?? THRESHOLDS.bin
  if (delta >= deal) return "deal"
  if (delta <= bin) return "bin"
  return "fair"
}

interface ScoreInput {
  listingPriceCents: number
  shippingCents?: number
  refPriceCents: number
  refSource: Score["refSource"]
  condition?: Condition
  includeShipping?: boolean
  customThresholds?: { deal?: number; bin?: number }
}

export function scoreAgainstRef(input: ScoreInput): Score {
  const condition = input.condition ?? "unknown"
  const conditionFactor = CONDITION_FACTOR[condition]
  const adjustedRef = Math.round(input.refPriceCents * conditionFactor)

  const effectiveListing =
    input.listingPriceCents + (input.includeShipping ? input.shippingCents ?? 0 : 0)

  const delta = (adjustedRef - effectiveListing) / adjustedRef

  return {
    tier: tierOf(delta, input.customThresholds),
    delta,
    percent: Math.round(delta * 100),
    ref: adjustedRef,
    refSource: input.refSource,
    note:
      condition !== "unknown" && conditionFactor !== 1
        ? `ref adjusted for ${condition.replace("-", " ")}`
        : undefined,
  }
}

export function scoreListing(
  listing: Listing,
  refPriceCents: number,
  refSource: Score["refSource"],
  customThresholds?: { deal?: number; bin?: number },
): Score {
  return scoreAgainstRef({
    listingPriceCents: listing.priceCents,
    shippingCents: listing.shippingCents,
    refPriceCents,
    refSource,
    condition: listing.condition,
    customThresholds,
  })
}

export function tallyTiers(scores: Score[]): { deal: number; fair: number; bin: number } {
  const tallies = { deal: 0, fair: 0, bin: 0 }
  for (const s of scores) {
    if (s.tier === "deal" || s.tier === "fair" || s.tier === "bin") {
      tallies[s.tier] += 1
    }
    // "unknown" tier (placeholder prices) is intentionally not tallied.
  }
  return tallies
}
