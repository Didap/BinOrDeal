import { requireAdmin } from "@/lib/admin"
import { AdminNav } from "./admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side guard — redirects non-admins before rendering anything
  const { dbUser } = await requireAdmin()

  return (
    <div className="min-h-screen bg-paper">
      <AdminNav userEmail={dbUser.email} />

      {/* Content */}
      <main className="mx-auto max-w-[1440px] px-5 sm:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
