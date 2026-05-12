"use server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/db/client"
import { userThresholds } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"

export async function saveUserThreshold(params: {
  productId: string
  dealPriceCents?: number
  binPriceCents?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  if (!db) throw new Error("Database not connected")

  // Check if existing
  const [existing] = await db
    .select()
    .from(userThresholds)
    .where(
      and(
        eq(userThresholds.userId, user.id),
        eq(userThresholds.productId, params.productId)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(userThresholds)
      .set({
        dealPriceCents: params.dealPriceCents,
        binPriceCents: params.binPriceCents,
        updatedAt: new Date(),
      })
      .where(eq(userThresholds.id, existing.id))
  } else {
    await db.insert(userThresholds).values({
      id: randomUUID(),
      userId: user.id,
      productId: params.productId,
      dealPriceCents: params.dealPriceCents,
      binPriceCents: params.binPriceCents,
    })
  }

  revalidatePath("/search")
  return { success: true }
}

export async function getUserThreshold(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !db) return null

  const [row] = await db
    .select()
    .from(userThresholds)
    .where(
      and(
        eq(userThresholds.userId, user.id),
        eq(userThresholds.productId, productId)
      )
    )
    .limit(1)

  return row || null
}
