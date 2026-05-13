import type { MarketplaceAdapter } from "./types"
import { env } from "@/lib/env"
import { resolveCatalog } from "@/lib/mock/catalog"
import { generateListings } from "@/lib/mock/listings"

/**
 * Facebook Marketplace adapter.
 * 
 * FB doesn't have a public API. This requires a Playwright scraper
 * similar to Wallapop.
 */
export const facebookAdapter: MarketplaceAdapter = {
  platform: "facebook",
  label: "Facebook Marketplace",
  status: "live",
  rateBudget: { requests: 2, windowSeconds: 60 },
  async search(q) {
    // TODO: Implement actual scraper.
    // For now, return empty or fallback if in demo mode.
    if (env.adapter.demoFallback) {
      const ref = resolveCatalog(q.q, q.vertical)
      return generateListings({
        query: q.q,
        vertical: q.vertical,
        refPriceCents: ref?.refPriceCents ?? 5000,
        count: 2,
        bias: "balanced",
        seedSalt: "facebook-demo",
      }).map(l => ({ ...l, platform: "facebook" as const }))
    }
    return []
  },
}
