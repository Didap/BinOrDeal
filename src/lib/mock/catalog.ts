import type { CatalogRef, Vertical } from "@/lib/types"
import type { GameKind } from "@/lib/games"

/**
 * Mock catalog of reference prices.
 * In production this comes from Cardmarket API (pokemon) and Numista (coins).
 * Key is a lowercase search token.
 */
export const CATALOG: Record<Vertical, Record<string, CatalogRef>> = {
  pokemon: {
    // Base Set (Unlimited) — 1999
    charizard: {
      vertical: "pokemon", query: "charizard base set", refSource: "cardmarket",
      refPriceCents: 18500,
      productName: "Charizard — Base Set (Unlimited) #4",
      productId: "cm-pkmn-base-4",
      meta: { set: "base-set", number: "4", cardmarketSlug: "Charizard-V1" },
    },
    blastoise: {
      vertical: "pokemon", query: "blastoise base set", refSource: "cardmarket",
      refPriceCents: 9200,
      productName: "Blastoise — Base Set #2",
      productId: "cm-pkmn-base-2",
      meta: { set: "base-set", number: "2", cardmarketSlug: "Blastoise-V1" },
    },
    venusaur: {
      vertical: "pokemon", query: "venusaur base set", refSource: "cardmarket",
      refPriceCents: 7400,
      productName: "Venusaur — Base Set #15",
      productId: "cm-pkmn-base-15",
      meta: { set: "base-set", number: "15", cardmarketSlug: "Venusaur-V1" },
    },
    mewtwo: {
      vertical: "pokemon", query: "mewtwo base set", refSource: "cardmarket",
      refPriceCents: 3400,
      productName: "Mewtwo — Base Set #10",
      productId: "cm-pkmn-base-10",
      meta: { set: "base-set", number: "10", cardmarketSlug: "Mewtwo-V1" },
    },
    pikachu: {
      vertical: "pokemon", query: "pikachu base set", refSource: "cardmarket",
      refPriceCents: 1290,
      productName: "Pikachu — Base Set #58",
      productId: "cm-pkmn-base-58",
      meta: { set: "base-set", number: "58", cardmarketSlug: "Pikachu-V1" },
    },
    // Base Set Shadowless
    "charizard shadowless": {
      vertical: "pokemon", query: "charizard base set shadowless", refSource: "cardmarket",
      refPriceCents: 48000,
      productName: "Charizard — Base Set (Shadowless) #4",
      productId: "cm-pkmn-base-4-sl",
      meta: { set: "base-set-shadowless", number: "4", cardmarketSlug: "Charizard-V1" },
    },
    // Base Set 1st Edition
    "charizard 1st edition": {
      vertical: "pokemon", query: "charizard base set 1st edition", refSource: "cardmarket",
      refPriceCents: 420000,
      productName: "Charizard — Base Set 1st Edition #4",
      productId: "cm-pkmn-base-4-1ed",
      meta: { set: "base-set-1st", number: "4", cardmarketSlug: "Charizard-V1" },
    },
    // Team Rocket
    "dark charizard": {
      vertical: "pokemon", query: "dark charizard team rocket", refSource: "cardmarket",
      refPriceCents: 3500,
      productName: "Dark Charizard — Team Rocket #4",
      productId: "cm-pkmn-tr-4",
      meta: { set: "team-rocket", number: "4", cardmarketSlug: "Dark-Charizard" },
    },
    // Evolving Skies (hot modern set)
    "charizard evolving skies": {
      vertical: "pokemon", query: "charizard vmax rainbow evolving skies", refSource: "cardmarket",
      refPriceCents: 38000,
      productName: "Charizard VMAX (Rainbow Secret) — Evolving Skies #74",
      productId: "cm-pkmn-es-74",
      meta: { set: "evolving-skies", number: "74", cardmarketSlug: "Charizard-VMAX-V2" },
    },
    // 151 (big IT seller 2023)
    "charizard 151": {
      vertical: "pokemon", query: "charizard ex 151", refSource: "cardmarket",
      refPriceCents: 4500,
      productName: "Charizard ex — Scarlet & Violet 151 #199",
      productId: "cm-pkmn-151-199",
      meta: { set: "sv-151", number: "199", cardmarketSlug: "Charizard-ex-V7" },
    },
    "pikachu 151": {
      vertical: "pokemon", query: "pikachu 151", refSource: "cardmarket",
      refPriceCents: 800,
      productName: "Pikachu — Scarlet & Violet 151 #025",
      productId: "cm-pkmn-151-025",
      meta: { set: "sv-151", number: "25", cardmarketSlug: "Pikachu-V5" },
    },
    // Hidden Fates
    "charizard shiny hidden fates": {
      vertical: "pokemon", query: "charizard gx shiny hidden fates", refSource: "cardmarket",
      refPriceCents: 11000,
      productName: "Shiny Charizard GX — Hidden Fates SV49",
      productId: "cm-pkmn-hf-sv49",
      meta: { set: "hidden-fates", number: "SV49" },
    },
    // Promo / Legendary
    "pikachu illustrator": {
      vertical: "pokemon", query: "pikachu illustrator", refSource: "cardmarket",
      refPriceCents: 9_500_000,
      productName: "Pikachu Illustrator — Trainer Promo",
      productId: "cm-pkmn-illustrator",
      meta: { set: "promo", number: "illustrator" },
    },
    "eevee gold star": {
      vertical: "pokemon", query: "eevee gold star pop 5", refSource: "cardmarket",
      refPriceCents: 22000,
      productName: "Eevee Gold Star — POP Series 5",
      productId: "cm-pkmn-pop5-17",
      meta: { set: "pop-5", number: "17" },
    },
    // Base Set — remaining holo rares
    "alakazam base": {
      vertical: "pokemon", query: "alakazam base set", refSource: "cardmarket",
      refPriceCents: 2800, productName: "Alakazam — Base Set #1", productId: "cm-pkmn-base-1",
      meta: { set: "base-set", number: "1" },
    },
    "chansey base": {
      vertical: "pokemon", query: "chansey base set", refSource: "cardmarket",
      refPriceCents: 1800, productName: "Chansey — Base Set #3", productId: "cm-pkmn-base-3",
      meta: { set: "base-set", number: "3" },
    },
    "clefairy base": {
      vertical: "pokemon", query: "clefairy base set", refSource: "cardmarket",
      refPriceCents: 2200, productName: "Clefairy — Base Set #5", productId: "cm-pkmn-base-5",
      meta: { set: "base-set", number: "5" },
    },
    "gyarados base": {
      vertical: "pokemon", query: "gyarados base set", refSource: "cardmarket",
      refPriceCents: 2500, productName: "Gyarados — Base Set #6", productId: "cm-pkmn-base-6",
      meta: { set: "base-set", number: "6" },
    },
    "hitmonchan base": {
      vertical: "pokemon", query: "hitmonchan base set", refSource: "cardmarket",
      refPriceCents: 1500, productName: "Hitmonchan — Base Set #7", productId: "cm-pkmn-base-7",
      meta: { set: "base-set", number: "7" },
    },
    "machamp base": {
      vertical: "pokemon", query: "machamp base set", refSource: "cardmarket",
      refPriceCents: 1200, productName: "Machamp — Base Set #8", productId: "cm-pkmn-base-8",
      meta: { set: "base-set", number: "8" },
    },
    "magneton base": {
      vertical: "pokemon", query: "magneton base set", refSource: "cardmarket",
      refPriceCents: 1800, productName: "Magneton — Base Set #9", productId: "cm-pkmn-base-9",
      meta: { set: "base-set", number: "9" },
    },
    "nidoking base": {
      vertical: "pokemon", query: "nidoking base set", refSource: "cardmarket",
      refPriceCents: 1800, productName: "Nidoking — Base Set #11", productId: "cm-pkmn-base-11",
      meta: { set: "base-set", number: "11" },
    },
    "ninetales base": {
      vertical: "pokemon", query: "ninetales base set", refSource: "cardmarket",
      refPriceCents: 2200, productName: "Ninetales — Base Set #12", productId: "cm-pkmn-base-12",
      meta: { set: "base-set", number: "12" },
    },
    "poliwrath base": {
      vertical: "pokemon", query: "poliwrath base set", refSource: "cardmarket",
      refPriceCents: 1400, productName: "Poliwrath — Base Set #13", productId: "cm-pkmn-base-13",
      meta: { set: "base-set", number: "13" },
    },
    "raichu base": {
      vertical: "pokemon", query: "raichu base set", refSource: "cardmarket",
      refPriceCents: 3200, productName: "Raichu — Base Set #14", productId: "cm-pkmn-base-14",
      meta: { set: "base-set", number: "14" },
    },
    "zapdos base": {
      vertical: "pokemon", query: "zapdos base set", refSource: "cardmarket",
      refPriceCents: 2800, productName: "Zapdos — Base Set #16", productId: "cm-pkmn-base-16",
      meta: { set: "base-set", number: "16" },
    },
    // Jungle
    "mr mime jungle": {
      vertical: "pokemon", query: "mr mime jungle", refSource: "cardmarket",
      refPriceCents: 1800, productName: "Mr. Mime — Jungle #6", productId: "cm-pkmn-jungle-6",
      meta: { set: "jungle", number: "6" },
    },
    "scyther jungle": {
      vertical: "pokemon", query: "scyther jungle", refSource: "cardmarket",
      refPriceCents: 2200, productName: "Scyther — Jungle #10", productId: "cm-pkmn-jungle-10",
      meta: { set: "jungle", number: "10" },
    },
    "snorlax jungle": {
      vertical: "pokemon", query: "snorlax jungle", refSource: "cardmarket",
      refPriceCents: 2500, productName: "Snorlax — Jungle #11", productId: "cm-pkmn-jungle-11",
      meta: { set: "jungle", number: "11" },
    },
    // Fossil
    "dragonite fossil": {
      vertical: "pokemon", query: "dragonite fossil", refSource: "cardmarket",
      refPriceCents: 1600, productName: "Dragonite — Fossil #4", productId: "cm-pkmn-fossil-4",
      meta: { set: "fossil", number: "4" },
    },
    "lapras fossil": {
      vertical: "pokemon", query: "lapras fossil", refSource: "cardmarket",
      refPriceCents: 1200, productName: "Lapras — Fossil #10", productId: "cm-pkmn-fossil-10",
      meta: { set: "fossil", number: "10" },
    },
    // Team Rocket (Dark)
    "dark blastoise": {
      vertical: "pokemon", query: "dark blastoise team rocket", refSource: "cardmarket",
      refPriceCents: 1900, productName: "Dark Blastoise — Team Rocket #3", productId: "cm-pkmn-tr-3",
      meta: { set: "team-rocket", number: "3" },
    },
    "dark dragonite": {
      vertical: "pokemon", query: "dark dragonite team rocket", refSource: "cardmarket",
      refPriceCents: 2400, productName: "Dark Dragonite — Team Rocket #5", productId: "cm-pkmn-tr-5",
      meta: { set: "team-rocket", number: "5" },
    },
    // Neo Genesis
    "lugia neo genesis": {
      vertical: "pokemon", query: "lugia neo genesis", refSource: "cardmarket",
      refPriceCents: 14000, productName: "Lugia — Neo Genesis #9", productId: "cm-pkmn-ng-9",
      meta: { set: "neo-genesis", number: "9" },
    },
    // Scarlet & Violet 151 (currently hot)
    "blastoise 151": {
      vertical: "pokemon", query: "blastoise ex 151", refSource: "cardmarket",
      refPriceCents: 3500, productName: "Blastoise ex — Scarlet & Violet 151 #200", productId: "cm-pkmn-151-200",
      meta: { set: "sv-151", number: "200" },
    },
    "venusaur 151": {
      vertical: "pokemon", query: "venusaur ex 151", refSource: "cardmarket",
      refPriceCents: 2800, productName: "Venusaur ex — Scarlet & Violet 151 #198", productId: "cm-pkmn-151-198",
      meta: { set: "sv-151", number: "198" },
    },
    "mew 151": {
      vertical: "pokemon", query: "mew ex 151", refSource: "cardmarket",
      refPriceCents: 4200, productName: "Mew ex — Scarlet & Violet 151 #193", productId: "cm-pkmn-151-193",
      meta: { set: "sv-151", number: "193" },
    },
    "alakazam 151": {
      vertical: "pokemon", query: "alakazam ex 151", refSource: "cardmarket",
      refPriceCents: 1800, productName: "Alakazam ex — Scarlet & Violet 151 #201", productId: "cm-pkmn-151-201",
      meta: { set: "sv-151", number: "201" },
    },
    // Evolving Skies rainbow chase cards
    "umbreon vmax evolving skies": {
      vertical: "pokemon", query: "umbreon vmax alt art evolving skies", refSource: "cardmarket",
      refPriceCents: 55000, productName: "Umbreon VMAX (Alt Art) — Evolving Skies #215", productId: "cm-pkmn-es-215",
      meta: { set: "evolving-skies", number: "215" },
    },
    "sylveon vmax evolving skies": {
      vertical: "pokemon", query: "sylveon vmax alt art evolving skies", refSource: "cardmarket",
      refPriceCents: 32000, productName: "Sylveon VMAX (Alt Art) — Evolving Skies #212", productId: "cm-pkmn-es-212",
      meta: { set: "evolving-skies", number: "212" },
    },
    "rayquaza vmax evolving skies": {
      vertical: "pokemon", query: "rayquaza vmax alt art evolving skies", refSource: "cardmarket",
      refPriceCents: 26000, productName: "Rayquaza VMAX (Alt Art) — Evolving Skies #217", productId: "cm-pkmn-es-217",
      meta: { set: "evolving-skies", number: "217" },
    },
    "leafeon vmax evolving skies": {
      vertical: "pokemon", query: "leafeon vmax alt art evolving skies", refSource: "cardmarket",
      refPriceCents: 15000, productName: "Leafeon VMAX (Alt Art) — Evolving Skies #205", productId: "cm-pkmn-es-205",
      meta: { set: "evolving-skies", number: "205" },
    },
    // Surging Sparks (modern hot)
    "pikachu ex surging sparks": {
      vertical: "pokemon", query: "pikachu ex surging sparks", refSource: "cardmarket",
      refPriceCents: 6500, productName: "Pikachu ex — Surging Sparks #238", productId: "cm-pkmn-ssp-238",
      meta: { set: "surging-sparks", number: "238" },
    },
    // Prismatic Evolutions
    "umbreon ex prismatic": {
      vertical: "pokemon", query: "umbreon ex prismatic evolutions", refSource: "cardmarket",
      refPriceCents: 14500, productName: "Umbreon ex — Prismatic Evolutions #161", productId: "cm-pkmn-pre-161",
      meta: { set: "prismatic-evolutions", number: "161" },
    },
    "sylveon ex prismatic": {
      vertical: "pokemon", query: "sylveon ex prismatic evolutions", refSource: "cardmarket",
      refPriceCents: 12000, productName: "Sylveon ex — Prismatic Evolutions #156", productId: "cm-pkmn-pre-156",
      meta: { set: "prismatic-evolutions", number: "156" },
    },
    // Hidden Fates
    "rayquaza gx shiny hidden fates": {
      vertical: "pokemon", query: "rayquaza gx shiny hidden fates", refSource: "cardmarket",
      refPriceCents: 8500, productName: "Shiny Rayquaza GX — Hidden Fates SV50", productId: "cm-pkmn-hf-sv50",
      meta: { set: "hidden-fates", number: "SV50" },
    },
    // Gym Heroes / Challenge
    "blaine charizard gym challenge": {
      vertical: "pokemon", query: "blaine charizard gym challenge", refSource: "cardmarket",
      refPriceCents: 9500, productName: "Blaine's Charizard — Gym Challenge #2", productId: "cm-pkmn-gc-2",
      meta: { set: "gym-challenge", number: "2" },
    },
    "brock rhydon gym heroes": {
      vertical: "pokemon", query: "brock rhydon gym heroes", refSource: "cardmarket",
      refPriceCents: 1800, productName: "Brock's Rhydon — Gym Heroes #13", productId: "cm-pkmn-gh-13",
      meta: { set: "gym-heroes", number: "13" },
    },
    // Skyridge (expensive vintage)
    "charizard skyridge": {
      vertical: "pokemon", query: "charizard skyridge crystal", refSource: "cardmarket",
      refPriceCents: 75000, productName: "Crystal Charizard — Skyridge #146", productId: "cm-pkmn-sr-146",
      meta: { set: "skyridge", number: "146" },
    },
  },
  coins: {
    "2 euro grecia 2004": {
      vertical: "coins",
      query: "2 euro commemorativo grecia 2004",
      refSource: "numista",
      refPriceCents: 480,
      productName: "2€ commemorativo Grecia 2004 — Olimpiadi Atene",
      productId: "num-gr-2004",
    },
    "50 lire 1958": {
      vertical: "coins",
      query: "50 lire 1958",
      refSource: "numista",
      refPriceCents: 22000,
      productName: "50 Lire Vulcano 1958 — Rep. Italiana",
      productId: "num-it-50l-1958",
    },
    "500 lire argento": {
      vertical: "coins",
      query: "500 lire argento caravelle",
      refSource: "numista",
      refPriceCents: 1600,
      productName: "500 Lire Argento Caravelle — 1958-1967",
      productId: "num-it-500l",
    },
    "10 euro vaticano": {
      vertical: "coins",
      query: "10 euro vaticano argento",
      refSource: "numista",
      refPriceCents: 6500,
      productName: "10€ Argento Vaticano — proof",
      productId: "num-va-10e",
    },
  },
  games: {
    // Consoles — modern
    "playstation 5": {
      vertical: "games", query: "playstation 5", refSource: "stockx",
      refPriceCents: 45000,
      productName: "PlayStation 5 (Disc Edition) — Sony",
      productId: "sx-sony-ps5-disc",
      meta: { kind: "console", platform: "ps5" },
    },
    "ps5 pro": {
      vertical: "games", query: "playstation 5 pro", refSource: "stockx",
      refPriceCents: 79900,
      productName: "PlayStation 5 Pro — Sony",
      productId: "sx-sony-ps5pro",
      meta: { kind: "console", platform: "ps5-pro" },
    },
    "ps5 30th anniversary": {
      vertical: "games", query: "ps5 30th anniversary", refSource: "stockx",
      refPriceCents: 145000,
      productName: "PlayStation 5 — 30th Anniversary Collector's",
      productId: "sx-sony-ps5-30th",
      meta: { kind: "console", platform: "ps5" },
    },
    "nintendo switch 2": {
      vertical: "games", query: "nintendo switch 2", refSource: "stockx",
      refPriceCents: 48000,
      productName: "Nintendo Switch 2 — Console",
      productId: "sx-nin-switch2",
      meta: { kind: "console", platform: "switch2" },
    },
    "nintendo switch": {
      vertical: "games", query: "nintendo switch oled", refSource: "stockx",
      refPriceCents: 34000,
      productName: "Nintendo Switch OLED — Console",
      productId: "sx-nin-switch-oled",
      meta: { kind: "console", platform: "switch" },
    },
    "xbox series x": {
      vertical: "games", query: "xbox series x", refSource: "stockx",
      refPriceCents: 52000,
      productName: "Xbox Series X — Microsoft",
      productId: "sx-ms-xsx",
      meta: { kind: "console", platform: "xsx" },
    },
    "xbox series s": {
      vertical: "games", query: "xbox series s", refSource: "stockx",
      refPriceCents: 30000,
      productName: "Xbox Series S — Microsoft",
      productId: "sx-ms-xss",
      meta: { kind: "console", platform: "xss" },
    },

    // Consoles — handheld
    "steam deck oled": {
      vertical: "games", query: "steam deck oled 1tb", refSource: "stockx",
      refPriceCents: 68000,
      productName: "Steam Deck OLED 1TB — Valve",
      productId: "sx-valve-deck-oled-1tb",
      meta: { kind: "console", platform: "steam-deck" },
    },
    "analogue pocket": {
      vertical: "games", query: "analogue pocket", refSource: "stockx",
      refPriceCents: 28000,
      productName: "Analogue Pocket — Handheld",
      productId: "sx-analogue-pocket",
      meta: { kind: "console", platform: "analogue-pocket" },
    },

    // Consoles — retro
    "game boy color": {
      vertical: "games", query: "game boy color", refSource: "stockx",
      refPriceCents: 9500,
      productName: "Game Boy Color — Nintendo (1998)",
      productId: "sx-nin-gbc",
      meta: { kind: "console", platform: "gbc" },
    },
    "super nintendo": {
      vertical: "games", query: "super nintendo snes", refSource: "stockx",
      refPriceCents: 18000,
      productName: "Super Nintendo SNES — Console (1990)",
      productId: "sx-nin-snes",
      meta: { kind: "console", platform: "snes" },
    },
    "sega dreamcast": {
      vertical: "games", query: "sega dreamcast", refSource: "stockx",
      refPriceCents: 22000,
      productName: "Sega Dreamcast — Console (1998)",
      productId: "sx-sega-dreamcast",
      meta: { kind: "console", platform: "dreamcast" },
    },

    // Games — Switch
    "zelda tears of the kingdom": {
      vertical: "games", query: "zelda tears of the kingdom", refSource: "stockx",
      refPriceCents: 5900,
      productName: "The Legend of Zelda: Tears of the Kingdom (Switch)",
      productId: "sx-nin-totk",
      meta: { kind: "game", platform: "switch" },
    },
    "zelda tears of the kingdom collector": {
      vertical: "games", query: "zelda tears of the kingdom collector edition", refSource: "stockx",
      refPriceCents: 22000,
      productName: "Zelda — Tears of the Kingdom Collector's Edition (Switch)",
      productId: "sx-nin-totk-ce",
      meta: { kind: "game", platform: "switch" },
    },
    "mario kart 8 deluxe": {
      vertical: "games", query: "mario kart 8 deluxe", refSource: "stockx",
      refPriceCents: 4800,
      productName: "Mario Kart 8 Deluxe (Switch)",
      productId: "sx-nin-mk8d",
      meta: { kind: "game", platform: "switch" },
    },
    "super mario odyssey": {
      vertical: "games", query: "super mario odyssey", refSource: "stockx",
      refPriceCents: 4500,
      productName: "Super Mario Odyssey (Switch)",
      productId: "sx-nin-mario-odyssey",
      meta: { kind: "game", platform: "switch" },
    },

    // Games — PS5
    "final fantasy vii rebirth collector": {
      vertical: "games", query: "final fantasy vii rebirth collector edition", refSource: "stockx",
      refPriceCents: 36000,
      productName: "Final Fantasy VII Rebirth — Collector's Edition (PS5)",
      productId: "sx-sqe-ff7r-ce",
      meta: { kind: "game", platform: "ps5" },
    },
    "spider-man 2": {
      vertical: "games", query: "marvel spider-man 2", refSource: "stockx",
      refPriceCents: 5900,
      productName: "Marvel's Spider-Man 2 (PS5)",
      productId: "sx-insomniac-sm2",
      meta: { kind: "game", platform: "ps5" },
    },
    "elden ring": {
      vertical: "games", query: "elden ring", refSource: "stockx",
      refPriceCents: 3900,
      productName: "Elden Ring (PS5)",
      productId: "sx-fromsoft-er-ps5",
      meta: { kind: "game", platform: "ps5" },
    },
    "metal gear solid delta collector": {
      vertical: "games", query: "metal gear solid delta snake eater collector", refSource: "stockx",
      refPriceCents: 19000,
      productName: "Metal Gear Solid Δ: Snake Eater — Deluxe (PS5)",
      productId: "sx-konami-mgsd",
      meta: { kind: "game", platform: "ps5" },
    },

    // Games — PS2 (retro, collector territory)
    "metal gear solid 3 ps2": {
      vertical: "games", query: "metal gear solid 3 snake eater ps2", refSource: "stockx",
      refPriceCents: 4500,
      productName: "Metal Gear Solid 3: Snake Eater (PS2, PAL)",
      productId: "sx-konami-mgs3-ps2",
      meta: { kind: "game", platform: "ps2" },
    },
    "shadow of the colossus ps2": {
      vertical: "games", query: "shadow of the colossus ps2", refSource: "stockx",
      refPriceCents: 6500,
      productName: "Shadow of the Colossus (PS2, PAL)",
      productId: "sx-sony-sotc-ps2",
      meta: { kind: "game", platform: "ps2" },
    },

    // Games — SNES / retro
    "chrono trigger snes": {
      vertical: "games", query: "chrono trigger snes", refSource: "stockx",
      refPriceCents: 25000,
      productName: "Chrono Trigger (SNES, EU)",
      productId: "sx-square-chrono-snes",
      meta: { kind: "game", platform: "snes" },
    },
    "earthbound snes": {
      vertical: "games", query: "earthbound snes", refSource: "stockx",
      refPriceCents: 42000,
      productName: "EarthBound (SNES, EU)",
      productId: "sx-nin-earthbound-snes",
      meta: { kind: "game", platform: "snes" },
    },

    // Games — N64
    "ocarina of time n64": {
      vertical: "games", query: "ocarina of time n64", refSource: "stockx",
      refPriceCents: 8900,
      productName: "The Legend of Zelda: Ocarina of Time (N64, PAL)",
      productId: "sx-nin-oot-n64",
      meta: { kind: "game", platform: "n64" },
    },

    // Games — Game Boy
    "pokemon red gameboy": {
      vertical: "games", query: "pokemon red game boy", refSource: "stockx",
      refPriceCents: 7500,
      productName: "Pokémon Red Version (Game Boy)",
      productId: "sx-nin-pkmn-red-gb",
      meta: { kind: "game", platform: "gb" },
    },
  },
  shoes: {
    "jordan 1 chicago": {
      vertical: "shoes",
      query: "air jordan 1 chicago",
      refSource: "stockx",
      refPriceCents: 46000,
      productName: "Air Jordan 1 Retro High OG 'Chicago Lost & Found'",
      productId: "sx-aj1-chicago-lf",
    },
    "jordan 4 bred": {
      vertical: "shoes",
      query: "air jordan 4 bred",
      refSource: "stockx",
      refPriceCents: 28000,
      productName: "Air Jordan 4 Retro 'Bred Reimagined'",
      productId: "sx-aj4-bred",
    },
    "dunk low panda": {
      vertical: "shoes",
      query: "nike dunk low panda",
      refSource: "stockx",
      refPriceCents: 12000,
      productName: "Nike Dunk Low 'Panda' White Black",
      productId: "sx-nk-dunk-panda",
    },
    "yeezy 350 zebra": {
      vertical: "shoes",
      query: "yeezy 350 zebra",
      refSource: "stockx",
      refPriceCents: 28000,
      productName: "adidas Yeezy Boost 350 V2 'Zebra'",
      productId: "sx-yz-350-zebra",
    },
    "samba og white": {
      vertical: "shoes",
      query: "adidas samba og white",
      refSource: "stockx",
      refPriceCents: 11000,
      productName: "adidas Samba OG 'White Black Gum'",
      productId: "sx-ad-samba-og",
    },
    "new balance 550 white": {
      vertical: "shoes",
      query: "new balance 550 white green",
      refSource: "stockx",
      refPriceCents: 13500,
      productName: "New Balance 550 'White Green'",
      productId: "sx-nb-550-wg",
    },
    "travis scott jordan 1 low mocha": {
      vertical: "shoes",
      query: "travis scott jordan 1 low mocha",
      refSource: "stockx",
      refPriceCents: 96000,
      productName: "Travis Scott × Air Jordan 1 Low 'Mocha'",
      productId: "sx-ts-aj1-mocha",
    },
    "off white dunk": {
      vertical: "shoes",
      query: "off-white nike dunk low",
      refSource: "stockx",
      refPriceCents: 72000,
      productName: "Off-White × Nike Dunk Low '50 Lot'",
      productId: "sx-ow-dunk-50",
    },
  },
}

interface ResolveOpts {
  /** Games vertical: filter by kind (console vs game). */
  kind?: GameKind
  /** Games vertical: filter by platform id (e.g. "ps5", "snes"). */
  platform?: string
  /** Pokémon vertical: filter by set id (e.g. "base-set", "sv-151"). */
  pokemonSet?: string
}

/**
 * Shorthand → canonical expansions. Applied to both the query and the
 * catalog key before scoring. Keeps "ps5" from matching "ps5 pro" simply
 * because they share a prefix.
 */
const QUERY_ALIASES: Record<string, string> = {
  // Sony
  ps5: "playstation 5",
  ps4: "playstation 4",
  ps3: "playstation 3",
  ps2: "playstation 2",
  ps1: "playstation 1",
  psp: "psp",
  // Microsoft
  xsx: "xbox series x",
  xss: "xbox series s",
  xbox: "xbox",
  // Nintendo
  switch2: "nintendo switch 2",
  switch: "nintendo switch",
  snes: "super nintendo",
  nes: "nintendo nes",
  n64: "nintendo 64",
  gba: "game boy advance",
  gbc: "game boy color",
  gb: "game boy",
  // Games
  totk: "tears of the kingdom",
  botw: "breath of the wild",
  mgs: "metal gear solid",
  ff7: "final fantasy vii",
  // Sneakers
  aj1: "air jordan 1",
  aj4: "air jordan 4",
  af1: "air force 1",
}

function normalize(s: string): string {
  const trimmed = s.trim().toLowerCase()
  if (!trimmed) return trimmed
  // Whole-string alias wins outright.
  if (QUERY_ALIASES[trimmed]) return QUERY_ALIASES[trimmed]
  // Per-token expansion, but skip if the alias's tokens would duplicate
  // something already in the input — avoids "nintendo switch" becoming
  // "nintendo nintendo switch".
  const tokens = trimmed.split(/\s+/)
  const expanded = tokens.map((t) => {
    const alias = QUERY_ALIASES[t]
    if (!alias) return t
    const aliasTokens = alias.split(/\s+/)
    const wouldDuplicate = aliasTokens.some(
      (at) => at !== t && tokens.includes(at),
    )
    return wouldDuplicate ? t : alias
  })
  return expanded.join(" ")
}

export function resolveCatalog(
  query: string,
  vertical: Vertical,
  opts: ResolveOpts = {},
): CatalogRef | null {
  const q = normalize(query)
  if (!q) return null
  const verticalMap = CATALOG[vertical]
  const entries = Object.entries(verticalMap).filter(([, ref]) =>
    matchesOpts(ref, opts),
  )
  if (entries.length === 0) return null

  // Exact match on normalized key or ref.query.
  for (const [key, ref] of entries) {
    if (normalize(key) === q || normalize(ref.query) === q) return ref
  }

  // Token-overlap score. Prefer refs whose tokens match the query tightly,
  // penalizing those with extra qualifier tokens ("pro", "collector") that
  // the query didn't mention.
  const qTokens = q.split(/\s+/).filter(Boolean)
  let best: CatalogRef | null = null
  let bestScore = 0
  for (const [key, ref] of entries) {
    const candidate = normalize(`${key} ${ref.query}`)
    const candidateTokens = [
      ...new Set(candidate.split(/\s+/).filter(Boolean)),
    ]
    const matched = qTokens.filter((t) => candidateTokens.includes(t)).length
    if (matched === 0) continue
    const coverage = matched / qTokens.length
    const extra = Math.max(0, candidateTokens.length - matched)
    const score = coverage * 100 - extra * 5
    if (score > bestScore) {
      bestScore = score
      best = ref
    }
  }
  return bestScore > 0 ? best : null
}

/**
 * Resolve a catalog ref by its stable productId. Used when the user
 * overrides the auto-match via the "Cambia riferimento" dropdown.
 */
export function resolveCatalogById(productId: string): CatalogRef | null {
  for (const verticalMap of Object.values(CATALOG)) {
    for (const ref of Object.values(verticalMap)) {
      if (ref.productId === productId) return ref
    }
  }
  return null
}

export function allCatalogEntries(
  vertical: Vertical,
  opts: ResolveOpts = {},
): CatalogRef[] {
  return Object.values(CATALOG[vertical]).filter((r) => matchesOpts(r, opts))
}

function matchesOpts(ref: CatalogRef, opts: ResolveOpts): boolean {
  if (opts.kind && ref.meta?.kind && ref.meta.kind !== opts.kind) return false
  if (opts.platform && ref.meta?.platform && ref.meta.platform !== opts.platform) return false
  if (opts.pokemonSet && opts.pokemonSet !== "any") {
    if (!ref.meta?.set || ref.meta.set !== opts.pokemonSet) return false
  }
  return true
}
