import { createClient } from "@/lib/supabase/server"
import { db } from "@/db/client"
import { users, searchLogs, type User, type SearchLog } from "@/db/schema"
import { eq, desc, count, sql, gt, isNull } from "drizzle-orm"
import { redirect } from "next/navigation"

export type UserWithStats = {
  id: string
  email: string
  tier: string
  role: string
  createdAt: Date
  updatedAt: Date
  searchCount: number
}

/**
 * Server-side admin guard. Must be called in every admin route's
 * server component. Redirects to "/" if the user is not an admin.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  if (!db) redirect("/")

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!dbUser || dbUser.role !== "admin") redirect("/")

  return { supabaseUser: user, dbUser }
}

/**
 * Fetch all users with their total search count.
 */
export async function getAllUsersWithStats(): Promise<UserWithStats[]> {
  if (!db) return []

  const result = await db
    .select({
      id: users.id,
      email: users.email,
      tier: users.tier,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      searchCount: count(searchLogs.id),
    })
    .from(users)
    .leftJoin(searchLogs, eq(users.id, searchLogs.userId))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))

  return result
}

/**
 * Fetch a single user by ID.
 */
export async function getUserById(userId: string) {
  if (!db) return null

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return user ?? null
}

/**
 * Fetch search logs for a specific user, ordered by most recent first.
 */
export async function getUserSearchLogs(userId: string, limit = 200): Promise<SearchLog[]> {
  if (!db) return []

  return db
    .select()
    .from(searchLogs)
    .where(eq(searchLogs.userId, userId))
    .orderBy(desc(searchLogs.createdAt))
    .limit(limit)
}

export type GlobalStats = {
  totalUsers: number
  totalSearches: number
  searchesToday: number
  anonymousSearches: number
  topQueries: { query: string; count: number }[]
  topPlatforms: { name: string; count: number }[]
}

/**
 * Get global stats for the admin dashboard.
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  if (!db) {
    return { 
      totalUsers: 0, 
      totalSearches: 0, 
      searchesToday: 0, 
      anonymousSearches: 0,
      topQueries: [],
      topPlatforms: [],
    }
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [userCount] = await db.select({ val: count() }).from(users)
  const [searchCount] = await db.select({ val: count() }).from(searchLogs)
  const [searchTodayCount] = await db
    .select({ val: count() })
    .from(searchLogs)
    .where(gt(searchLogs.createdAt, dayAgo))
  const [anonCount] = await db
    .select({ val: count() })
    .from(searchLogs)
    .where(isNull(searchLogs.userId))

  // Analytics: Top 10 queries
  const topQueries = await db
    .select({
      query: searchLogs.query,
      count: count(),
    })
    .from(searchLogs)
    .groupBy(searchLogs.query)
    .orderBy(desc(count()))
    .limit(10)

  // Analytics: Platform popularity
  const allLogs = await db
    .select({ platforms: searchLogs.platforms })
    .from(searchLogs)
    .where(sql`${searchLogs.platforms} IS NOT NULL`)

  const platformCounts: Record<string, number> = {}
  allLogs.forEach((log: { platforms: string | null }) => {
    if (log.platforms) {
      log.platforms.split(",").forEach((p: string) => {
        platformCounts[p] = (platformCounts[p] ?? 0) + 1
      })
    }
  })

  const topPlatforms = Object.entries(platformCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalUsers: userCount?.val ?? 0,
    totalSearches: searchCount?.val ?? 0,
    searchesToday: searchTodayCount?.val ?? 0,
    anonymousSearches: anonCount?.val ?? 0,
    topQueries,
    topPlatforms,
  }
}

/**
 * Update user metadata (tier, role).
 */
export async function updateUser(userId: string, data: { tier?: string; role?: string }) {
  if (!db) return null

  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning()

  return updated ?? null
}
