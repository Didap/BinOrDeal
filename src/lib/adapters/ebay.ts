import type { MarketplaceAdapter } from "./types"
import type { Condition, Listing } from "@/lib/types"
import { httpJson, HttpError } from "@/lib/http"
import { env } from "@/lib/env"
import { generateListings } from "@/lib/mock/listings"
import { resolveCatalog } from "@/lib/mock/catalog"

/**
 * eBay Browse API adapter.
 *   Docs: https://developer.ebay.com/api-docs/buy/browse/overview.html
 *   Auth: OAuth 2.0 client-credentials (app token, ~5k calls/day free tier).
 *   Endpoint: GET https://api.ebay.com/buy/browse/v1/item_summary/search?q=...
 *
 * Gated on env: becomes "live" only when EBAY_APP_ID + EBAY_CERT_ID are set.
 * Otherwise stays "stub".
 *
 * Monetization: when EBAY_EPN_CAMPAIGN_ID is set, outbound click URLs are
 * rewritten through the eBay Partner Network (EPN) tracker so clicks generate
 * affiliate revenue.
 */

const OAUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token"
const SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search"
const SCOPE = "https://api.ebay.com/oauth/api_scope"

let tokenCache: { value: string; expires: number } | null = null

async function getAppToken(): Promise<string> {
  if (tokenCache && tokenCache.expires > Date.now() + 30_000) return tokenCache.value

  const creds = Buffer.from(`${env.ebay.appId}:${env.ebay.certId}`).toString("base64")
  const body = new URLSearchParams({ grant_type: "client_credentials", scope: SCOPE })
  const r = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  })
  if (!r.ok) {
    const txt = await r.text()
    throw new HttpError(r.status, OAUTH_URL, txt.slice(0, 300), "ebay token failed")
  }
  const json = (await r.json()) as { access_token: string; expires_in: number }
  tokenCache = {
    value: json.access_token,
    expires: Date.now() + json.expires_in * 1000,
  }
  return json.access_token
}

interface EbayItemSummary {
  itemId: string
  title: string
  itemWebUrl: string
  price?: { value: string; currency: string }
  shippingOptions?: Array<{ shippingCost?: { value: string; currency: string } }>
  image?: { imageUrl?: string }
  thumbnailImages?: Array<{ imageUrl?: string }>
  condition?: string
  conditionId?: string
  itemLocation?: { country?: string; city?: string }
  itemCreationDate?: string
  itemAffiliateWebUrl?: string
}
interface EbaySearchResponse {
  itemSummaries?: EbayItemSummary[]
  total?: number
}

export const ebayAdapter: MarketplaceAdapter = {
  platform: "ebay",
  label: "eBay",
  rateBudget: { requests: 100, windowSeconds: 60 },
  get status() {
    return env.ebay.configured ? "live" : "stub"
  },
  async search(q) {
    if (!env.ebay.configured) return stubFallback(q.q, q.vertical)

    try {
      const token = await getAppToken()
      const url = new URL(SEARCH_URL)
      url.searchParams.set("q", q.q)
      url.searchParams.set("limit", "100")
      // Prefer IT-localized results; buyers shipping outside IT get filtered client-side.
      const filters = [
        "deliveryCountry:IT",
        "buyingOptions:{FIXED_PRICE|AUCTION}",
      ]
      url.searchParams.set("filter", filters.join(","))

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_IT",
        "X-EBAY-C-ENDUSERCTX": "contextualLocation=country=IT,zip=00100",
      }
      if (env.ebay.epnCampaignId) {
        // EPN rotation reference required by eBay ToS for affiliate tracking.
        headers["X-EBAY-C-AFFILIATION"] = `ePNCampaignId=${env.ebay.epnCampaignId},trackingId=9999`
      }

      const data = await httpJson<EbaySearchResponse>(url.toString(), { headers })
      const items = (data.itemSummaries ?? [])
        .map(normalizeEbay)
        .filter((l): l is Listing => l !== null)
      return items.slice(0, 100)
    } catch (e) {
      console.warn("[ebay] live search failed:", e instanceof HttpError ? `HTTP ${e.status}` : e)
      return stubFallback(q.q, q.vertical)
    }
  },
}

function stubFallback(query: string, vertical: import("@/lib/types").Vertical): Listing[] {
  if (!env.adapter.demoFallback) return []
  const ref = resolveCatalog(query, vertical)
  return generateListings({
    query,
    vertical,
    refPriceCents: ref?.refPriceCents ?? 3500,
    count: 5,
    bias: "balanced",
    seedSalt: "ebay-fallback",
  }).map((l) => ({ ...l, platform: "ebay" as const }))
}

function normalizeEbay(item: EbayItemSummary): Listing | null {
  if (!item.itemId || !item.title) return null

  const priceCents = parseEbayPrice(item.price?.value)
  if (priceCents == null) return null

  const shippingCents = parseEbayPrice(item.shippingOptions?.[0]?.shippingCost?.value) ?? undefined
  const country = (item.itemLocation?.country ?? "IT") as Listing["country"]

  return {
    id: `ebay-${item.itemId}`,
    platform: "ebay",
    url: item.itemAffiliateWebUrl ?? item.itemWebUrl,
    title: item.title,
    priceCents,
    currency: (item.price?.currency as Listing["currency"]) ?? "EUR",
    shippingCents,
    thumbnail: item.thumbnailImages?.[0]?.imageUrl ?? item.image?.imageUrl,
    country: country in COUNTRY_SET ? country : "EU",
    city: item.itemLocation?.city,
    postedAt: item.itemCreationDate ?? new Date().toISOString(),
    condition: mapEbayCondition(item.condition, item.conditionId),
    provenance: "live",
  }
}

const COUNTRY_SET: Record<string, true> = { IT: true, ES: true, FR: true, DE: true, NL: true, EU: true }

function parseEbayPrice(raw: string | undefined): number | null {
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

function mapEbayCondition(label: string | undefined, id: string | undefined): Condition {
  // https://developer.ebay.com/devzone/finding/callref/Enums/conditionIdList.html
  if (id) {
    switch (id) {
      case "1000": return "mint"        // New
      case "1500":                      // New other
      case "1750": return "near-mint"   // New with defects
      case "2000":                      // Manufacturer refurbished
      case "2500": return "excellent"   // Seller refurbished
      case "3000": return "good"        // Used
      case "4000": return "played"      // Very good condition (collectibles variant)
      case "5000": return "played"      // Good
      case "6000": return "poor"        // Acceptable
      case "7000": return "poor"        // For parts
    }
  }
  if (label) {
    const l = label.toLowerCase()
    if (l.includes("new")) return "mint"
    if (l.includes("refurb")) return "excellent"
    if (l.includes("very good")) return "near-mint"
    if (l.includes("good")) return "good"
    if (l.includes("acceptable")) return "played"
  }
  return "unknown"
}
