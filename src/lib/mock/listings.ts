import type { Listing, Platform, Vertical } from "@/lib/types"

/**
 * Seeded pseudo-random so results are stable between renders (landing demo).
 * Mulberry32.
 */
function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = t
    r = Math.imul(r ^ (r >>> 15), r | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const PLATFORMS: Platform[] = ["ebay", "vinted", "wallapop", "subito"]
const COUNTRIES = ["IT", "IT", "IT", "ES", "FR", "DE", "NL"] as const
const CITIES = [
  "Roma",
  "Milano",
  "Napoli",
  "Torino",
  "Firenze",
  "Bologna",
  "Barcelona",
  "Madrid",
  "Paris",
  "Lyon",
  "Berlin",
  "Amsterdam",
]
const CONDITIONS = [
  "near-mint",
  "near-mint",
  "excellent",
  "good",
  "mint",
  "played",
  "poor",
  "unknown",
] as const

/** Pokemon card cover image (Unsplash / Pokemon TCG images are not redistributable -
 *  we use generic colored svg placeholders server-rendered). */
function cardThumb(seed: number, vertical: Vertical): string {
  const hues = vertical === "tcg"
    ? [14, 40, 170, 210, 280, 320]
    : [30, 45, 60, 200, 220]
  const h = hues[seed % hues.length]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 220'>
    <defs>
      <linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
        <stop offset='0%' stop-color='hsl(${h},70%,62%)'/>
        <stop offset='100%' stop-color='hsl(${(h + 30) % 360},60%,36%)'/>
      </linearGradient>
      <radialGradient id='r' cx='50%' cy='42%' r='48%'>
        <stop offset='0%' stop-color='hsl(${h},90%,82%)' stop-opacity='0.9'/>
        <stop offset='100%' stop-color='transparent'/>
      </radialGradient>
    </defs>
    <rect width='160' height='220' rx='10' fill='url(#g)'/>
    <rect x='8' y='8' width='144' height='204' rx='8' fill='none' stroke='rgba(255,255,255,0.35)' stroke-width='1'/>
    <circle cx='80' cy='94' r='44' fill='url(#r)'/>
    <rect x='18' y='160' width='124' height='42' rx='4' fill='rgba(255,255,255,0.18)'/>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

interface GenOpts {
  query: string
  vertical: Vertical
  refPriceCents: number
  count?: number
  /** Skew distribution of the mock towards more deals/fair/bin for demo purposes. */
  bias?: "balanced" | "deal-heavy" | "bin-heavy"
  /** Unique salt (usually the adapter's platform name) so that different
   *  adapters produce independent streams for the same query. */
  seedSalt?: string
}

/**
 * Generate realistic-looking mock listings with a distribution of prices
 * that will score across deal / fair / bin tiers once compared to the ref.
 */
export function generateListings(opts: GenOpts): Listing[] {
  const { query, vertical, refPriceCents } = opts
  const count = opts.count ?? 14
  const bias = opts.bias ?? "balanced"
  const salt = opts.seedSalt ?? ""
  const seed = hashString(`${vertical}:${query}:${salt}`)
  const rand = mulberry32(seed)

  const listings: Listing[] = []
  const nowMs = Date.now()

  for (let i = 0; i < count; i++) {
    const platform = PLATFORMS[Math.floor(rand() * PLATFORMS.length)]
    const country = COUNTRIES[Math.floor(rand() * COUNTRIES.length)]
    const city = CITIES[Math.floor(rand() * CITIES.length)]
    const condition = CONDITIONS[Math.floor(rand() * CONDITIONS.length)]

    // Distribute delta roughly: 30% deals, 45% fair, 25% bin (balanced)
    const r = rand()
    let priceMultiplier: number
    const buckets = bias === "deal-heavy"
      ? [0.55, 0.85]
      : bias === "bin-heavy"
        ? [0.15, 0.45]
        : [0.3, 0.75]
    if (r < buckets[0]) {
      // Deal — below ref by 20-45%
      priceMultiplier = 0.55 + rand() * 0.25
    } else if (r < buckets[1]) {
      // Fair — ±15% of ref
      priceMultiplier = 0.85 + rand() * 0.3
    } else {
      // Bin — above ref by 10-60%
      priceMultiplier = 1.1 + rand() * 0.5
    }

    // Noise based on condition (good condition → closer to ref; poor → discount)
    const conditionAdj =
      condition === "mint" ? 1.05 :
      condition === "near-mint" ? 1.0 :
      condition === "excellent" ? 0.9 :
      condition === "good" ? 0.82 :
      condition === "played" ? 0.65 :
      condition === "poor" ? 0.5 :
      0.9

    const base = Math.round(refPriceCents * priceMultiplier * conditionAdj)
    // Snap prices to realistic marketplace granularity
    const priceCents = snapPrice(base)
    const shippingCents = platform === "ebay" ? 0 : [299, 499, 599, 690, 0][Math.floor(rand() * 5)]

    const hoursAgo = Math.floor(rand() * 48 * 3) + 1
    const postedAt = new Date(nowMs - hoursAgo * 3600 * 1000).toISOString()

    const id = `${platform}-${vertical}-${seed.toString(16)}-${i}`
    const title = makeTitle(query, vertical, condition, platform, rand)

    listings.push({
      id,
      platform,
      url: `https://example.${platform}.com/item/${encodeURIComponent(id)}`,
      title,
      priceCents,
      currency: "EUR",
      shippingCents,
      thumbnail: cardThumb(Math.floor(rand() * 12), vertical),
      country,
      city,
      postedAt,
      condition,
      provenance: "fallback",
      seller: {
        name: pickSeller(rand, platform),
        ratings: Math.floor(rand() * 900) + 4,
      },
      meta:
        vertical === "tcg"
          ? { set: "Base Set", language: pickLang(rand) }
          : { year: 1958 + Math.floor(rand() * 60), metal: pickMetal(rand) },
    })
  }

  return listings
}

function snapPrice(cents: number): number {
  if (cents < 1000) return Math.round(cents / 50) * 50 + 99 - 99
  if (cents < 5000) return Math.round(cents / 100) * 100 - 1
  return Math.round(cents / 500) * 500 - 1
}

function makeTitle(
  query: string,
  vertical: Vertical,
  condition: string,
  _platform: Platform,
  rand: () => number,
): string {
  const q = query.toUpperCase()
  if (vertical === "tcg") {
    const langs = ["ITA", "ENG", "GER", "FRA", "JPN"]
    const exts = [
      "base set unlimited",
      "shadowless rara",
      "olografica",
      "da collezione",
      "vintage",
      "rarissima",
    ]
    const tail = exts[Math.floor(rand() * exts.length)]
    const lang = langs[Math.floor(rand() * langs.length)]
    const condFrag =
      condition === "mint" ? " NM/MINT" :
      condition === "near-mint" ? " NM" :
      condition === "excellent" ? " EX" :
      condition === "good" ? " GD" :
      condition === "played" ? " PLAYED" : ""
    return `${q} ${tail} ${lang}${condFrag}`.trim()
  }
  // coins
  const exts = ["FDC", "SPL", "BB", "proof", "fior di conio", "ottima conservazione"]
  const tail = exts[Math.floor(rand() * exts.length)]
  return `${q} — ${tail}`
}

function pickSeller(rand: () => number, platform: Platform): string {
  const bases = {
    ebay: ["retrobit_store", "cardshop_roma", "numismatica_mi", "mystic_cards"],
    vinted: ["luca_collector", "giuliapk", "marco.cards", "paolinanum"],
    wallapop: ["colecciona_es", "cartas_madrid", "monedas_bcn"],
    subito: ["andrea.torino", "francesco_na", "elena.collezioni", "simone_rc"],
  } as const
  const arr = bases[platform]
  return arr[Math.floor(rand() * arr.length)]
}

function pickLang(rand: () => number): string {
  const langs = ["ITA", "ENG", "GER", "FRA"]
  return langs[Math.floor(rand() * langs.length)]
}
function pickMetal(rand: () => number): string {
  const m = ["argento", "rame", "bronzital", "bimetallico"]
  return m[Math.floor(rand() * m.length)]
}
