/**
 * Platforms catalog for the "games" vertical. Used to scope keyword searches
 * so "Tears of the Kingdom switch2" doesn't collide with PS3 listings, and
 * so "ps5" on its own doesn't drag in every PS5 game ever listed.
 *
 * Every platform has an id (stable, URL-safe) + a label shown to humans + a
 * keyword fragment that gets appended to the marketplace query when the user
 * selects it. The keyword is what marketplaces actually need to disambiguate
 * (e.g. "switch 2" as a noun works on Subito/eBay/Vinted titles).
 */

export type GameKind = "console" | "game"

export interface GamePlatform {
  id: string
  label: string
  keyword: string
  era: "modern" | "prev-gen" | "handheld" | "retro" | "pc"
}

export const GAME_PLATFORMS: GamePlatform[] = [
  // Modern home consoles
  { id: "ps5", label: "PlayStation 5", keyword: "ps5", era: "modern" },
  { id: "ps5-pro", label: "PlayStation 5 Pro", keyword: "ps5 pro", era: "modern" },
  { id: "xsx", label: "Xbox Series X", keyword: "xbox series x", era: "modern" },
  { id: "xss", label: "Xbox Series S", keyword: "xbox series s", era: "modern" },
  { id: "switch2", label: "Nintendo Switch 2", keyword: "switch 2", era: "modern" },
  { id: "switch", label: "Nintendo Switch", keyword: "nintendo switch", era: "modern" },

  // Previous generation
  { id: "ps4", label: "PlayStation 4", keyword: "ps4", era: "prev-gen" },
  { id: "ps3", label: "PlayStation 3", keyword: "ps3", era: "prev-gen" },
  { id: "xbox-one", label: "Xbox One", keyword: "xbox one", era: "prev-gen" },
  { id: "xbox-360", label: "Xbox 360", keyword: "xbox 360", era: "prev-gen" },
  { id: "wii-u", label: "Nintendo Wii U", keyword: "wii u", era: "prev-gen" },
  { id: "wii", label: "Nintendo Wii", keyword: "nintendo wii", era: "prev-gen" },

  // Handheld
  { id: "steam-deck", label: "Steam Deck", keyword: "steam deck", era: "handheld" },
  { id: "analogue-pocket", label: "Analogue Pocket", keyword: "analogue pocket", era: "handheld" },
  { id: "3ds", label: "Nintendo 3DS", keyword: "nintendo 3ds", era: "handheld" },
  { id: "ds", label: "Nintendo DS", keyword: "nintendo ds", era: "handheld" },
  { id: "gba", label: "Game Boy Advance", keyword: "game boy advance", era: "handheld" },
  { id: "gbc", label: "Game Boy Color", keyword: "game boy color", era: "handheld" },
  { id: "gb", label: "Game Boy", keyword: "game boy", era: "handheld" },
  { id: "psp", label: "PSP", keyword: "psp", era: "handheld" },
  { id: "ps-vita", label: "PS Vita", keyword: "ps vita", era: "handheld" },

  // Retro / vintage
  { id: "ps2", label: "PlayStation 2", keyword: "ps2", era: "retro" },
  { id: "ps1", label: "PlayStation 1", keyword: "ps1", era: "retro" },
  { id: "n64", label: "Nintendo 64", keyword: "nintendo 64", era: "retro" },
  { id: "gamecube", label: "Nintendo GameCube", keyword: "gamecube", era: "retro" },
  { id: "snes", label: "Super Nintendo", keyword: "super nintendo snes", era: "retro" },
  { id: "nes", label: "NES", keyword: "nes nintendo", era: "retro" },
  { id: "dreamcast", label: "Sega Dreamcast", keyword: "dreamcast", era: "retro" },
  { id: "saturn", label: "Sega Saturn", keyword: "sega saturn", era: "retro" },
  { id: "mega-drive", label: "Sega Mega Drive", keyword: "mega drive genesis", era: "retro" },
  { id: "master-system", label: "Sega Master System", keyword: "master system", era: "retro" },
  { id: "neo-geo", label: "SNK Neo Geo", keyword: "neo geo", era: "retro" },
  { id: "atari-2600", label: "Atari 2600", keyword: "atari 2600", era: "retro" },

  // PC
  { id: "pc", label: "PC", keyword: "pc steam", era: "pc" },
]

export const PLATFORMS_BY_ID: Record<string, GamePlatform> = Object.fromEntries(
  GAME_PLATFORMS.map((p) => [p.id, p]),
)

export const ERA_LABELS: Record<GamePlatform["era"], string> = {
  modern: "Attuali",
  "prev-gen": "Generazione precedente",
  handheld: "Portatili",
  retro: "Retro / vintage",
  pc: "PC",
}

/**
 * Build the final marketplace keyword given user's intent.
 *   - console: append "console" so marketplace title matching is biased
 *     toward hardware listings. (Post-filtering in runSearch drops any
 *     game-franchise-titled rows that still leak through.)
 *   - game: append the platform's keyword so marketplace titles match
 *     against the right-console variant. Noop when platform is "any".
 */
export function refineGamesQuery(
  q: string,
  kind: GameKind,
  platformId: string | undefined,
): string {
  const base = q.trim()
  if (!base) return base
  if (kind === "console") {
    return /\bconsole\b/i.test(base) ? base : `${base} console`
  }
  if (!platformId || platformId === "any") return base
  const platform = PLATFORMS_BY_ID[platformId]
  if (!platform) return base
  const haystack = base.toLowerCase()
  if (platform.keyword.split(/\s+/).every((tok) => haystack.includes(tok))) {
    return base
  }
  return `${base} ${platform.keyword}`
}

/**
 * Heuristic: does this listing title look like a video game (as opposed to
 * a console / hardware)? Used to post-filter marketplace results when the
 * user said kind=console.
 *
 * Matching is franchise-token based. Broad on purpose — false-positive
 * rate is low for a search that's explicitly asking for hardware, because
 * hardware listings rarely name a specific game franchise.
 */
const GAME_FRANCHISE_RE = new RegExp(
  [
    // Sports annuals (the big "NBA 2K23" / "FIFA 24" pattern)
    "\\bfifa\\s?\\d*",
    "\\be[- ]?football\\s?\\d*",
    "\\bpes\\s?\\d+",
    "\\bnba\\s?2k\\d*",
    "\\b2k\\d\\d",
    "\\bmadden\\s?\\d*",
    "\\bwwe\\s?2k",
    "\\bf\\s?1\\s?\\d\\d",
    // Shooters & action franchises
    "\\b(cod|call of duty|warzone|modern warfare|black ops)\\b",
    "\\b(battlefield|apex legends|valorant|overwatch|fortnite)\\b",
    "\\b(counter[- ]strike|cs\\s?go|cs\\s?2)\\b",
    "\\b(halo|gears of war|doom|wolfenstein)\\b",
    "\\b(far cry|watch[- ]?dogs|assassin'?s? creed|assassins creed)\\b",
    "\\b(the division|destiny\\s?\\d?)\\b",
    // Open world / GTA / RDR
    "\\b(gta|grand theft auto|red dead|bully)\\b",
    "\\b(mafia\\s?\\d?|sleeping dogs|saints row)\\b",
    // Sony exclusives
    "\\b(spider[- ]?man|miles morales|ratchet|uncharted|the last of us|tlou)\\b",
    "\\b(god of war|horizon (zero|forbidden)|ghost of tsushima|returnal)\\b",
    "\\b(death stranding|bloodborne|demon'?s? souls)\\b",
    // Nintendo franchises
    "\\b(zelda|breath of the wild|tears of the kingdom|totk|botw)\\b",
    "\\b(mario kart|super mario|mario party|mario golf|odyssey|luigi'?s)\\b",
    "\\b(metroid|kirby|splatoon|animal crossing|pikmin|xenoblade)\\b",
    "\\b(pok[eé]mon|pokemon scarlet|pokemon violet)\\b",
    // RPG
    "\\b(final fantasy|ff\\s?[ivx]+|ff\\s?\\d+|kingdom hearts)\\b",
    "\\b(persona\\s?\\d?|yakuza|like a dragon)\\b",
    "\\b(dragon quest|tales of|ni no kuni|octopath)\\b",
    "\\b(elden ring|dark souls|sekiro|lies of p)\\b",
    "\\b(witcher|cyberpunk|baldur'?s? gate|divinity)\\b",
    "\\b(hogwarts legacy|harry potter)\\b",
    "\\b(starfield|skyrim|fallout|elder scrolls)\\b",
    // Fighting
    "\\b(tekken\\s?\\d?|street fighter\\s?\\d?|sf\\s?[ivx\\d]+)\\b",
    "\\b(mortal kombat|mk\\s?\\d+|injustice)\\b",
    "\\b(smash bros?|super smash)\\b",
    // Horror / survival
    "\\b(resident evil|re\\s?\\d|silent hill|dead space)\\b",
    "\\b(outlast|layers of fear|the evil within)\\b",
    // Metal Gear / stealth
    "\\b(metal gear|mgs\\s?[ivx\\d]+|hitman)\\b",
    // Management / sim
    "\\b(sims\\s?\\d?|cities[- ]skylines|planet zoo|planet coaster)\\b",
    "\\b(civilization|age of empires|crusader kings|total war)\\b",
    "\\b(stardew valley|farming simulator|euro truck|train sim)\\b",
    // Indies & popular
    "\\b(hollow knight|hades|celeste|undertale|cuphead)\\b",
    "\\b(minecraft|terraria|stardew|roblox|rocket league)\\b",
    "\\b(diablo\\s?\\d?|path of exile|poe\\s?\\d?)\\b",
    // Racing
    "\\b(forza (horizon|motorsport)|gran turismo|wrc|dirt rally)\\b",
  ].join("|"),
  "i",
)

export function titleLooksLikeGame(title: string): boolean {
  return GAME_FRANCHISE_RE.test(title)
}

/**
 * Accessories & spare-parts vocabulary. Kill switch for kind=console —
 * these listings share the console keyword but aren't the console.
 * Covers IT/ES/FR/EN common words.
 */
const ACCESSORY_RE = new RegExp(
  [
    "\\b(custodia|custodie|funda|fundas|cover|case|carry\\s?case|estuche)\\b",
    "\\b(joy[- ]?con|joycon|joystick|dualsense|dualshock|controller\\s?originale|pro\\s?controller|gamepad|pad\\s?aggiuntivo)\\b",
    "\\b(grip|grip\\s?case|bolso|borsetto|astuccio\\s?per)\\b",
    "\\b(cargador|cavo|cavi\\s?originali|charger|cable\\b|caricabatteria|caricatore|dock\\s?station|base\\s?dock)\\b",
    "\\b(pellicola|protezione\\s?schermo|screen\\s?protector|vetro\\s?temperato)\\b",
    "\\b(ricambio|ricambi|recambio|recambios|spare\\s?part|spare\\s?parts|riparazione|parte\\s?di\\s?ricambio)\\b",
    "\\b(stick|thumbstick|analog(ici?)?\\b|bottone|bottoni|tasto\\s?di\\s?ricambio)\\b",
    "\\b(memory\\s?card|scheda\\s?di\\s?memoria|sd\\s?card|micro\\s?sd)\\b",
    "\\b(volante|volanti|pedaliera|steering\\s?wheel|flight\\s?stick)\\b",
    "\\b(kit\\s?di\\s?pulizia|kit\\s?pulizia|kit\\s?riparazione|mod\\s?chip|modifica\\s?chiavetta)\\b",
    "\\b(decal|skin|adesivo|sticker\\b|cover\\s?personalizzata|vinile)\\b",
    "\\b(caja\\s?vacia|solo\\s?caja|solo\\s?scatola|solo\\s?box|scatola\\s?vuota|empty\\s?box)\\b",
  ].join("|"),
  "i",
)

/**
 * Filter for console (hardware) searches. A listing title passes if:
 *   - it contains at least one "significant" query token (so random
 *     sponsored Subito results for "router" don't leak in), AND
 *   - it does NOT contain a standalone game-language marker
 *     (gioco/giochi/jeu/juego/game/videogioco/cartuccia), AND
 *   - it does NOT match a game-franchise token (fifa/nba/cod/mario kart…).
 *
 * We DO NOT require the word "console" or specific hardware vocab —
 * most sellers just write "Nintendo Switch 2" with no extra noun,
 * and requiring "console" dropped 95% of real listings.
 */
export function titleIsConsoleHardware(title: string, query?: string): boolean {
  const t = title.toLowerCase()
  // Hard NO: standalone game-language markers (strong software signal).
  if (/\b(jeu|jeux|juego|juegos|gioco|giochi|videogioco|videogiochi|games|cartridge|cartuccia)\b/.test(t)) {
    return false
  }
  // Hard NO: franchise tokens (mario kart, fifa, cod, etc.)
  if (GAME_FRANCHISE_RE.test(title)) return false
  // Hard NO: accessories / spare parts — they share the console keyword
  // but aren't the thing the user is shopping for.
  if (ACCESSORY_RE.test(title)) return false
  // If we have a query, require at least one meaningful token overlap
  // (len ≥ 3) so totally off-topic listings don't survive.
  if (query) {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((tok) => tok.length >= 3 || /^\d/.test(tok))
    if (tokens.length > 0 && !tokens.some((tok) => t.includes(tok))) {
      return false
    }
  }
  return true
}
