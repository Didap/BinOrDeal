/**
 * Shoes vertical — keyword refinement + listing post-filter.
 *
 * The noise problem:
 *   Sneaker brands (Jordan, Yeezy, Nike, Dunk, Off-White) slap their name
 *   on t-shirts, hoodies, hats, socks, lego sets, stickers. A naive keyword
 *   search for "jordan 1" on Vinted returns a firehose of branded apparel.
 *
 * The two-signal fix:
 *   (1) Shoe markers in the title — either a shoe size (EU 35-48 / US 5-13
 *       / UK 3-12) or a shoe-vocabulary token (scarpa, sneaker, retro, dunk,
 *       air, low, high, mid, og).
 *   (2) Apparel/merch blocklist — drop anything that names a non-shoe
 *       product even if it also says "Jordan" (t-shirt, felpa, cappello,
 *       calze, lego, poster, sticker, portachiavi, figura).
 *
 * A listing passes if it has ≥1 shoe signal AND 0 blocklist hits.
 */

export type ShoeGender = "uomo" | "donna" | "unisex"

/** EU 35-48 is the practical men+women range. */
const EU_SIZE_RE = /\b(3[5-9]|4[0-8])\b(?:\s?(?:eu|europa|european)?)/i

/** US 5-13 with halves. */
const US_SIZE_RE = /\bus\s?(?:[5-9]|1[0-3])(?:[.,]5)?\b/i

/** UK 3-12 with halves. */
const UK_SIZE_RE = /\buk\s?(?:[3-9]|1[0-2])(?:[.,]5)?\b/i

/** Italian "taglia XX" / "numero XX" / "n. XX". */
const TAGLIA_RE = /\b(?:taglia|numero|n\.?)\s?(3[5-9]|4[0-8])\b/i

/** Shoe-hardware vocabulary. */
const SHOE_TOKEN_RE =
  /\b(scarpa|scarpe|sneaker|sneakers|sneakerhead|runner|retro\s?(high|low|mid)?|retro|high\s?og|low\s?og|mid\s?og|hi\s?og|og\b|dunk\b|air\s?(force|max|jordan)?|am\s?\d+|af\s?1|aj\s?\d+|zoom\b|boost\b|yeezy\s?(boost|slide|foam)?|samba|gazelle|stan\s?smith|superstar|forum\s?low|huarache|blazer\b|cortez\b|react\b|vomero\b|pegasus|invincible\b|new\s?balance\s?\d+|nb\s?\d+|asics\s?(gel|nimbus|kayano)|gel\s?kayano|gel\s?lyte|gel\s?nimbus)\b/i

export function hasShoeSignal(title: string): boolean {
  return (
    EU_SIZE_RE.test(title) ||
    US_SIZE_RE.test(title) ||
    UK_SIZE_RE.test(title) ||
    TAGLIA_RE.test(title) ||
    SHOE_TOKEN_RE.test(title)
  )
}

/**
 * Non-shoe Jordan/Yeezy/Nike-branded merch. Words that, when present,
 * flip the listing to "not a shoe" regardless of other signals.
 */
const APPAREL_BLOCKLIST_RE =
  /\b(maglietta|magliette|t[- ]?shirt|tshirt|canotta|tanktop|felpa|felpe|hoodie|sweatshirt|giacca|jacket|giubbotto|cappotto|camicia|pantaloni|pantaloncini|shorts|short|bermuda|leggings|tuta|tute|pigiama|intimo|boxer|slip|calze|calzini|socks|calzino|cappello|cappellino|snapback|berretto|bandana|sciarpa|guanti|cintura|portachiavi|keychain|adesivo|adesivi|sticker|poster|stampa|stampe|quadro|cornice|lego|puzzle|pupazzo|pupazzetto|funko|figura|figurina|figurine|action\s?figure|zaino|borsa|marsupio|cartella|astuccio|asciugamano|tazza|bottiglia|thermos|copertina|cover\s?iphone|cover\s?samsung|cover\s?telefono|custodia\s?telefono|tappetino|mousepad|portafogli|portafoglio|wallet)\b/i

export function hasApparelBlocklist(title: string): boolean {
  return APPAREL_BLOCKLIST_RE.test(title)
}

/** Combined: pass iff ≥1 shoe signal AND 0 blocklist hits. */
export function titleIsShoe(title: string): boolean {
  if (hasApparelBlocklist(title)) return false
  return hasShoeSignal(title)
}

/**
 * Refine the marketplace keyword for shoes. If the user specified a size,
 * append it — this both ranks shoe listings higher and lets us post-filter
 * on it with extra confidence.
 */
export function refineShoesQuery(q: string, size: string | undefined): string {
  const base = q.trim()
  if (!base) return base
  if (!size || size === "any") return base
  // Size is stored as raw string like "42" or "us 9" — just append if not present.
  if (base.toLowerCase().includes(size.toLowerCase())) return base
  return `${base} ${size}`
}

/** EU sizes used in the dropdown. */
export const EU_SIZES = [
  "35", "35.5",
  "36", "36.5",
  "37", "37.5",
  "38", "38.5",
  "39", "39.5",
  "40", "40.5",
  "41", "41.5",
  "42", "42.5",
  "43", "43.5",
  "44", "44.5",
  "45", "45.5",
  "46", "46.5",
  "47", "47.5",
  "48",
] as const
