/**
 * Detect Pokémon listings that are raffles / mystery boxes / "draw a card"
 * stunts dressed up as a real product. The marketplaces are full of these:
 *
 *   "🎟 LOTTERIA Charizard PSA — €5 al ticket"
 *   "Mystery box pokemon — 1€ random card"
 *   "Estrazione carta Charizard 1ª edizione"
 *   "Sorteo carta Pokemon — entra y prueba"
 *
 * The price displayed (often €1–€5) is the *ticket cost*, not the price of
 * the card pictured. Without filtering they pollute every Pokémon search and
 * — worse — score as massive "DEALS" because the listed price is far below
 * the catalog ref. This module exposes a single boolean check used both to
 * drop them (when the user checks "escludi lotterie", default for pokemon)
 * and to flag them (when the user unchecks the box and wants to see them
 * marked instead).
 *
 * Scope: pokemon vertical only. Other verticals routinely use words like
 * "lotto" (lots/bundles, valid) or "mystery" (game titles, set names) that
 * would generate false positives.
 */

/**
 * Strong stand-alone tokens — anywhere in the title means "raffle".
 * Multi-language: Italian, English, Spanish (Wallapop locale).
 */
const STANDALONE_LOTTERY_RE = new RegExp(
  [
    "\\blotter[ìi]a\\b",
    "\\blottery\\b",
    "\\bestrazion[ei]\\b",
    "\\bgive\\s?away\\b",
    "\\bsorteggi[oa]\\b",
    "\\bsorteo\\b",
    "\\braffle\\b",
    "\\btombola\\b",
    // Italian "abbonamento giornaliero" raffle subscription patterns
    "\\baste\\s?live\\b",
    // Spanish: "rasca y gana", "rifa"
    "\\brifa\\b",
    "\\brasca\\b",
  ].join("|"),
  "i",
)

/**
 * "Mystery <container>" patterns — "mystery box", "mystery pack",
 * "mystery booster", "mystery bundle", plus the IT/ES variants
 * "busta misteriosa", "carta misteriosa", "sobre misterioso".
 *
 * "mystery" alone is intentionally NOT enough: there are real Pokémon products
 * named "Mystery Powers". We require it to co-occur with a container word.
 */
const MYSTERY_CONTAINER_RE = new RegExp(
  [
    // EN: mystery box / pack / booster / bundle / card(s) / pull
    "\\bmiste?ry\\s+(box|pack|booster|bundle|cards?|pulls?|grab\\s?bag)\\b",
    // IT: busta/carta/pacchetto misterios[oae]
    "\\b(bust[ea]|cart[ae]|pacchett[oi])\\s+misterios[oae]?\\b",
    // ES: sobre misterioso
    "\\bsobre\\s+misterios[oa]\\b",
    // Generic "scopri cosa esce" / "carta a sorpresa"
    "\\bcart[ae]?\\s+a\\s+sorpresa\\b",
  ].join("|"),
  "i",
)

/**
 * Random-pull / "you get a random card" phrasing. Often paired with a hero
 * image of a high-value card to bait the click.
 */
const RANDOM_DRAW_RE = new RegExp(
  [
    "\\brandom\\s+(card|pull|carta)\\b",
    "\\bcarta\\s+random\\b",
    // "1 carta a caso", "una carta a sorte"
    "\\b\\d+\\s*cart[ae]?\\s+a\\s+(caso|sorte)\\b",
  ].join("|"),
  "i",
)

/**
 * Returns true if the title looks like a Pokémon raffle / mystery-box listing
 * rather than a real card sale. Used both to filter (drop) and to flag
 * (`Score.flag = "lottery"`).
 */
export function isPokemonLottery(title: string): boolean {
  if (!title) return false
  if (STANDALONE_LOTTERY_RE.test(title)) return true
  if (MYSTERY_CONTAINER_RE.test(title)) return true
  if (RANDOM_DRAW_RE.test(title)) return true
  return false
}
