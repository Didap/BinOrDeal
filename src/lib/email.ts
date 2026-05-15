import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? "alerts@binordeal.com"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://binordeal.com"

export interface AlertMatch {
  title: string
  priceCents: number
  url: string
  platform: string
  thumbnail?: string
}

/**
 * Send a price-alert email to the user when matches are found.
 * Max 3 listings highlighted in the email body.
 */
export async function sendAlertEmail(params: {
  to: string
  query: string
  targetPriceCents: number
  matches: AlertMatch[]
  alertId: string
}) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping alert email")
    return
  }

  const { to, query, targetPriceCents, matches, alertId } = params
  const targetPrice = (targetPriceCents / 100).toFixed(2)
  const bestPrice = (Math.min(...matches.map((m) => m.priceCents)) / 100).toFixed(2)
  const top3 = matches.slice(0, 3)

  const listingsHtml = top3
    .map(
      (m) => `
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 12px 0;">
            <div style="font-weight: 700; font-size: 14px; color: #1a1a1a;">
              ${escapeHtml(m.title.slice(0, 80))}${m.title.length > 80 ? "…" : ""}
            </div>
            <div style="font-family: monospace; font-size: 12px; color: #666; margin-top: 4px; text-transform: uppercase;">
              ${escapeHtml(m.platform)}
            </div>
          </td>
          <td style="padding: 12px 0; text-align: right; vertical-align: top;">
            <div style="font-family: monospace; font-weight: 700; font-size: 18px; color: #16a34a;">
              €${(m.priceCents / 100).toFixed(2)}
            </div>
            <a href="${m.url}" style="font-family: monospace; font-size: 11px; color: #16a34a; text-decoration: underline;">
              Vedi annuncio →
            </a>
          </td>
        </tr>
      `
    )
    .join("")

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
    <!-- Header -->
    <div style="background: #1a1a1a; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-family: monospace; font-size: 20px; font-weight: 900; color: #fff; letter-spacing: 0.1em;">
        BIN<span style="color: #16a34a;">or</span>DEAL
      </h1>
      <p style="margin: 8px 0 0; font-family: monospace; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.15em;">
        Price Alert
      </p>
    </div>

    <!-- Body -->
    <div style="background: #fff; border: 2px solid #1a1a1a; border-top: none; padding: 24px;">
      <div style="background: #f0fdf4; border: 2px solid #16a34a; padding: 16px; margin-bottom: 24px;">
        <div style="font-family: monospace; font-size: 11px; color: #16a34a; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">
          🔔 Prezzo trovato!
        </div>
        <div style="font-size: 16px; font-weight: 700; color: #1a1a1a; margin-top: 8px;">
          Abbiamo trovato <strong>${matches.length}</strong> risultat${matches.length === 1 ? "o" : "i"} per "<strong>${escapeHtml(query)}</strong>" sotto il tuo target di <strong>€${targetPrice}</strong>.
        </div>
        <div style="font-family: monospace; font-size: 14px; color: #16a34a; margin-top: 4px; font-weight: 700;">
          Miglior prezzo: €${bestPrice}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        ${listingsHtml}
      </table>

      ${matches.length > 3 ? `<p style="font-family: monospace; font-size: 11px; color: #666; margin-top: 12px;">+ altri ${matches.length - 3} risultati</p>` : ""}

      <div style="margin-top: 24px; text-align: center;">
        <a href="${APP_URL}/search?q=${encodeURIComponent(query)}" style="display: inline-block; background: #1a1a1a; color: #fff; font-family: monospace; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 12px 32px; text-decoration: none; border: 2px solid #1a1a1a;">
          Vedi tutti i risultati →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 16px; text-align: center;">
      <p style="font-family: monospace; font-size: 10px; color: #999; margin: 0;">
        Ricevi questa email perché hai un alert attivo su BinOrDeal.
        <a href="${APP_URL}/dashboard/alerts" style="color: #666;">Gestisci alert</a>
      </p>
    </div>
  </div>
</body>
</html>
  `

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `🔔 Prezzo trovato: "${query}" da €${bestPrice}`,
    html,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
