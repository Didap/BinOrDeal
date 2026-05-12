export type Vertical = "tcg" | "coins" | "games" | "shoes" | "other"

export type Platform = "ebay" | "vinted" | "wallapop" | "subito"

export type Currency = "EUR" | "USD" | "GBP"

export type Condition =
  | "mint"
  | "near-mint"
  | "excellent"
  | "good"
  | "played"
  | "poor"
  | "unknown"

export type ScoreTier = "deal" | "fair" | "bin" | "unknown"

export type RefSource = "cardmarket" | "numista" | "stockx" | "heuristic"

export interface Score {
  tier: ScoreTier
  /** delta as fraction: (ref - listing) / ref. Positive = cheaper than ref. */
  delta: number
  /** Same as delta but as an integer percent, rounded. */
  percent: number
  /** The reference price used. */
  ref: number
  refSource: RefSource
  /** Human-readable note on why this score (e.g. "near-mint condition"). */
  note?: string
  /** Discriminator for "unknown"-tier listings — lets the UI render the
   *  right chip without re-deriving the cause. */
  flag?: "placeholder" | "too-cheap" | "lottery"
}

export type Provenance = "live" | "fallback"

export interface Listing {
  id: string
  platform: Platform
  url: string
  title: string
  priceCents: number
  currency: Currency
  shippingCents?: number
  thumbnail?: string
  country: "IT" | "ES" | "FR" | "DE" | "NL" | "EU"
  city?: string
  postedAt: string // ISO
  condition: Condition
  seller?: {
    name?: string
    ratings?: number
  }
  /** Whether this listing came from the real marketplace API ("live") or
   *  from the mock generator ("fallback" — used when the adapter is down or
   *  not yet configured). Shown in the UI so users know what's real. */
  provenance: Provenance
  /** Vertical-specific metadata. */
  meta?: Record<string, string | number | boolean | null>
}

export interface ScoredListing extends Listing {
  score: Score
}

export interface CatalogRef {
  vertical: Vertical
  query: string
  refPriceCents: number
  refSource: RefSource
  productName: string
  productId?: string
  /** Vertical-specific metadata. For games: { kind: "console"|"game",
   *  platform?: string (one of GAME_PLATFORMS.id) } */
  meta?: Record<string, string | number | boolean | null>
}

export interface SearchParams {
  q: string
  vertical: Vertical
  minPriceCents?: number
  maxPriceCents?: number
  platforms?: Platform[]
  tiers?: ScoreTier[]
  sort?: "score" | "price-asc" | "price-desc" | "posted-desc"
  /** Games vertical: "console" vs "game" — refines both the marketplace
   *  keyword and the catalog match. */
  gameKind?: "console" | "game"
  /** Games vertical: platform id (e.g. "ps5"), meaningful when gameKind="game". */
  gamePlatform?: string
  /** Shoes vertical: EU size as a string (e.g. "42", "42.5"). */
  shoeSize?: string
  /** Shoes vertical: target gender (uomo/donna/unisex). */
  shoeGender?: "uomo" | "donna" | "unisex"
  /** TCG vertical: specific game subcategory. */
  tcgGame?: "pokemon" | "mtg" | "onepiece"
  /** Pokémon vertical: set id (e.g. "base-set", "evolving-skies"). */
  pokemonSet?: string
  /** Override: force a specific catalog productId as the reference
   *  (when the auto-match picked the wrong product). */
  refOverride?: string
  /** Pokémon vertical: drop listings that look like raffles / mystery boxes
   *  (lotteria, lottery, mistery box, sorteggio, …). When false, lottery-
   *  looking listings are kept but flagged. Default semantics is "true"
   *  for pokemon if not explicitly set; ignored for other verticals. */
  excludeLotteries?: boolean
  /** Optional user-defined thresholds (deltas) for this specific search. */
  customThresholds?: { deal?: number; bin?: number }
  /** User ID for fetching personalized settings. */
  userId?: string
}

export interface SearchResult {
  query: string
  vertical: Vertical
  ref: CatalogRef | null
  /** Candidate catalog refs that matched the query — shown in the
   *  RefMatch "Cambia" dropdown so users can switch the reference. */
  refCandidates: CatalogRef[]
  listings: ScoredListing[]
  fetchedAt: string
  tallies: { deal: number; fair: number; bin: number }
}
