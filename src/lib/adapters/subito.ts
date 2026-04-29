import type { MarketplaceAdapter } from "./types"
import type { Condition, Listing } from "@/lib/types"
import { httpJson, HttpError } from "@/lib/http"
import { env } from "@/lib/env"
import { generateListings } from "@/lib/mock/listings"
import { resolveCatalog } from "@/lib/mock/catalog"

/**
 * Subito.it adapter — live.
 *
 *   Endpoint: https://hades.subito.it/v1/search/items
 *   Auth: none. Works with a browser-like User-Agent.
 *   Shape: { count_all, ads: [{ urn, subject, body, dates, images, features, geo, urls, advertiser }] }
 *   Price is inside `features` at `uri=/price`, condition at `uri=/item_condition`.
 *
 * Rate: self-imposed 1 req/10s per user/IP. We're user-initiated; no crawling.
 */

interface SubitoFeatureValue {
  key: string
  value: string
}
interface SubitoFeature {
  type: "number" | "list" | "bool" | string
  uri: string
  label: string
  values: SubitoFeatureValue[]
}
interface SubitoAd {
  urn: string
  subject: string
  body?: string
  dates?: { display_iso8601?: string }
  images?: Array<{ cdn_base_url?: string; base_url?: string }>
  features?: SubitoFeature[]
  geo?: {
    city?: { value?: string }
    town?: { value?: string }
  }
  urls?: { default?: string }
}
interface SubitoResponse {
  count_all: number
  ads: SubitoAd[]
}

export const subitoAdapter: MarketplaceAdapter = {
  platform: "subito",
  label: "Subito",
  rateBudget: { requests: 8, windowSeconds: 60 },
  status: "live",
  async search(q) {
    try {
      const url = new URL("https://hades.subito.it/v1/search/items")
      url.searchParams.set("q", q.q)
      url.searchParams.set("t", "s") // "in vendita"
      url.searchParams.set("lim", "100")
      // Macrocategory scoping — reduces cross-category noise on broad keywords.
      if (q.vertical === "pokemon" || q.vertical === "coins") {
        url.searchParams.set("c", "21") // Collezionismo
      } else if (q.vertical === "games") {
        url.searchParams.set("c", "9") // Console e Videogiochi
      } else if (q.vertical === "shoes") {
        url.searchParams.set("c", "13") // Abbigliamento e Accessori (contains Scarpe)
      }

      const data = await httpJson<SubitoResponse>(url.toString(), {
        headers: {
          Accept: "application/json",
          Origin: "https://www.subito.it",
          Referer: "https://www.subito.it/",
        },
      })

      const items = (data.ads ?? []).map((ad) => normalizeSubito(ad)).filter(
        (l): l is Listing => l !== null,
      )
      return items.slice(0, 100)
    } catch (e) {
      console.warn("[subito] live search failed:", e instanceof HttpError ? `HTTP ${e.status}` : e)
      if (env.adapter.demoFallback) {
        const ref = resolveCatalog(q.q, q.vertical)
        return generateListings({
          query: q.q,
          vertical: q.vertical,
          refPriceCents: ref?.refPriceCents ?? 3500,
          count: 3,
          bias: "bin-heavy",
          seedSalt: "subito-fallback",
        }).map((l) => ({ ...l, platform: "subito" as const }))
      }
      return []
    }
  },
}

function normalizeSubito(ad: SubitoAd): Listing | null {
  if (!ad.urn || !ad.subject) return null

  const priceFeature = ad.features?.find((f) => f.uri === "/price")
  const priceStr = priceFeature?.values?.[0]?.key
  const priceCents = parsePriceCents(priceStr)
  if (priceCents == null) return null

  const shippingFeature = ad.features?.find(
    (f) => f.uri === "/item_shipping_cost_tuttosubito",
  )
  const shippingCents = parsePriceCents(shippingFeature?.values?.[0]?.key) ?? 0

  const conditionFeature = ad.features?.find((f) => f.uri === "/item_condition")
  const condition = mapSubitoCondition(conditionFeature?.values?.[0]?.key)

  // Subito's CDN rule names changed in 2024 from `thumbextralarge.jpg`-style
  // to `gallery-desktop-2x-auto`-style. Old names 404. Use the current 2x
  // gallery rule for a retina-friendly card thumbnail (~100KB).
  const cdn = ad.images?.[0]?.cdn_base_url ?? ad.images?.[0]?.base_url
  const thumbnail = cdn ? `${cdn}?rule=gallery-desktop-2x-auto` : undefined

  return {
    id: ad.urn,
    platform: "subito",
    url: ad.urls?.default ?? "https://www.subito.it",
    title: ad.subject.trim(),
    priceCents,
    currency: "EUR",
    shippingCents: shippingCents > 0 ? shippingCents : undefined,
    thumbnail,
    country: "IT",
    city: ad.geo?.town?.value ?? ad.geo?.city?.value,
    postedAt: ad.dates?.display_iso8601 ?? new Date().toISOString(),
    condition,
    provenance: "live",
    // Intentionally dropping advertiser — see info.md §Strategia legale
    // "Niente dati personali venditori".
  }
}

function parsePriceCents(raw: string | undefined): number | null {
  if (!raw) return null
  // "21" or "1.250" or "12,99"
  const normalized = raw.replace(/\./g, "").replace(",", ".")
  const n = Number(normalized)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

function mapSubitoCondition(key: string | undefined): Condition {
  // Subito /item_condition key table (empirical):
  // "10" = Pari al nuovo, "20" = Buono, "30" = Ottimo, "40" = Da sistemare
  switch (key) {
    case "10": return "mint"
    case "20": return "good"
    case "30": return "near-mint"
    case "40": return "played"
    default: return "unknown"
  }
}
