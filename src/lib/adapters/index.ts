import { ebayAdapter } from "./ebay"
import { vintedAdapter } from "./vinted"
import { wallapopAdapter } from "./wallapop"
import { subitoAdapter } from "./subito"
import { cardmarketAdapter } from "./cardmarket"
import { numistaAdapter } from "./numista"
import { stockxAdapter } from "./stockx"
import type { MarketplaceAdapter, CatalogAdapter } from "./types"
import type { Vertical } from "@/lib/types"

export const marketplaceAdapters: MarketplaceAdapter[] = [
  ebayAdapter,
  vintedAdapter,
  wallapopAdapter,
  subitoAdapter,
]

export const catalogAdapters: Record<Vertical, CatalogAdapter> = {
  pokemon: cardmarketAdapter,
  coins: numistaAdapter,
  games: stockxAdapter,
  shoes: stockxAdapter,
}

export { ebayAdapter, vintedAdapter, wallapopAdapter, subitoAdapter }
export { cardmarketAdapter, numistaAdapter, stockxAdapter }
