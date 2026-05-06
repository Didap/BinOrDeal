import type { Platform, Vertical } from "@/lib/types"

/**
 * Static, dependency-free metadata about every marketplace + catalog adapter.
 *
 * THIS FILE MUST NOT IMPORT THE ACTUAL ADAPTERS. It's the boundary that lets
 * presentational code (status strips, sidebars, the search page server
 * render) read adapter labels/statuses *without* transitively pulling in
 * Playwright, OAuth bootstraps, or any runtime adapter logic.
 *
 * Why it exists: the streaming `/search` page render was going through
 *   page.tsx → AdapterStatusStrip → marketplaceAdapters → wallapopAdapter →
 *   browser.ts → dynamic import("playwright")
 * which on slow container disks (Coolify default VPS) took 30+ seconds for
 * the first request after deploy. Decoupling the metadata from the runtime
 * means the page render is hermetic and never touches Playwright.
 *
 * The runtime adapters (in their respective files) reference this metadata
 * so labels/statuses stay in one place.
 */

export interface MarketplaceMeta {
  platform: Platform
  label: string
  /** Same as the runtime adapter's `status`. eBay flips to "live" when the
   *  EBAY_APP_ID + EBAY_CERT_ID env vars are set; we read the env directly
   *  here to avoid pulling the adapter module. */
  status: "live" | "stub" | "down"
}

export interface CatalogMeta {
  source: "cardmarket" | "numista" | "stockx"
  label: string
  status: "live" | "stub" | "down"
}

function ebayConfigured(): boolean {
  // Server-only env read. Mirrors src/lib/env.ts but avoids the whole env
  // object so this file stays minimal and import-side-effect free.
  if (typeof process === "undefined") return false
  return Boolean(process.env.EBAY_APP_ID && process.env.EBAY_CERT_ID)
}

export const MARKETPLACE_META: MarketplaceMeta[] = [
  { platform: "ebay", label: "eBay", status: ebayConfigured() ? "live" : "stub" },
  { platform: "vinted", label: "Vinted", status: "live" },
  { platform: "wallapop", label: "Wallapop", status: "live" },
  { platform: "subito", label: "Subito", status: "live" },
]

export const CATALOG_META: Record<Vertical, CatalogMeta> = {
  pokemon: { source: "cardmarket", label: "Cardmarket", status: "stub" },
  coins: { source: "numista", label: "Numista", status: "stub" },
  games: { source: "stockx", label: "StockX", status: "stub" },
  shoes: { source: "stockx", label: "StockX", status: "stub" },
}
