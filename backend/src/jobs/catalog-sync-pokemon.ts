import { db, schema } from "../db.js"
import { sql } from "drizzle-orm"

/**
 * Sync the Pokémon TCG catalog from pokemontcg.io into our Postgres.
 *
 *   Sets:  GET https://api.pokemontcg.io/v2/sets            (~150 rows)
 *   Cards: GET /v2/cards?pageSize=250&page={n}              (~18k rows, paginated)
 *
 * Rate limit: 30 req/min without API key, 20k req/day with key. Full sync
 * is ~75 requests (1 sets call + ~74 card pages) so it fits in either
 * tier. We sleep ~2s between pages when POKEMONTCG_API_KEY is missing.
 *
 * Idempotent: upserts by primary key. Safe to run from cron daily.
 * Logs cumulative counts every 10 pages.
 */

const API = "https://api.pokemontcg.io/v2"
const PAGE_SIZE = 250

interface SetApi {
  id: string
  name: string
  series?: string
  releaseDate?: string
  total?: number
  images?: { logo?: string; symbol?: string }
}

interface CardApi {
  id: string
  name: string
  number: string
  rarity?: string
  supertype?: string
  subtypes?: string[]
  types?: string[]
  images?: { small?: string; large?: string }
  set: { id: string }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

async function apiFetch<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" }
  if (process.env.POKEMONTCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY
  }
  const r = await fetch(`${API}${path}`, { headers })
  if (!r.ok) {
    throw new Error(`pokemontcg.io ${r.status}: ${path}`)
  }
  return (await r.json()) as T
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function syncPokemonCatalog(): Promise<{
  sets: number
  cards: number
  elapsedMs: number
}> {
  const started = Date.now()
  const hasKey = Boolean(process.env.POKEMONTCG_API_KEY)

  // Step 1 — sets.
  const setsRes = await apiFetch<{ data: SetApi[] }>("/sets?pageSize=500")
  const setRows = setsRes.data.map((s) => ({
    id: slugify(s.id),
    externalId: s.id,
    name: s.name,
    series: s.series ?? null,
    releaseDate: s.releaseDate ?? null,
    totalCards: s.total ?? null,
    logoUrl: s.images?.logo ?? null,
    symbolUrl: s.images?.symbol ?? null,
    updatedAt: new Date(),
  }))

  if (setRows.length > 0) {
    await db
      .insert(schema.pokemonSets)
      .values(setRows)
      .onConflictDoUpdate({
        target: schema.pokemonSets.id,
        set: {
          externalId: sql`excluded.external_id`,
          name: sql`excluded.name`,
          series: sql`excluded.series`,
          releaseDate: sql`excluded.release_date`,
          totalCards: sql`excluded.total_cards`,
          logoUrl: sql`excluded.logo_url`,
          symbolUrl: sql`excluded.symbol_url`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
  }
  console.log(`[catalog-sync] sets: ${setRows.length}`)

  // Step 2 — cards, paginated.
  let page = 1
  let totalCards = 0
  while (true) {
    const res = await apiFetch<{
      data: CardApi[]
      totalCount: number
      page: number
      pageSize: number
    }>(`/cards?pageSize=${PAGE_SIZE}&page=${page}`)

    if (res.data.length === 0) break

    const rows = res.data.map((c) => ({
      // Use pokemontcg.io's stable card id as PK — it differentiates variants
      // that share (setId, number) like normal vs reverse-holo printings.
      id: c.id,
      externalId: c.id,
      setId: slugify(c.set.id),
      name: c.name,
      number: c.number,
      rarity: c.rarity ?? null,
      supertype: c.supertype ?? null,
      subtypes: c.subtypes ? JSON.stringify(c.subtypes) : null,
      types: c.types ? JSON.stringify(c.types) : null,
      imageSmall: c.images?.small ?? null,
      imageLarge: c.images?.large ?? null,
      updatedAt: new Date(),
    }))

    await db
      .insert(schema.pokemonCards)
      .values(rows)
      .onConflictDoUpdate({
        target: schema.pokemonCards.id,
        set: {
          externalId: sql`excluded.external_id`,
          setId: sql`excluded.set_id`,
          name: sql`excluded.name`,
          number: sql`excluded.number`,
          rarity: sql`excluded.rarity`,
          supertype: sql`excluded.supertype`,
          subtypes: sql`excluded.subtypes`,
          types: sql`excluded.types`,
          imageSmall: sql`excluded.image_small`,
          imageLarge: sql`excluded.image_large`,
          updatedAt: sql`excluded.updated_at`,
        },
      })

    totalCards += res.data.length
    if (page % 10 === 0) {
      console.log(
        `[catalog-sync] cards so far: ${totalCards} / ${res.totalCount}`,
      )
    }

    if (page * PAGE_SIZE >= res.totalCount) break
    page += 1
    if (!hasKey) await sleep(2100) // respect free-tier 30 req/min
  }
  console.log(`[catalog-sync] cards total: ${totalCards}`)

  return {
    sets: setRows.length,
    cards: totalCards,
    elapsedMs: Date.now() - started,
  }
}

import { fileURLToPath } from "url"
// Allow running the script directly via `npm run catalog:sync:pokemon`.
const isDirect = fileURLToPath(import.meta.url) === process.argv[1]
if (isDirect) {
  const { config } = await import("dotenv")
  config({ path: "../.env.local" })
  config({ path: ".env.local" })
  const result = await syncPokemonCatalog()
  console.log("[catalog-sync] done:", result)
  process.exit(0)
}
