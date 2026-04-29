import type { CatalogAdapter } from "./types"
import { resolveCatalog } from "@/lib/mock/catalog"
import { POKEMON_SETS_BY_ID } from "@/lib/pokemon"
import { scrapeCardmarketPrice } from "./cardmarket-scrape"

/**
 * Cardmarket catalog adapter.
 *
 *   Official API status: 2026 — registrations CLOSED ("we are not accepting
 *   applications for API access at this time"). Until that lifts, we
 *   fall back to scraping Cardmarket's public product pages with
 *   Playwright — same pattern we use for Wallapop. See cardmarket-scrape.ts.
 *
 *   Path: when the mock catalog entry has `meta.set` + `meta.cardmarketSlug`
 *   we can construct the product URL and fetch live Price Trend. When it
 *   doesn't, we return the mock ref as-is (status "stub").
 *
 *   In-process cache keeps scrape results for 1h so rapid re-searches
 *   don't spawn a new browser per request.
 */

type CacheEntry = { prices: Awaited<ReturnType<typeof scrapeCardmarketPrice>>; expires: number }
const CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

export const cardmarketAdapter: CatalogAdapter = {
  source: "cardmarket",
  label: "Cardmarket",
  // We're functional but non-official. Keep "stub" label honest until
  // the API re-opens or we add live auto-refresh.
  status: "stub",
  async lookup(query, vertical, opts = {}) {
    const ref = resolveCatalog(query, vertical, { pokemonSet: opts.pokemonSet })
    if (!ref) return null

    // Try live scrape only when we have enough metadata to build the URL.
    const setId = (ref.meta?.set as string | undefined) ?? opts.pokemonSet
    const cardSlug = ref.meta?.cardmarketSlug as string | undefined
    const setSlug = setId ? POKEMON_SETS_BY_ID[setId]?.cardmarketSlug : undefined

    if (setSlug && cardSlug) {
      const cacheKey = `${setSlug}/${cardSlug}`
      const cached = CACHE.get(cacheKey)
      let prices = cached && cached.expires > Date.now() ? cached.prices : null
      if (!prices) {
        try {
          prices = await scrapeCardmarketPrice(setSlug, cardSlug)
          CACHE.set(cacheKey, { prices, expires: Date.now() + CACHE_TTL_MS })
        } catch (e) {
          console.warn("[cardmarket] scrape failed:", e instanceof Error ? e.message : e)
        }
      }
      if (prices) {
        return {
          refPriceCents: prices.trendCents,
          productName: ref.productName,
          productId: ref.productId,
        }
      }
    }

    // Fall back to the mock ref price.
    return {
      refPriceCents: ref.refPriceCents,
      productName: ref.productName,
      productId: ref.productId,
    }
  },
}
