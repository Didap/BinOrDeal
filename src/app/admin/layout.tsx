import { requireAdmin } from "@/lib/admin"
import Link from "next/link"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side guard — redirects non-admins before rendering anything
  const { dbUser } = await requireAdmin()

  return (
    <div className="min-h-screen bg-paper">
      {/* Admin topbar */}
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-ink text-paper">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 flex items-center justify-between h-[56px]">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="display text-lg font-black tracking-tightest"
            >
              BinOrDeal{" "}
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-normal text-paper/60">
                Admin
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest">
              <Link
                href="/admin"
                className="text-paper/70 hover:text-paper transition-colors py-2"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/users"
                className="text-paper/70 hover:text-paper transition-colors py-2"
              >
                Utenti
              </Link>
              <Link
                href="/admin/searches"
                className="text-paper/70 hover:text-paper transition-colors py-2"
              >
                Ricerche
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-paper/50">
              {dbUser.email}
            </span>
            <Link
              href="/"
              className="font-mono text-[10px] uppercase tracking-widest text-paper/50 hover:text-paper transition-colors"
            >
              ← Sito
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1440px] px-5 sm:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
