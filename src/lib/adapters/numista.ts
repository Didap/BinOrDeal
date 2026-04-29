import type { CatalogAdapter } from "./types"
import { resolveCatalog } from "@/lib/mock/catalog"

/**
 * Numista catalog adapter.
 *   Source: https://en.numista.com/
 *   No public API documented — two integration paths:
 *     (a) partnership/API access request (preferred)
 *     (b) scraping of static catalog pages — data is encyclopedic/public
 *
 * For MVP this is stubbed. Ref price comes from known category averages +
 * condition adjustments. Numista itself exposes estimates in several grades;
 * the median of BB / SPL is a reasonable starting point.
 */
export const numistaAdapter: CatalogAdapter = {
  source: "numista",
  label: "Numista",
  status: "stub",
  async lookup(query, vertical, _opts = {}) {
    const ref = resolveCatalog(query, vertical)
    if (!ref) return null
    return {
      refPriceCents: ref.refPriceCents,
      productName: ref.productName,
      productId: ref.productId,
    }
  },
}
