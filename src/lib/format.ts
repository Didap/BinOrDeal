export function formatPrice(cents: number, currency: "EUR" | "USD" | "GBP" = "EUR") {
  const value = cents / 100
  const locale = currency === "EUR" ? "it-IT" : "en-US"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatRelative(iso: string) {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "ora"
  if (mins < 60) return `${mins}m fa`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h fa`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}g fa`
  const months = Math.round(days / 30)
  return `${months}mesi fa`
}

export function signedPercent(pct: number) {
  if (pct === 0) return "0%"
  const sign = pct > 0 ? "−" : "+" // Note: positive delta means CHEAPER → show as "−" of market price
  return `${sign}${Math.abs(pct)}%`
}

export const PLATFORM_LABELS: Record<string, string> = {
  ebay: "eBay",
  vinted: "Vinted",
  wallapop: "Wallapop",
  subito: "Subito",
}

export const VERTICAL_LABELS: Record<string, string> = {
  pokemon: "Carte Pokémon",
  coins: "Monete",
  games: "Console & Videogiochi",
  shoes: "Scarpe",
}

export const CONDITION_LABELS: Record<string, string> = {
  mint: "mint",
  "near-mint": "near-mint",
  excellent: "eccellente",
  good: "buono",
  played: "giocato",
  poor: "rovinato",
  unknown: "—",
}

export const TIER_LABELS: Record<string, string> = {
  deal: "DEAL",
  fair: "FAIR",
  bin: "BIN",
  unknown: "PREZZO?",
}

export const COUNTRY_FLAGS: Record<string, string> = {
  IT: "IT",
  ES: "ES",
  FR: "FR",
  DE: "DE",
  NL: "NL",
  EU: "EU",
}
