/**
 * Pokémon TCG sets catalog (curated).
 *
 * ~50 sets spanning 1999→2026, grouped by era. This is NOT the complete
 * set list (Pokémon TCG has 150+ expansions); it's the subset Italian
 * collectors actually search on Cardmarket / eBay / Subito.
 *
 * Each entry has:
 *   - id: URL-safe stable id used in query params (pokemonSet)
 *   - label: human display name
 *   - keyword: the phrase marketplaces use in titles (appended to the
 *     search keyword when user picks a set, so "Charizard base-set"
 *     gets searched as "Charizard Base Set" etc.)
 *   - cardmarketSlug: the URL slug on cardmarket.com/en/Pokemon/Expansions/
 *     Used by the Playwright scraper to find the product page directly.
 *   - era: bucket for dropdown grouping
 */

export interface PokemonSet {
  id: string
  label: string
  keyword: string
  cardmarketSlug?: string
  era: "classic" | "neo-e" | "ex-dp" | "hgss-bw" | "xy-sm" | "swsh" | "sv"
}

export const POKEMON_SETS: PokemonSet[] = [
  // 1999-2000 — the classic WotC era (most valuable vintage)
  { id: "base-set", label: "Base Set (Unlimited)", keyword: "base set", cardmarketSlug: "Base-Set", era: "classic" },
  { id: "base-set-shadowless", label: "Base Set (Shadowless)", keyword: "base set shadowless", cardmarketSlug: "Base-Set-Shadowless", era: "classic" },
  { id: "base-set-1st", label: "Base Set (1st Edition)", keyword: "base set 1st edition", cardmarketSlug: "Base-Set-1st-Edition", era: "classic" },
  { id: "jungle", label: "Jungle", keyword: "jungle", cardmarketSlug: "Jungle", era: "classic" },
  { id: "fossil", label: "Fossil", keyword: "fossil", cardmarketSlug: "Fossil", era: "classic" },
  { id: "base-set-2", label: "Base Set 2", keyword: "base set 2", cardmarketSlug: "Base-Set-2", era: "classic" },
  { id: "team-rocket", label: "Team Rocket", keyword: "team rocket", cardmarketSlug: "Team-Rocket", era: "classic" },
  { id: "gym-heroes", label: "Gym Heroes", keyword: "gym heroes", cardmarketSlug: "Gym-Heroes", era: "classic" },
  { id: "gym-challenge", label: "Gym Challenge", keyword: "gym challenge", cardmarketSlug: "Gym-Challenge", era: "classic" },

  // 2000-2003 — Neo series + e-Card era
  { id: "neo-genesis", label: "Neo Genesis", keyword: "neo genesis", cardmarketSlug: "Neo-Genesis", era: "neo-e" },
  { id: "neo-discovery", label: "Neo Discovery", keyword: "neo discovery", cardmarketSlug: "Neo-Discovery", era: "neo-e" },
  { id: "neo-revelation", label: "Neo Revelation", keyword: "neo revelation", cardmarketSlug: "Neo-Revelation", era: "neo-e" },
  { id: "neo-destiny", label: "Neo Destiny", keyword: "neo destiny", cardmarketSlug: "Neo-Destiny", era: "neo-e" },
  { id: "expedition", label: "Expedition Base Set", keyword: "expedition", cardmarketSlug: "Expedition-Base-Set", era: "neo-e" },
  { id: "aquapolis", label: "Aquapolis", keyword: "aquapolis", cardmarketSlug: "Aquapolis", era: "neo-e" },
  { id: "skyridge", label: "Skyridge", keyword: "skyridge", cardmarketSlug: "Skyridge", era: "neo-e" },

  // 2003-2009 — EX / Diamond & Pearl / Platinum
  { id: "ex-ruby-sapphire", label: "EX Ruby & Sapphire", keyword: "ex ruby sapphire", cardmarketSlug: "EX-Ruby-Sapphire", era: "ex-dp" },
  { id: "ex-dragon", label: "EX Dragon", keyword: "ex dragon", cardmarketSlug: "EX-Dragon", era: "ex-dp" },
  { id: "ex-hidden-legends", label: "EX Hidden Legends", keyword: "ex hidden legends", cardmarketSlug: "EX-Hidden-Legends", era: "ex-dp" },
  { id: "ex-deoxys", label: "EX Deoxys", keyword: "ex deoxys", cardmarketSlug: "EX-Deoxys", era: "ex-dp" },
  { id: "ex-dragon-frontiers", label: "EX Dragon Frontiers", keyword: "ex dragon frontiers", cardmarketSlug: "EX-Dragon-Frontiers", era: "ex-dp" },
  { id: "ex-crystal-guardians", label: "EX Crystal Guardians", keyword: "ex crystal guardians", cardmarketSlug: "EX-Crystal-Guardians", era: "ex-dp" },
  { id: "ex-power-keepers", label: "EX Power Keepers", keyword: "ex power keepers", cardmarketSlug: "EX-Power-Keepers", era: "ex-dp" },
  { id: "diamond-pearl", label: "Diamond & Pearl", keyword: "diamond pearl", cardmarketSlug: "Diamond-Pearl", era: "ex-dp" },
  { id: "platinum", label: "Platinum", keyword: "platinum", cardmarketSlug: "Platinum", era: "ex-dp" },
  { id: "arceus", label: "Arceus", keyword: "arceus set", cardmarketSlug: "Arceus", era: "ex-dp" },

  // 2010-2016 — HGSS / B&W / XY
  { id: "hgss-unleashed", label: "HeartGold & SoulSilver — Unleashed", keyword: "hgss unleashed", cardmarketSlug: "HS-Unleashed", era: "hgss-bw" },
  { id: "hgss-triumphant", label: "HeartGold & SoulSilver — Triumphant", keyword: "hgss triumphant", cardmarketSlug: "HS-Triumphant", era: "hgss-bw" },
  { id: "black-white", label: "Black & White", keyword: "black white", cardmarketSlug: "Black-White", era: "hgss-bw" },
  { id: "boundaries-crossed", label: "Boundaries Crossed", keyword: "boundaries crossed", cardmarketSlug: "Boundaries-Crossed", era: "hgss-bw" },
  { id: "legendary-treasures", label: "Legendary Treasures", keyword: "legendary treasures", cardmarketSlug: "Legendary-Treasures", era: "hgss-bw" },
  { id: "xy", label: "XY", keyword: "xy", cardmarketSlug: "XY", era: "xy-sm" },
  { id: "xy-flashfire", label: "XY Flashfire", keyword: "flashfire", cardmarketSlug: "Flashfire", era: "xy-sm" },
  { id: "xy-evolutions", label: "XY Evolutions", keyword: "evolutions", cardmarketSlug: "Evolutions", era: "xy-sm" },

  // 2017-2020 — Sun & Moon
  { id: "sm-base", label: "Sun & Moon", keyword: "sun moon", cardmarketSlug: "Sun-Moon", era: "xy-sm" },
  { id: "burning-shadows", label: "Burning Shadows", keyword: "burning shadows", cardmarketSlug: "Burning-Shadows", era: "xy-sm" },
  { id: "hidden-fates", label: "Hidden Fates", keyword: "hidden fates", cardmarketSlug: "Hidden-Fates", era: "xy-sm" },
  { id: "cosmic-eclipse", label: "Cosmic Eclipse", keyword: "cosmic eclipse", cardmarketSlug: "Cosmic-Eclipse", era: "xy-sm" },

  // 2020-2022 — Sword & Shield
  { id: "swsh-base", label: "Sword & Shield", keyword: "sword shield", cardmarketSlug: "Sword-Shield", era: "swsh" },
  { id: "vivid-voltage", label: "Vivid Voltage", keyword: "vivid voltage", cardmarketSlug: "Vivid-Voltage", era: "swsh" },
  { id: "evolving-skies", label: "Evolving Skies", keyword: "evolving skies", cardmarketSlug: "Evolving-Skies", era: "swsh" },
  { id: "fusion-strike", label: "Fusion Strike", keyword: "fusion strike", cardmarketSlug: "Fusion-Strike", era: "swsh" },
  { id: "brilliant-stars", label: "Brilliant Stars", keyword: "brilliant stars", cardmarketSlug: "Brilliant-Stars", era: "swsh" },
  { id: "crown-zenith", label: "Crown Zenith", keyword: "crown zenith", cardmarketSlug: "Crown-Zenith", era: "swsh" },

  // 2023-2026 — Scarlet & Violet
  { id: "sv-base", label: "Scarlet & Violet", keyword: "scarlet violet", cardmarketSlug: "Scarlet-Violet", era: "sv" },
  { id: "sv-151", label: "Scarlet & Violet 151", keyword: "151", cardmarketSlug: "151", era: "sv" },
  { id: "paradox-rift", label: "Paradox Rift", keyword: "paradox rift", cardmarketSlug: "Paradox-Rift", era: "sv" },
  { id: "paldean-fates", label: "Paldean Fates", keyword: "paldean fates", cardmarketSlug: "Paldean-Fates", era: "sv" },
  { id: "temporal-forces", label: "Temporal Forces", keyword: "temporal forces", cardmarketSlug: "Temporal-Forces", era: "sv" },
  { id: "twilight-masquerade", label: "Twilight Masquerade", keyword: "twilight masquerade", cardmarketSlug: "Twilight-Masquerade", era: "sv" },
  { id: "shrouded-fable", label: "Shrouded Fable", keyword: "shrouded fable", cardmarketSlug: "Shrouded-Fable", era: "sv" },
  { id: "stellar-crown", label: "Stellar Crown", keyword: "stellar crown", cardmarketSlug: "Stellar-Crown", era: "sv" },
  { id: "surging-sparks", label: "Surging Sparks", keyword: "surging sparks", cardmarketSlug: "Surging-Sparks", era: "sv" },
  { id: "prismatic-evolutions", label: "Prismatic Evolutions", keyword: "prismatic evolutions", cardmarketSlug: "Prismatic-Evolutions", era: "sv" },
]

export const POKEMON_SETS_BY_ID: Record<string, PokemonSet> = Object.fromEntries(
  POKEMON_SETS.map((s) => [s.id, s]),
)

export const POKEMON_ERA_LABELS: Record<PokemonSet["era"], string> = {
  classic: "Classic / WotC (1999-2000)",
  "neo-e": "Neo & e-Card (2000-2003)",
  "ex-dp": "EX / Diamond & Pearl (2003-2009)",
  "hgss-bw": "HGSS / Black & White (2010-2014)",
  "xy-sm": "XY / Sun & Moon (2014-2019)",
  swsh: "Sword & Shield (2020-2022)",
  sv: "Scarlet & Violet (2023-2026)",
}

export function refinePokemonQuery(
  q: string,
  setId: string | undefined,
): string {
  const base = q.trim()
  if (!base || !setId || setId === "any") return base
  const set = POKEMON_SETS_BY_ID[setId]
  if (!set) return base
  const haystack = base.toLowerCase()
  if (set.keyword.split(/\s+/).every((tok) => haystack.includes(tok))) {
    return base
  }
  return `${base} ${set.keyword}`
}
