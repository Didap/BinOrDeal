/**
 * One Piece TCG sets catalog (curated).
 */
export interface OnePieceSet {
  id: string
  label: string
  keyword: string
  cardmarketSlug?: string
  era: "east-blue" | "grand-line" | "new-world"
}

export const ONEPIECE_SETS: OnePieceSet[] = [
  { id: "op-01", label: "Romance Dawn", keyword: "romance dawn op-01", cardmarketSlug: "Romance-Dawn", era: "east-blue" },
  { id: "op-05", label: "Awakening of the New Era", keyword: "awakening of the new era op-05", cardmarketSlug: "Awakening-of-the-New-Era", era: "grand-line" },
  { id: "op-09", label: "The New Emperor", keyword: "the new emperor op-09", cardmarketSlug: "The-New-Emperor", era: "new-world" },
]

export const ONEPIECE_SETS_BY_ID: Record<string, OnePieceSet> = Object.fromEntries(
  ONEPIECE_SETS.map((s) => [s.id, s]),
)
