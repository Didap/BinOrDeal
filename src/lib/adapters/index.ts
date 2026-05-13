import { ebayAdapter } from "./ebay"
import { vintedAdapter } from "./vinted"
import { wallapopAdapter } from "./wallapop"
import { subitoAdapter } from "./subito"
import { cardmarketAdapter } from "./cardmarket"
import { numistaAdapter } from "./numista"
import { stockxAdapter } from "./stockx"
import { facebookAdapter } from "./facebook"
import type { MarketplaceAdapter, CatalogAdapter } from "./types"
import type { Vertical } from "@/lib/types"

export const marketplaceAdapters: MarketplaceAdapter[] = [
  ebayAdapter,
  vintedAdapter,
  wallapopAdapter,
  subitoAdapter,
  facebookAdapter,
]

export const catalogAdapters: Record<Vertical, CatalogAdapter> = {
  tcg: cardmarketAdapter,
  coins: numistaAdapter,
  games: stockxAdapter,
  shoes: stockxAdapter,
  other: {
    source: "heuristic",
    label: "Euristica",
    status: "live",
    async lookup() { return null }
  }
}

export { 
  ebayAdapter, 
  vintedAdapter, 
  wallapopAdapter, 
  subitoAdapter, 
  facebookAdapter,
  cardmarketAdapter, 
  numistaAdapter, 
  stockxAdapter 
}
