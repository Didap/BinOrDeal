import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { db } from "@/db/client"
import { priceAlerts, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Nav } from "@/components/nav"
import { Footer } from "@/components/footer"
import { AlertsList } from "./alerts-list"

export const dynamic = "force-dynamic"

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Check tier
  let tier = "free"
  if (db) {
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1)
    tier = dbUser?.tier ?? "free"
  }

  // Fetch alerts
  let alertRows: any[] = []
  if (db) {
    alertRows = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.userId, user.id))
      .orderBy(priceAlerts.createdAt)
  }

  return (
    <>
      <Nav compact />

      <section className="border-b-2 border-ink bg-surface relative">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 py-6 sm:py-10">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-muted">
                Dashboard · Pro
              </div>
              <h1 className="mt-1 display text-4xl sm:text-5xl font-black tracking-tightest leading-[0.95]">
                I Tuoi Alert
              </h1>
            </div>
            <Link
              href="/search"
              className="font-mono text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
            >
              ← torna alla ricerca
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-5 sm:px-8 py-10 relative z-10">
        {tier !== "pro" ? (
          <div className="max-w-lg mx-auto text-center border-2 border-ink p-10">
            <div className="display text-3xl font-black mb-4">
              Funzione Pro
            </div>
            <p className="text-ink-muted mb-6">
              Gli alert di prezzo sono disponibili solo per gli utenti Pro.
              Passa a Pro per monitorare fino a 3 ricerche e ricevere email
              quando il prezzo scende.
            </p>
            <Link
              href="/#pricing"
              className="inline-block bg-deal text-paper px-6 py-3 font-mono text-xs uppercase tracking-widest border-2 border-deal hover:brightness-110 transition-all"
            >
              Scopri Pro
            </Link>
          </div>
        ) : (
          <AlertsList alerts={alertRows} />
        )}
      </main>

      <Footer />
    </>
  )
}
