/**
 * Client-safe flat catalog for Pokémon autocomplete.
 *
 * Re-exports the pokemon section of the mock catalog as a flat array with
 * just the fields the SearchBox dropdown needs (id, name, set, number,
 * price). Server imports keep the full CatalogRef (with meta); this file
 * is intentionally narrow so we can ship it to the client without bundling
 * vertical-specific plumbing.
 */

import { CATALOG } from "@/lib/mock/catalog"
import { POKEMON_SETS_BY_ID } from "@/lib/pokemon"
import type { CatalogRef } from "@/lib/types"

export interface PokemonCardListing {
  productId: string
  productName: string
  /** Full card name without set suffix, used for autocomplete matching. */
  shortName: string
  setId: string
  setLabel: string
  number?: string
  refPriceCents: number
}

export const POKEMON_CATALOG: PokemonCardListing[] = (
  Object.values(CATALOG.tcg) as CatalogRef[]
)
  .filter((ref) => ref.meta?.game === "pokemon")
  .map((ref) => {
  const setId = (ref.meta?.set as string | undefined) ?? "unknown"
  const setLabel = POKEMON_SETS_BY_ID[setId]?.label ?? setId
  // Pull the name before the "—" (em-dash) as the short name,
  // falling back to the whole productName.
  const shortName = ref.productName.split("—")[0]?.trim() ?? ref.productName
  return {
    productId: ref.productId ?? ref.productName,
    productName: ref.productName,
    shortName,
    setId,
    setLabel,
    number: ref.meta?.number != null ? String(ref.meta.number) : undefined,
    refPriceCents: ref.refPriceCents,
  }
})

/**
 * Fuzzy-match the user's typed query against the catalog. Returns the
 * top N candidates ranked by how tightly they cover the query tokens.
 */
export function suggestPokemonCards(
  query: string,
  opts: { setId?: string; limit?: number } = {},
): PokemonCardListing[] {
  const q = query.trim().toLowerCase()
  const limit = opts.limit ?? 8
  const pool =
    opts.setId && opts.setId !== "any"
      ? POKEMON_CATALOG.filter((c) => c.setId === opts.setId)
      : POKEMON_CATALOG

  if (!q) return pool.slice(0, limit)

  const qTokens = q.split(/\s+/).filter(Boolean)
  const scored = pool.map((card) => {
    const haystack = `${card.shortName} ${card.setLabel} ${card.number ?? ""}`.toLowerCase()
    let matched = 0
    for (const t of qTokens) if (haystack.includes(t)) matched += 1
    return { card, matched, haystack }
  })
  return scored
    .filter((x) => x.matched > 0)
    .sort((a, b) => {
      if (b.matched !== a.matched) return b.matched - a.matched
      // Tie-break: shorter haystack (more specific) wins.
      return a.haystack.length - b.haystack.length
    })
    .slice(0, limit)
    .map((x) => x.card)
}
