import { db } from "@/db/client"
import { priceAlerts, users, priceAlertNotifications, type PriceAlert } from "@/db/schema"
import { eq } from "drizzle-orm"
import { runSearch } from "@/lib/search"
import { sendAlertEmail, type AlertMatch } from "@/lib/email"
import type { SearchParams, Vertical } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 300 // 5 min max for processing all alerts

const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/alerts/process
 *
 * Cron endpoint — processes all price alerts whose frequency interval
 * has elapsed since lastCheckedAt. For each alert that matches, sends
 * an email via Resend.
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function POST(req: Request) {
  // Auth check
  const authHeader = req.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!db) {
    return Response.json({ error: "Database not connected" }, { status: 500 })
  }

  const now = new Date()
  const results: { alertId: string; matches: number; emailed: boolean; error?: string }[] = []

  try {
    // Calculate cutoff times for each frequency
    const hourlyBefore = new Date(now.getTime() - 60 * 60 * 1000)
    const dailyBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const weeklyBefore = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Fetch all enabled alerts that need checking
    // We need to check each frequency group separately
    const allAlerts = await db
      .select({
        alert: priceAlerts,
        userEmail: users.email,
      })
      .from(priceAlerts)
      .innerJoin(users, eq(priceAlerts.userId, users.id))
      .where(eq(priceAlerts.isEnabled, 1))

    // Filter in JS for simplicity (frequency-dependent cutoff)
    const dueAlerts = allAlerts.filter((row: { alert: PriceAlert; userEmail: string }) => {
      const lastCheck = row.alert.lastCheckedAt?.getTime() ?? 0

      switch (row.alert.frequency) {
        case "hourly":
          return lastCheck < hourlyBefore.getTime()
        case "daily":
          return lastCheck < dailyBefore.getTime()
        case "weekly":
          return lastCheck < weeklyBefore.getTime()
        default:
          return lastCheck < dailyBefore.getTime()
      }
    })

    console.log(`[alerts/process] ${dueAlerts.length} alerts due (of ${allAlerts.length} total)`)

    // Process alerts sequentially to avoid hammering marketplace adapters
    for (const { alert, userEmail } of dueAlerts) {
      try {
        // Reconstruct SearchParams from stored JSON + alert fields
        let savedParams: Partial<SearchParams> = {}
        try {
          savedParams = JSON.parse(alert.params)
        } catch {}

        const searchParams: SearchParams = {
          q: alert.query,
          vertical: (alert.vertical as Vertical) ?? "tcg",
          ...savedParams,
        }

        // Run the search
        const searchResult = await runSearch(searchParams)

        // Filter listings that are at or below the target price
        const matching = searchResult.listings.filter(
          (l) => l.priceCents <= alert.targetPriceCents
        )

        // Update lastCheckedAt regardless of match
        await db
          .update(priceAlerts)
          .set({ lastCheckedAt: now, updatedAt: now })
          .where(eq(priceAlerts.id, alert.id))

        if (matching.length > 0) {
          // Send email
          const alertMatches: AlertMatch[] = matching
            .sort((a, b) => a.priceCents - b.priceCents)
            .slice(0, 5)
            .map((l) => ({
              title: l.title,
              priceCents: l.priceCents,
              url: l.url,
              platform: l.platform,
              thumbnail: l.thumbnail,
            }))

          await sendAlertEmail({
            to: userEmail,
            query: alert.query,
            targetPriceCents: alert.targetPriceCents,
            matches: alertMatches,
            alertId: alert.id,
          })

          // Log the notification for dashboard stats
          await db.insert(priceAlertNotifications).values({
            id: crypto.randomUUID(),
            alertId: alert.id,
            userId: alert.userId,
            lowestPriceCents: alertMatches[0].priceCents,
            targetPriceCents: alert.targetPriceCents,
            listingUrl: alertMatches[0].url,
          })

          // Update lastNotifiedAt
          await db
            .update(priceAlerts)
            .set({ lastNotifiedAt: now })
            .where(eq(priceAlerts.id, alert.id))

          results.push({ alertId: alert.id, matches: matching.length, emailed: true })
        } else {
          results.push({ alertId: alert.id, matches: 0, emailed: false })
        }
      } catch (e) {
        console.error(`[alerts/process] error on alert ${alert.id}:`, e)
        // Still update lastCheckedAt so we don't retry endlessly
        await db
          .update(priceAlerts)
          .set({ lastCheckedAt: now, updatedAt: now })
          .where(eq(priceAlerts.id, alert.id))
          .catch(() => {})

        results.push({
          alertId: alert.id,
          matches: 0,
          emailed: false,
          error: e instanceof Error ? e.message : "unknown",
        })
      }
    }

    return Response.json({
      processed: results.length,
      emailed: results.filter((r) => r.emailed).length,
      results,
    })
  } catch (e) {
    console.error("[alerts/process] fatal:", e)
    return Response.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    )
  }
}
