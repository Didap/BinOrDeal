"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/db/client"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getUserRole() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Use Supabase Client (HTTPS) instead of direct DB connection (TCP)
    // This is more likely to pass through network firewalls/blocks
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (dbError) {
      console.error("Supabase API Error fetching role:", dbError.message, dbError.code)
      // Fallback to metadata if API fails
      return user.app_metadata?.role || user.user_metadata?.role || "user"
    }

    return dbUser?.role || "user"
  } catch (error: any) {
    console.error("Critical error in getUserRole:", error.message)
    return "ERROR_FETCHING"
  }
}
