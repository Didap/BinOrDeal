import { newContext, optimizeContext } from "@/lib/browser"

/**
 * Cardmarket price scraper (Playwright).
 *
 * Cardmarket's official API is closed to new apps (2026). Their public
 * product pages, however, expose price data (Price Trend 30d, Lowest,
 * Average 30d) without login. We navigate to a product page via a
 * headless Chromium context and parse the visible price row.
 *
 * URL shape:
 *   https://www.cardmarket.com/en/Pokemon/Products/Singles/<setSlug>/<cardSlug>
 *
 * Both slugs come from our pokemon.ts set registry + the catalog entry's
 * `meta.cardmarketSlug`. When either is missing we bail and let the
 * caller fall back to the mock ref.
 */

export interface CardmarketPrices {
  /** 30-day trend price in cents (€). */
  trendCents: number
  /** Lowest currently-available copy in cents. */
  lowCents?: number
  /** 30-day average in cents. */
  avgCents?: number
  /** Canonical URL we scraped — kept for citation in the UI. */
  sourceUrl: string
}

export async function scrapeCardmarketPrice(
  setSlug: string,
  cardSlug: string,
): Promise<CardmarketPrices | null> {
  const url = `https://www.cardmarket.com/en/Pokemon/Products/Singles/${setSlug}/${cardSlug}`
  const context = await newContext({ locale: "en-GB" })
  await optimizeContext(context)
  const page = await context.newPage()
  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    })
    if (!response || response.status() >= 400) {
      return null
    }

    // The price table is server-rendered in the product-info block. Each
    // row is a <dt>label</dt> <dd>€12,34</dd> pair. We read the raw HTML
    // of that block to avoid being brittle about CSS class renames.
    const priceBlockHtml = await page
      .locator(".info-list-container, .infoContainer, dl.labeled")
      .first()
      .innerHTML()
      .catch(() => "")

    if (!priceBlockHtml) return null

    const trend = extractLabeledPrice(priceBlockHtml, [
      "Price Trend",
      "Price Trend 30d",
      "30-days average price",
    ])
    const low = extractLabeledPrice(priceBlockHtml, [
      "From",
      "Available from",
      "Lowest price",
    ])
    const avg = extractLabeledPrice(priceBlockHtml, [
      "30-days average",
      "Average",
    ])

    if (trend == null && low == null) return null

    return {
      trendCents: trend ?? low ?? 0,
      lowCents: low ?? undefined,
      avgCents: avg ?? undefined,
      sourceUrl: url,
    }
  } finally {
    await page.close().catch(() => {})
    await context.close().catch(() => {})
  }
}

/**
 * Extract the first price that follows any of the given label strings in
 * an HTML block. Cardmarket uses both `€12,34` and `€ 12,34` formats; we
 * accept both and normalize to cents.
 */
function extractLabeledPrice(html: string, labels: string[]): number | null {
  const plain = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")
  for (const label of labels) {
    const idx = plain.toLowerCase().indexOf(label.toLowerCase())
    if (idx < 0) continue
    const after = plain.slice(idx + label.length, idx + label.length + 80)
    const m = after.match(/([0-9]{1,3}(?:[.,][0-9]{3})*)[.,]([0-9]{2})\s*€/)
    if (!m) {
      // Some pages put the € before the number.
      const m2 = after.match(/€\s*([0-9]{1,3}(?:[.,][0-9]{3})*)[.,]([0-9]{2})/)
      if (!m2) continue
      const euros = Number(m2[1].replace(/[.,]/g, ""))
      const cents = Number(m2[2])
      return euros * 100 + cents
    }
    const euros = Number(m[1].replace(/[.,]/g, ""))
    const cents = Number(m[2])
    return euros * 100 + cents
  }
  return null
}
