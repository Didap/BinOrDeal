import type { MarketplaceAdapter } from "./types"
import type { Condition, Listing } from "@/lib/types"
import { newContext, optimizeContext } from "@/lib/browser"
import { env } from "@/lib/env"
import { generateListings } from "@/lib/mock/listings"
import { resolveCatalog } from "@/lib/mock/catalog"

/**
 * Wallapop adapter — LIVE via Playwright.
 *
 * Why Playwright instead of plain fetch?
 *   The `api.wallapop.com` endpoint sits behind CloudFront WAF that 403s
 *   every non-browser TLS fingerprint we tried (curl, Node fetch, fake
 *   browser headers). A real Chromium instance passes. See
 *   memory/spike_marketplace_apis.md and info.md §Rischi principali.
 *
 * Flow:
 *   1. Navigate to https://es.wallapop.com/app/search?keywords=<q>
 *   2. The SPA boot triggers two API calls:
 *        /api/v3/search/components  (page skeleton, filters, empty section)
 *        /api/v3/search/section     (actual items — our target)
 *   3. We listen for the /section response, parse `data.section.items`.
 *
 * Deployment note: this adapter cannot run on Vercel serverless functions.
 * In prod it must live in the Hono backend on Fly.io (info.md §Architettura).
 */

interface WallapopImage {
  urls?: { small?: string; medium?: string; big?: string }
}
interface WallapopItem {
  id: string
  title: string
  description?: string
  price: { amount: number; currency: string }
  images?: WallapopImage[]
  location?: { country_code?: string; city?: string; postal_code?: string }
  modified_date?: number
  creation_date?: number
  shipping?: { item_is_shippable?: boolean; cost?: { amount?: number } }
  flags?: { shipping?: boolean }
  web_slug?: string
}
interface WallapopSection {
  data?: { section?: { items?: WallapopItem[] } }
}

interface WallapopGraphQLSearch {
  data?: {
    search?: { items?: WallapopItem[] }
    searchItems?: { items?: WallapopItem[] }
  }
}

type WallapopAnyResponse = WallapopSection | WallapopGraphQLSearch

function isSectionResponse(data: unknown): data is WallapopSection {
  if (!data || typeof data !== "object") return false
  const section = (data as WallapopSection).data?.section
  return !!section && Array.isArray(section.items)
}

function isGraphQLSearch(data: unknown): data is WallapopGraphQLSearch {
  if (!data || typeof data !== "object") return false
  const inner = (data as WallapopGraphQLSearch).data
  if (!inner) return false
  const items = inner.search?.items ?? inner.searchItems?.items
  return Array.isArray(items)
}

function normalizeSection(data: WallapopAnyResponse): WallapopItem[] {
  if (isSectionResponse(data)) {
    return data.data?.section?.items ?? []
  }
  const inner = (data as WallapopGraphQLSearch).data
  return inner?.search?.items ?? inner?.searchItems?.items ?? []
}

export const wallapopAdapter: MarketplaceAdapter = {
  platform: "wallapop",
  label: "Wallapop",
  rateBudget: { requests: 4, windowSeconds: 60 },
  status: "live",
  async search(q) {
    try {
      const items = await fetchViaBrowser(q.q)
      return items.map(normalizeWallapop).filter((l): l is Listing => l !== null).slice(0, 100)
    } catch (e) {
      console.warn("[wallapop] live search failed:", e instanceof Error ? e.message : e)
      if (env.adapter.demoFallback) {
        const ref = resolveCatalog(q.q, q.vertical)
        return generateListings({
          query: q.q,
          vertical: q.vertical,
          refPriceCents: ref?.refPriceCents ?? 3500,
          count: 3,
          bias: "balanced",
          seedSalt: "wallapop-fallback",
        }).map((l) => ({ ...l, platform: "wallapop" as const, country: "ES" as const }))
      }
      return []
    }
  },
}

async function fetchViaBrowser(query: string): Promise<WallapopItem[]> {
  const context = await newContext({ locale: "es-ES" })
  await optimizeContext(context)
  const page = await context.newPage()

  try {
    const searchUrl = new URL("https://it.wallapop.com/app/search")
    searchUrl.searchParams.set("keywords", query)

    const sectionPromise = new Promise<WallapopItem[]>((resolve) => {
      page.on("response", async (res) => {
        const url = res.url()
        // Wallapop searches hit either a GraphQL endpoint or the section API.
        if (url.includes("/api/v1/search/section") || url.includes("/graphql") || url.includes("/api/v3/search/section")) {
          const ct = res.headers()["content-type"] ?? ""
          if (!ct.includes("json")) return

          try {
            const data = await res.json()
            if (data && (isSectionResponse(data) || isGraphQLSearch(data))) {
              resolve(normalizeSection(data))
            }
          } catch {
            // ignore malformed JSON or other API calls
          }
        }
      })
    })

    try {
      await page.goto(searchUrl.toString(), {
        waitUntil: "commit",
        timeout: 20_000,
      })
    } catch {
      // ignore goto timeout/failures; we rely on the XHR listener
    }

    const items = await Promise.race([
      sectionPromise,
      new Promise<WallapopItem[]>((_, rej) =>
        setTimeout(() => rej(new Error("wallapop: timeout")), 15_000),
      ),
    ])

    return items
  } finally {
    page.removeAllListeners("response")
    await page.close().catch(() => {})
    await context.close().catch(() => {})
  }
}

function normalizeWallapop(item: WallapopItem): Listing | null {
  if (!item.id || !item.title || !item.price) return null

  const priceCents = Math.round((item.price.amount ?? 0) * 100)
  if (priceCents <= 0) return null

  const shippingCents = item.shipping?.cost?.amount != null
    ? Math.round(item.shipping.cost.amount * 100)
    : undefined

  const country = mapCountry(item.location?.country_code)
  const condition = inferConditionFromText(item.description ?? item.title)

  const modifiedMs = item.modified_date ?? item.creation_date
  const postedAt = modifiedMs
    ? new Date(modifiedMs).toISOString()
    : new Date().toISOString()

  const thumb =
    item.images?.[0]?.urls?.medium ||
    item.images?.[0]?.urls?.small ||
    item.images?.[0]?.urls?.big

  // URL shape: https://es.wallapop.com/item/<web_slug>  —  the web_slug
  // already contains the numeric id as its final token. Appending item.id
  // (the alphanumeric hash) yields a 404. Verified 2026-04-23.
  const slug =
    item.web_slug ??
    `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${item.id}`
  const url = `https://es.wallapop.com/item/${slug}`

  return {
    id: `wallapop-${item.id}`,
    platform: "wallapop",
    url,
    title: item.title,
    priceCents,
    currency: (item.price.currency as Listing["currency"]) ?? "EUR",
    shippingCents,
    thumbnail: thumb,
    country,
    city: item.location?.city,
    postedAt,
    condition,
    provenance: "live",
  }
}

function mapCountry(code: string | undefined): Listing["country"] {
  if (!code) return "ES"
  const up = code.toUpperCase()
  if (up === "IT" || up === "ES" || up === "FR" || up === "DE" || up === "NL") return up
  return "EU"
}

function inferConditionFromText(text: string): Condition {
  // Wallapop doesn't expose a structured condition field. Sellers describe
  // in free text. This is a best-effort heuristic; returns "unknown" on miss.
  const s = text.toLowerCase()
  if (/\b(mint|nuevo|nuevo con|sin abrir|sealed|precint)\b/.test(s)) return "mint"
  if (/\b(near mint|near-mint|nm|casi nuevo|como nuevo)\b/.test(s)) return "near-mint"
  if (/\b(excelente|muy buen(o|as?)\b|very good|vg\+?)\b/.test(s)) return "excellent"
  if (/\b(buen(o|as?)\b|good)\b/.test(s)) return "good"
  if (/\b(usado|played|jugado|desgaste)\b/.test(s)) return "played"
  if (/\b(mal estado|defecto|roto|dañado)\b/.test(s)) return "poor"
  return "unknown"
}
