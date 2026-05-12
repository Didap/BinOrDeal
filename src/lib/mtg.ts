/**
 * Magic: The Gathering sets catalog (curated).
 */
export interface MtgSet {
  id: string
  label: string
  keyword: string
  cardmarketSlug?: string
  era: "standard" | "modern" | "vintage"
}

export const MTG_SETS: MtgSet[] = [
  { id: "alpha", label: "Alpha", keyword: "alpha limited edition", cardmarketSlug: "Alpha", era: "vintage" },
  { id: "beta", label: "Beta", keyword: "beta limited edition", cardmarketSlug: "Beta", era: "vintage" },
  { id: "modern-horizons-3", label: "Modern Horizons 3", keyword: "modern horizons 3", cardmarketSlug: "Modern-Horizons-3", era: "modern" },
  { id: "foundations", label: "Foundations", keyword: "foundations", cardmarketSlug: "Foundations", era: "standard" },
  { id: "bloomburrow", label: "Bloomburrow", keyword: "bloomburrow", cardmarketSlug: "Bloomburrow", era: "standard" },
]

export const MTG_SETS_BY_ID: Record<string, MtgSet> = Object.fromEntries(
  MTG_SETS.map((s) => [s.id, s]),
)
