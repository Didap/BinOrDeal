import type { Listing, Platform, RefSource, Vertical } from "@/lib/types"

export interface AdapterQuery {
  q: string
  vertical: Vertical
  limit?: number
  country?: "IT" | "ES" | "FR" | "DE" | "NL"
}

export interface MarketplaceAdapter {
  platform: Platform
  label: string
  /** Rate budget the adapter must respect (requests per window). */
  rateBudget: { requests: number; windowSeconds: number }
  /** User-initiated only. Server-side proxy. Never cache listings. */
  search: (q: AdapterQuery, signal?: AbortSignal) => Promise<Listing[]>
  /** Whether this adapter is currently available in prod. */
  status: "live" | "stub" | "down"
}

export interface CatalogLookupOpts {
  kind?: "console" | "game"
  platform?: string
  pokemonSet?: string
  signal?: AbortSignal
}

export interface CatalogAdapter {
  source: Exclude<RefSource, "heuristic">
  label: string
  lookup: (
    query: string,
    vertical: Vertical,
    opts?: CatalogLookupOpts,
  ) => Promise<{ refPriceCents: number; productName: string; productId?: string } | null>
  status: "live" | "stub" | "down"
}
