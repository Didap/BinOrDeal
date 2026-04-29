import type { Listing } from "@/lib/types"

/**
 * Cross-vertical relevance scoring + noise filter.
 *
 * Marketplace keyword search is generous: a query "Mario Odyssey" returns
 * everything that contains "mario" OR "odyssey" in title/body, plus sponsored
 * picks from the same category. After fan-out we end up with 200+ listings
 * and most are not what the user asked for.
 *
 * This module owns three responsibilities:
 *
 *   1. Tokenize the query into "significant" tokens (drop stop-words and
 *      single-character noise). Accent-fold so "pokémon" matches "pokemon".
 *
 *   2. Compute a relevance score in [0..1] for each listing title:
 *        score = matchedTokens / totalTokens
 *        + phrase bonus (full normalized query as substring) +0.15
 *        × 0.5 if title hits the soft-noise pattern (lots/mixed/bundle)
 *        = 0   if title hits the hard-noise pattern (broken/replica/empty box)
 *
 *   3. Expose helpers to filter and re-rank: `passesRelevance` for the
 *      hard cut, `combinedRank` to mix relevance with the deal delta in
 *      the default sort.
 *
 * Vertical-specific filters (games console / shoes apparel blocklist) layer
 * on top of this — they remain authoritative for their domain. This is the
 * generic floor that applies to every search.
 */

const STOPWORDS = new Set([
  // Italian
  "il", "lo", "la", "i", "gli", "le", "un", "uno", "una",
  "di", "del", "della", "dello", "dei", "delle", "degli",
  "in", "nel", "nella", "con", "per", "su", "sul", "sulla",
  "tra", "fra", "e", "ed", "o", "od", "a", "al", "alla",
  "che", "non", "più", "piu",
  // English
  "the", "of", "to", "and", "or", "for", "with", "on", "at", "by",
  // Spanish (Wallapop locale leaks)
  "el", "los", "las", "y", "de", "del", "con", "por", "para",
])

/**
 * Hard noise: the listing is almost certainly NOT what the user wants.
 * Drop entirely. Conservative — only words that flip the meaning of the
 * listing.
 */
const HARD_NOISE_RE = new RegExp(
  [
    // empty boxes
    "\\b(scatola\\s?vuota|solo\\s?scatola|empty\\s?box|caja\\s?vacia|solo\\s?caja|solo\\s?box)\\b",
    // spare parts (already covered for games but applies cross-vertical)
    "\\b(ricambio|ricambi|spare\\s?parts?|recambios?|repuesto|repuestos)\\b",
    // broken / not working
    "\\b(rotto|rotti|guasto|guasti|non\\s?funziona|non\\s?funzionante|broken|defectuoso|hs\\s?per\\s?ricambi)\\b",
    // replica / counterfeit / proxy
    "\\b(falsa|falso|fake|replica|riproduzione|proxy\\s?card|custom\\s?card)\\b",
    // pre-order — different transaction context
    "\\b(preordine|pre[- ]?order|prevendita|in\\s?uscita|disponibile\\s?dal)\\b",
  ].join("|"),
  "i",
)

/**
 * Soft noise: still might be relevant for some queries (esp. broad ones),
 * but typically degrades signal. Halve the score so an "exact" match still
 * wins, but a weak match falls below threshold.
 */
const SOFT_NOISE_RE = new RegExp(
  [
    "\\b(lotto|lotti|lot|stock|bulk|blocco|bundle|gruppo)\\b",
    "\\b(misti|misto|mixed|assortit[oi]|vari[oea]|surtido|surtidos)\\b",
  ].join("|"),
  "i",
)

export interface RelevanceResult {
  /** 0..1, where 1 is full token match + phrase hit, 0 is hard noise. */
  score: number
  matched: number
  total: number
  hardNoise: boolean
  softNoise: boolean
}

/** Default cut-off: keep items where ≥50% of significant tokens match. */
export const RELEVANCE_THRESHOLD = 0.5

/** Strip accents and lowercase. "Pokémon" → "pokemon". */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

/**
 * Split a query into "significant" tokens. Keeps:
 *   - words of length ≥ 3 that are not stop-words
 *   - any token containing a digit (so "ps5", "13", "42.5" all survive)
 *   - 2-char alphanum that pairs letter+digit (e.g. "v1", "x2")
 */
export function tokenizeQuery(query: string): string[] {
  return fold(query)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((tok) => {
      if (!tok) return false
      if (STOPWORDS.has(tok)) return false
      if (/\d/.test(tok)) return true
      return tok.length >= 3
    })
}

/**
 * Score a listing title against the query. Empty query returns score 1
 * (no relevance signal to apply) unless the title hits hard noise.
 */
export function relevanceOf(title: string, query: string): RelevanceResult {
  const haystack = fold(title)
  const hardNoise = HARD_NOISE_RE.test(haystack)
  const softNoise = SOFT_NOISE_RE.test(haystack)
  const tokens = tokenizeQuery(query)

  if (tokens.length === 0) {
    return {
      score: hardNoise ? 0 : 1,
      matched: 0,
      total: 0,
      hardNoise,
      softNoise,
    }
  }

  let matched = 0
  for (const tok of tokens) {
    if (haystack.includes(tok)) matched += 1
  }
  let score = matched / tokens.length

  // Phrase bonus — rewards titles that contain the user's exact phrase
  // ("Mario Odyssey" beats two listings that match each token separately).
  const phrase = fold(query.trim())
  if (phrase.length >= 4 && haystack.includes(phrase)) {
    score = Math.min(1, score + 0.15)
  }

  if (hardNoise) score = 0
  else if (softNoise) score = score * 0.5

  return { score, matched, total: tokens.length, hardNoise, softNoise }
}

export function passesRelevance(
  listing: Pick<Listing, "title">,
  query: string,
  threshold = RELEVANCE_THRESHOLD,
): boolean {
  return relevanceOf(listing.title, query).score >= threshold
}

/**
 * Combine relevance with deal delta into a single rank used by the default
 * sort. The intent: a high-relevance fair-priced item should beat a low-
 * relevance item that happens to be cheap.
 *
 * delta is mapped from the empirical band [-0.30, +0.50] to [0, 1]:
 *   -0.30 (BIN, 30% above ref)  → 0
 *    0.00 (at ref)              → 0.375
 *   +0.50 (DEAL, 50% below ref) → 1
 *
 * Weights (0.55 relevance / 0.45 deal) are biased toward relevance — a
 * 100%-relevant item at ref still outranks a 50%-relevant 30%-off deal.
 */
export function combinedRank(relevance: number, delta: number): number {
  const clamped = Math.max(-0.3, Math.min(0.5, delta))
  const dealNorm = (clamped + 0.3) / 0.8
  return 0.55 * relevance + 0.45 * dealNorm
}
