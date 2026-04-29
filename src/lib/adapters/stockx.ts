import type { CatalogAdapter } from "./types"
import { resolveCatalog } from "@/lib/mock/catalog"

/**
 * StockX catalog adapter.
 *
 *   Reference price source: StockX "Last Sale" (most honest signal — what
 *   the market actually cleared) with fallback to Lowest Ask for items
 *   with sparse sales history.
 *
 *   Integration paths, in order of preference:
 *     1. StockX Developer API — https://developer.stockx.com/
 *        Official, requires vendor approval. Returns structured product data
 *        with sales comps. No WAF to fight.
 *     2. Unofficial `/api/browse` used by their web app —
 *        reverse-engineered, behind WAF like Wallapop. If we go this route
 *        we reuse the Playwright pattern from the wallapop adapter.
 *
 *   For MVP this is a stub that reads from our mock catalog. Two verticals
 *   already resolve via this source: `games` (now) and `shoes` (planned).
 */
export const stockxAdapter: CatalogAdapter = {
  source: "stockx",
  label: "StockX",
  status: "stub",
  async lookup(query, vertical, opts = {}) {
    const ref = resolveCatalog(query, vertical, {
      kind: opts.kind,
      platform: opts.platform,
    })
    if (!ref) return null
    return {
      refPriceCents: ref.refPriceCents,
      productName: ref.productName,
      productId: ref.productId,
    }
  },
}
