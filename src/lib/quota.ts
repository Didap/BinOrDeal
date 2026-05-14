import { cookies, headers } from "next/headers"
import { db } from "@/db/client"
import { searchLogs, users } from "@/db/schema"
import { count, eq, and, gt, isNull, or } from "drizzle-orm"
import { randomUUID } from "crypto"

const ANONYMOUS_QUOTA = 3
const FREE_QUOTA_PER_DAY = 10

export type QuotaStatus = {
  allowed: boolean
  remaining: number
  total: number
  tier: "anonymous" | "free" | "pro"
  reason?: "limit_reached" | "auth_required"
}

async function getClientIp() {
  const h = await headers()
  const xForwardedFor = h.get("x-forwarded-for")
  if (xForwardedFor) {
    // x-forwarded-for can be a list of IPs if there are multiple proxies
    return xForwardedFor.split(",")[0].trim()
  }
  return h.get("x-real-ip") ?? "unknown"
}

export async function checkSearchQuota(userId?: string, userEmail?: string): Promise<QuotaStatus> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("bid_session_id")?.value ?? "unknown"
  const clientIp = await getClientIp()

  if (!db) {
    return { allowed: true, remaining: 1, total: 1, tier: "anonymous" }
  }

  try {
    // 1. Check if user is logged in
    if (userId) {
      let [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      
      if (!user) {
        try {
          const [newUser] = await db.insert(users).values({
            id: userId,
            email: userEmail ?? "unknown@auth.supabase",
            tier: "free",
          }).returning()
          user = newUser
        } catch (e) {
          console.error("Failed to auto-provision user:", e)
        }
      }

      if (user?.tier === "pro") {
        return { allowed: true, remaining: 999, total: 999, tier: "pro" }
      }

      // Free user: check daily quota (last 24h)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const [logCount] = await db
        .select({ val: count() })
        .from(searchLogs)
        .where(
          and(
            eq(searchLogs.userId, userId),
            gt(searchLogs.createdAt, dayAgo)
          )
        )

      const remaining = Math.max(0, FREE_QUOTA_PER_DAY - (logCount?.val ?? 0))
      return {
        allowed: remaining > 0,
        remaining,
        total: FREE_QUOTA_PER_DAY,
        tier: "free",
        reason: remaining <= 0 ? "limit_reached" : undefined
      }
    }

    // 2. Anonymous: check session OR IP quota
    // This prevents bypassing limits by clearing cookies (session_id)
    const [sessionCount] = await db
      .select({ val: count() })
      .from(searchLogs)
      .where(
        and(
          isNull(searchLogs.userId),
          or(
            eq(searchLogs.sessionId, sessionId),
            eq(searchLogs.userIp, clientIp)
          )
        )
      )

    const remaining = Math.max(0, ANONYMOUS_QUOTA - (sessionCount?.val ?? 0))
    return {
      allowed: remaining > 0,
      remaining,
      total: ANONYMOUS_QUOTA,
      tier: "anonymous",
      reason: remaining <= 0 ? "auth_required" : undefined
    }
  } catch (error) {
    console.error("Quota check failed:", error)
    return { allowed: true, remaining: 1, total: 1, tier: "anonymous" }
  }
}

export async function logSearch(params: {
  userId?: string
  query: string
  vertical: string
  minPriceCents?: number | null
  maxPriceCents?: number | null
  platforms?: string | null
}) {
  if (!db) return

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("bid_session_id")?.value ?? "unknown"
    const clientIp = await getClientIp()

    await db.insert(searchLogs).values({
      id: randomUUID(),
      userId: params.userId ?? null,
      sessionId,
      userIp: clientIp,
      query: params.query,
      vertical: params.vertical,
      minPriceCents: params.minPriceCents ?? null,
      maxPriceCents: params.maxPriceCents ?? null,
      platforms: params.platforms ?? null,
    })
  } catch (error) {
    console.error("Failed to log search:", error)
  }
}
