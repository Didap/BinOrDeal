import { cookies } from "next/headers"
import { db } from "@/db/client"
import { searchLogs, users } from "@/db/schema"
import { count, eq, and, gt, desc, isNull } from "drizzle-orm"
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

export async function checkSearchQuota(userId?: string): Promise<QuotaStatus> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("bid_session_id")?.value ?? "unknown"

  if (!db) {
    return { allowed: true, remaining: 1, total: 1, tier: "anonymous" }
  }

  try {
    // 1. Check if user is logged in
    if (userId) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      
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

    // 2. Anonymous: check session quota
    const [sessionCount] = await db
      .select({ val: count() })
      .from(searchLogs)
      .where(
        and(
          eq(searchLogs.sessionId, sessionId),
          isNull(searchLogs.userId)
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
    console.error("Quota check failed (DB likely not connected):", error)
    // Fallback: allow search if DB is down to not block dev/prod
    return { allowed: true, remaining: 1, total: 1, tier: "anonymous" }
  }
}

export async function logSearch(params: {
  userId?: string
  query: string
  vertical: string
}) {
  if (!db) return

  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("bid_session_id")?.value ?? "unknown"

    await db.insert(searchLogs).values({
      id: randomUUID(),
      userId: params.userId ?? null,
      sessionId,
      query: params.query,
      vertical: params.vertical,
    })
  } catch (error) {
    console.error("Failed to log search:", error)
  }
}
