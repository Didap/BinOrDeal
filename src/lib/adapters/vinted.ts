import type { MarketplaceAdapter } from "./types"
import type { Condition, Listing } from "@/lib/types"
import { http, httpJson, HttpError, extractCookies } from "@/lib/http"
import { env } from "@/lib/env"
import { generateListings } from "@/lib/mock/listings"
import { resolveCatalog } from "@/lib/mock/catalog"

/**
 * Vinted adapter — live.
 *
 * Bootstrap flow:
 *   1. GET https://www.vinted.it/   → receive anonymous session cookies
 *      (v_udt, anon_id, anonymous-locale, etc.) via Set-Cookie.
 *   2. GET https://www.vinted.it/api/v2/catalog/items?search_text=...  with Cookie header.
 *      → JSON { items: [...], pagination }
 *
 * Cookies are cached in-process with a short TTL. They expire anyway;
 * on 401 we drop and re-bootstrap.
 *
 * Note on privacy (info.md §Strategia legale):
 *   We drop user.login, user.profile_url, user.photo, business, photos[].
 *   Listings keep only the main photo URL (publicly hot-linkable) + basic meta.
 */

interface VintedPrice { amount: string; currency_code: string }
interface VintedItem {
  id: number
  title: string
  price: VintedPrice
  total_item_price?: VintedPrice | null
  path?: string
  url?: string
  status?: string
  photo?: {
    url?: string
    high_resolution?: { timestamp?: number }
    thumbnails?: Array<{ type?: string; url?: string }>
  } | null
  brand_title?: string
}
interface VintedResponse { items: VintedItem[] }

// In-process cookie jar. Re-bootstrap on 401 or after TTL.
let cookieCache: { value: string; expires: number } | null = null
const COOKIE_TTL_MS = 30 * 60 * 1000 // 30 min

async function ensureCookies(): Promise<string> {
  if (cookieCache && cookieCache.expires > Date.now()) return cookieCache.value
  const r = await http("https://www.vinted.it/", {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  })
  if (!r.ok) {
    throw new HttpError(r.status, "https://www.vinted.it/", "", `bootstrap failed HTTP ${r.status}`)
  }
  const cookies = extractCookies(r)
  if (!cookies) {
    throw new Error("vinted: homepage returned no cookies")
  }
  cookieCache = { value: cookies, expires: Date.now() + COOKIE_TTL_MS }
  return cookies
}

function invalidateCookies() {
  cookieCache = null
}

export const vintedAdapter: MarketplaceAdapter = {
  platform: "vinted",
  label: "Vinted",
  rateBudget: { requests: 6, windowSeconds: 60 },
  status: "live",
  async search(q) {
    try {
      const items = await vintedFetch(q.q)
      return items.map(normalizeVinted).filter((l): l is Listing => l !== null).slice(0, 100)
    } catch (e) {
      console.warn("[vinted] live search failed:", e instanceof HttpError ? `HTTP ${e.status}` : e)
      if (env.adapter.demoFallback) {
        const ref = resolveCatalog(q.q, q.vertical)
        return generateListings({
          query: q.q,
          vertical: q.vertical,
          refPriceCents: ref?.refPriceCents ?? 3500,
          count: 4,
          bias: "deal-heavy",
          seedSalt: "vinted-fallback",
        }).map((l) => ({ ...l, platform: "vinted" as const }))
      }
      return []
    }
  },
}

async function vintedFetch(searchText: string, retried = false): Promise<VintedItem[]> {
  const cookies = await ensureCookies()
  const url = new URL("https://www.vinted.it/api/v2/catalog/items")
  url.searchParams.set("search_text", searchText)
  url.searchParams.set("page", "1")
  url.searchParams.set("per_page", "96")
  // `relevance` = Vinted's own relevance ranker. Far less noisy than
  // `newest_first`, which floods the result with whatever just got listed
  // in the broader category (e.g. random Pokémon merch when searching
  // for a specific card).
  url.searchParams.set("order", "relevance")

  try {
    const data = await httpJson<VintedResponse>(url.toString(), {
      cookie: cookies,
      headers: {
        Accept: "application/json, text/plain, */*",
        Origin: "https://www.vinted.it",
        Referer: "https://www.vinted.it/catalog?search_text=" + encodeURIComponent(searchText),
        "X-Requested-With": "XMLHttpRequest",
      },
    })
    return data.items ?? []
  } catch (e) {
    if (e instanceof HttpError && e.status === 401 && !retried) {
      invalidateCookies()
      return vintedFetch(searchText, true)
    }
    throw e
  }
}

function normalizeVinted(item: VintedItem): Listing | null {
  if (!item.id || !item.title) return null

  const priceCents = parseVintedPrice(item.price?.amount)
  if (priceCents == null) return null

  // `total_item_price` includes Vinted's "buyer protection" service fee.
  // We report that delta as shipping-like effective surcharge, so scoring
  // reflects what the buyer actually pays.
  const totalCents = parseVintedPrice(item.total_item_price?.amount)
  const serviceFeeCents =
    totalCents != null && totalCents > priceCents ? totalCents - priceCents : undefined

  const condition = mapVintedCondition(item.status)
  const thumbnail =
    item.photo?.thumbnails?.find((t) => t.type === "thumb310x430")?.url ??
    item.photo?.url ??
    undefined

  const postedAt = item.photo?.high_resolution?.timestamp
    ? new Date(item.photo.high_resolution.timestamp * 1000).toISOString()
    : new Date().toISOString()

  return {
    id: `vinted-${item.id}`,
    platform: "vinted",
    url: item.url ?? `https://www.vinted.it${item.path ?? ""}`,
    title: item.title,
    priceCents,
    currency: (item.price?.currency_code as Listing["currency"]) ?? "EUR",
    shippingCents: serviceFeeCents,
    thumbnail,
    country: "IT",
    postedAt,
    condition,
    provenance: "live",
    // No seller info retained (see §privacy).
    meta: item.brand_title ? { brand: item.brand_title } : undefined,
  }
}

function parseVintedPrice(raw: string | undefined): number | null {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

function mapVintedCondition(raw: string | undefined): Condition {
  // Vinted IT status strings observed: "Nuovo con cartellino",
  // "Nuovo senza cartellino", "Ottime", "Buone", "Discrete", "Soddisfacenti".
  if (!raw) return "unknown"
  const s = raw.toLowerCase()
  if (s.startsWith("nuovo")) return "mint"
  if (s.startsWith("ottim")) return "near-mint"
  if (s.startsWith("buon")) return "excellent"
  if (s.startsWith("discret")) return "good"
  if (s.startsWith("soddisf")) return "played"
  return "unknown"
}
