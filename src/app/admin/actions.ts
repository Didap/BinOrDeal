"use server"

import { requireAdmin, updateUser } from "@/lib/admin"
import { revalidatePath } from "next/cache"

export async function updateUserAction(userId: string, formData: FormData) {
  // Security check: must be admin to call this action
  await requireAdmin()

  const tier = formData.get("tier") as string
  const role = formData.get("role") as string

  if (!tier || !role) {
    throw new Error("Dati mancanti")
  }

  await updateUser(userId, { tier, role })

  // Refresh the page data
  revalidatePath(`/admin/users/${userId}`)
  revalidatePath("/admin/users")
  revalidatePath("/admin")
}
