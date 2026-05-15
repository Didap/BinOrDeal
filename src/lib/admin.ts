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

  const { data: dbUser, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  if (error || !dbUser || dbUser.role !== "admin") {
    redirect("/")
  }

  return { supabaseUser: user, dbUser }
}

/**
 * Fetch all users with their total search count.
 */
export async function getAllUsersWithStats(): Promise<UserWithStats[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      search_logs:search_logs(count)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users with stats:", error.message)
    return []
  }

  return data.map((u: any) => ({
    id: u.id,
    email: u.email,
    tier: u.tier,
    role: u.role,
    createdAt: new Date(u.created_at),
    updatedAt: new Date(u.updated_at),
    searchCount: u.search_logs?.[0]?.count ?? 0
  }))
}

/**
 * Fetch a single user by ID.
 */
export async function getUserById(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()

  if (error) return null
  return data
}

/**
 * Fetch search logs for a specific user, ordered by most recent first.
 */
export async function getUserSearchLogs(userId: string, limit = 200): Promise<SearchLog[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("search_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return []
  return data.map((log: any) => ({
    ...log,
    createdAt: new Date(log.created_at)
  }))
}

/**
 * Fetch all search logs with user emails (joined).
 */
export async function getAllSearchLogs(limit = 500): Promise<any[]> {
  const supabase = await createClient()
  
  // Use explicit relationship name to help PostgREST find the join
  const { data, error } = await supabase
    .from("search_logs")
    .select(`
      *,
      users!search_logs_user_id_users_id_fk(email)
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching logs with join, trying without join:", error.message)
    // Fallback: fetch without join if the schema cache is still stale
    const { data: simpleData, error: simpleError } = await supabase
      .from("search_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
    
    if (simpleError) {
      console.error("Error fetching simple logs:", simpleError.message)
      return []
    }
    
    return simpleData.map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      sessionId: log.session_id,
      userIp: log.user_ip,
      query: log.query,
      vertical: log.vertical,
      minPriceCents: log.min_price_cents,
      maxPriceCents: log.max_price_cents,
      platforms: log.platforms,
      createdAt: new Date(log.created_at),
      userEmail: null
    }))
  }

  return data.map((log: any) => ({
    id: log.id,
    userId: log.user_id,
    sessionId: log.session_id,
    userIp: log.user_ip,
    query: log.query,
    vertical: log.vertical,
    minPriceCents: log.min_price_cents,
    maxPriceCents: log.max_price_cents,
    platforms: log.platforms,
    createdAt: new Date(log.created_at),
    userEmail: log.users?.email ?? null
  }))
}

/**
 * Fetch custom thresholds for a specific user.
 */
export async function getUserThresholds(userId: string): Promise<any[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("user_thresholds")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) return []
  return data.map((t: any) => ({
    ...t,
    productId: t.product_id,
    dealPriceCents: t.deal_price_cents,
    binPriceCents: t.bin_price_cents,
    updatedAt: new Date(t.updated_at)
  }))
}

export type GlobalStats = {
  totalUsers: number
  totalSearches: number
  searchesToday: number
  anonymousSearches: number
  totalAlerts: number
  notificationsToday: number
  notificationsWeekly: number
  topQueries: { query: string; count: number }[]
  topPlatforms: { name: string; count: number }[]
}

/**
 * Get global stats for the admin dashboard.
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  const supabase = await createClient()

  // 1. Total Users
  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })

  // 2. Total Searches
  const { count: totalSearches } = await supabase
    .from("search_logs")
    .select("*", { count: "exact", head: true })

  // 3. Searches Today
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const { count: searchesToday } = await supabase
    .from("search_logs")
    .select("*", { count: "exact", head: true })
    .gt("created_at", dayAgo.toISOString())

  // 4. Anonymous Searches (null user_id)
  const { count: anonymousSearches } = await supabase
    .from("search_logs")
    .select("*", { count: "exact", head: true })
    .is("user_id", null)

  // 5. Total Alerts (active)
  const { count: totalAlerts } = await supabase
    .from("price_alerts")
    .select("*", { count: "exact", head: true })
    .eq("is_enabled", 1)

  // 6. Notifications Today (last 24h)
  const { count: notificationsToday } = await supabase
    .from("price_alert_notifications")
    .select("*", { count: "exact", head: true })
    .gt("created_at", dayAgo.toISOString())

  // 7. Notifications Weekly (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const { count: notificationsWeekly } = await supabase
    .from("price_alert_notifications")
    .select("*", { count: "exact", head: true })
    .gt("created_at", weekAgo.toISOString())

  // 8. Analytics (Top Queries and Platforms)
  const { data: rawLogs } = await supabase
    .from("search_logs")
    .select("query, platforms")

  const queryCounts: Record<string, number> = {}
  const platformCounts: Record<string, number> = {}

  rawLogs?.forEach((log: any) => {
    if (log.query) {
      queryCounts[log.query] = (queryCounts[log.query] || 0) + 1
    }
    if (log.platforms) {
      log.platforms.split(",").forEach((p: string) => {
        platformCounts[p] = (platformCounts[p] || 0) + 1
      })
    }
  })

  const topQueries = Object.entries(queryCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const topPlatforms = Object.entries(platformCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    totalUsers: totalUsers || 0,
    totalSearches: totalSearches || 0,
    searchesToday: searchesToday || 0,
    anonymousSearches: anonymousSearches || 0,
    totalAlerts: totalAlerts || 0,
    notificationsToday: notificationsToday || 0,
    notificationsWeekly: notificationsWeekly || 0,
    topQueries,
    topPlatforms,
  }
}

/**
 * Update user metadata (tier, role).
 */
export async function updateUser(userId: string, data: { tier?: string; role?: string }) {
  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from("users")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) return null
  return updated
}
