"use server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/db/client"
import { priceAlerts, users } from "@/db/schema"
import { eq, and, count } from "drizzle-orm"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"

const MAX_ALERTS_PRO = 3

export type AlertFrequency = "hourly" | "daily" | "weekly"

export interface CreateAlertInput {
  query: string
  vertical: string
  params: string // JSON-serialized SearchParams subset
  targetPriceCents: number
  frequency: AlertFrequency
}

/**
 * Create a new price alert. Only Pro users, max 3 alerts.
 */
export async function createAlertAction(input: CreateAlertInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Devi effettuare il login.")
  if (!db) throw new Error("Database non connesso.")

  // Check user tier
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!dbUser || dbUser.tier !== "pro") {
    throw new Error("Gli alert sono disponibili solo per gli utenti Pro.")
  }

  // Check alert count
  const [alertCount] = await db
    .select({ val: count() })
    .from(priceAlerts)
    .where(
      and(
        eq(priceAlerts.userId, user.id),
        eq(priceAlerts.isEnabled, 1)
      )
    )

  if ((alertCount?.val ?? 0) >= MAX_ALERTS_PRO) {
    throw new Error(`Hai raggiunto il limite massimo di ${MAX_ALERTS_PRO} alert.`)
  }

  const id = randomUUID()
  await db.insert(priceAlerts).values({
    id,
    userId: user.id,
    query: input.query,
    vertical: input.vertical,
    params: input.params,
    targetPriceCents: input.targetPriceCents,
    frequency: input.frequency,
  })

  revalidatePath("/search")
  return { success: true, id }
}

/**
 * Delete (disable) a price alert.
 */
export async function deleteAlertAction(alertId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!db) throw new Error("Database non connesso.")

  await db
    .delete(priceAlerts)
    .where(
      and(
        eq(priceAlerts.id, alertId),
        eq(priceAlerts.userId, user.id)
      )
    )

  revalidatePath("/search")
  return { success: true }
}

/**
 * Toggle an alert's enabled state.
 */
export async function toggleAlertAction(alertId: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!db) throw new Error("Database non connesso.")

  // If enabling, check count
  if (enabled) {
    const [alertCount] = await db
      .select({ val: count() })
      .from(priceAlerts)
      .where(
        and(
          eq(priceAlerts.userId, user.id),
          eq(priceAlerts.isEnabled, 1)
        )
      )
    if ((alertCount?.val ?? 0) >= MAX_ALERTS_PRO) {
      throw new Error(`Hai raggiunto il limite massimo di ${MAX_ALERTS_PRO} alert attivi.`)
    }
  }

  await db
    .update(priceAlerts)
    .set({
      isEnabled: enabled ? 1 : 0,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(priceAlerts.id, alertId),
        eq(priceAlerts.userId, user.id)
      )
    )

  revalidatePath("/search")
  return { success: true }
}

/**
 * Get all alerts for the current user.
 */
export async function getUserAlertsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !db) return []

  const rows = await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.userId, user.id))
    .orderBy(priceAlerts.createdAt)

  return rows
}

/**
 * Get the count of active alerts for current user.
 */
export async function getAlertCountAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !db) return 0

  const [result] = await db
    .select({ val: count() })
    .from(priceAlerts)
    .where(
      and(
        eq(priceAlerts.userId, user.id),
        eq(priceAlerts.isEnabled, 1)
      )
    )

  return result?.val ?? 0
}
