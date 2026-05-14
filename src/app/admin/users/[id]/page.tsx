import Link from "next/link"
import { notFound } from "next/navigation"
import { getUserById, getUserSearchLogs } from "@/lib/admin"
import { db } from "@/db/client"
import { userThresholds, type UserThreshold } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { ArrowLeft, Search, Calendar, MapPin, DollarSign, Activity, ShoppingBag } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params
  const [user, logs] = await Promise.all([
    getUserById(id),
    getUserSearchLogs(id, 500),
  ])

  if (!user) notFound()

  // Also fetch this user's custom thresholds
  const thresholds: UserThreshold[] = db
    ? await db
        .select()
        .from(userThresholds)
        .where(eq(userThresholds.userId, id))
        .orderBy(desc(userThresholds.updatedAt))
    : []

  // Aggregate stats from logs
  const verticalCounts: Record<string, number> = {}
  const searchesByDay: Record<string, number> = {}
  let searchesWithPriceFilter = 0

  for (const log of logs) {
    // Vertical distribution
    verticalCounts[log.vertical] = (verticalCounts[log.vertical] ?? 0) + 1

    // Searches by day
    const day = new Date(log.createdAt).toLocaleDateString("it-IT")
    searchesByDay[day] = (searchesByDay[day] ?? 0) + 1

    // Price filter usage
    if (log.minPriceCents != null || log.maxPriceCents != null) {
      searchesWithPriceFilter++
    }
  }

  return (
    <div className="space-y-8">
      {/* Back + header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Torna alla dashboard
        </Link>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
          Dettaglio Utente
        </div>
        <h1 className="display text-3xl sm:text-4xl font-black tracking-tightest leading-[0.95] mt-1">
          {user.email}
        </h1>
      </div>

      {/* User info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InfoCard label="Tier" value={user.tier.toUpperCase()} />
        <InfoCard label="Ruolo" value={user.role.toUpperCase()} />
        <InfoCard label="Ricerche totali" value={String(logs.length)} />
        <InfoCard
          label="Registrato il"
          value={new Date(user.createdAt).toLocaleDateString("it-IT", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        />
      </div>

      {/* Management Section */}
      <section className="border-2 border-ink bg-paper-deep p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-ink text-paper p-1">
            <Activity size={16} />
          </div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink font-bold">
            Gestione Utente
          </h2>
        </div>
        <form action={async (formData) => {
          "use server"
          const { updateUserAction } = await import("@/app/admin/actions")
          await updateUserAction(user.id, formData)
        }} className="flex flex-wrap items-end gap-6 pt-2">
          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Tier (Abbonamento)
            </label>
            <select
              name="tier"
              defaultValue={user.tier}
              className="h-10 border-2 border-ink bg-surface px-3 font-mono text-[11px] uppercase outline-none focus:border-deal"
            >
              <option value="free">Free (Limitato)</option>
              <option value="pro">Pro (Illimitato)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Ruolo (Permessi)
            </label>
            <select
              name="role"
              defaultValue={user.role}
              className="h-10 border-2 border-ink bg-surface px-3 font-mono text-[11px] uppercase outline-none focus:border-hot"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="h-10 bg-ink text-paper px-6 font-mono text-[10px] uppercase tracking-widest font-black hover:bg-deal transition-all shadow-[4px_4px_0_rgba(21,18,13,0.15)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
          >
            Applica Modifiche
          </button>
        </form>
      </section>

      {/* Mini stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Vertical distribution */}
        <div className="border-2 border-ink bg-surface p-5 space-y-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted font-bold">
            Ricerche per verticale
          </h3>
          <div className="space-y-2">
            {Object.entries(verticalCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([v, c]) => (
                <div key={v} className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-widest">
                    {v}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-deal" style={{ width: `${Math.max(4, (c / logs.length) * 120)}px` }} />
                    <span className="font-mono tabular text-[12px] font-bold">
                      {c}
                    </span>
                  </div>
                </div>
              ))}
            {Object.keys(verticalCounts).length === 0 && (
              <span className="text-ink-faint font-mono text-[11px]">Nessuna ricerca</span>
            )}
          </div>
        </div>

        {/* Searches with price filter */}
        <div className="border-2 border-ink bg-surface p-5 space-y-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted font-bold">
            Filtri prezzo usati
          </h3>
          <div className="display text-3xl font-black tracking-tightest tabular">
            {searchesWithPriceFilter}
            <span className="text-lg text-ink-muted font-normal"> / {logs.length}</span>
          </div>
          <div className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">
            {logs.length > 0
              ? `${Math.round((searchesWithPriceFilter / logs.length) * 100)}% delle ricerche`
              : "N/A"}
          </div>
        </div>

        {/* Custom thresholds */}
        <div className="border-2 border-ink bg-surface p-5 space-y-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted font-bold">
            Soglie personalizzate
          </h3>
          <div className="display text-3xl font-black tracking-tightest tabular">
            {thresholds.length}
          </div>
          <div className="font-mono text-[10px] text-ink-faint uppercase tracking-widest">
            prodotti con prezzo custom
          </div>
        </div>
      </div>

      {/* Custom thresholds table (if any) */}
      {thresholds.length > 0 && (
        <section>
          <div className="rule-thick pt-4 pb-4">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink font-bold">
              Soglie personalizzate
            </h2>
          </div>
          <div className="border-2 border-ink bg-surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink bg-ink text-paper">
                  <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                    Prodotto ID
                  </th>
                  <th className="text-right font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                    Deal Price
                  </th>
                  <th className="text-right font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                    Bin Price
                  </th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                    Aggiornato
                  </th>
                </tr>
              </thead>
              <tbody>
                {thresholds.map((t, i) => (
                  <tr
                    key={t.id}
                    className={`border-b border-line ${
                      i % 2 === 0 ? "bg-surface" : "bg-paper"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {t.productId}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular text-[12px] text-deal font-bold">
                      {t.dealPriceCents != null
                        ? `€${(t.dealPriceCents / 100).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular text-[12px] text-bin font-bold">
                      {t.binPriceCents != null
                        ? `€${(t.binPriceCents / 100).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">
                      {formatDate(t.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Search logs table */}
      <section>
        <div className="rule-thick pt-4 pb-4 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink font-bold">
            Cronologia ricerche
          </h2>
          <span className="font-mono text-[11px] text-ink-muted tabular">
            {logs.length} ricerche
          </span>
        </div>

        <div className="border-2 border-ink bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-ink text-paper">
                <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  <Calendar size={12} className="inline mr-1.5 -mt-0.5" />
                  Data
                </th>
                <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  <Search size={12} className="inline mr-1.5 -mt-0.5" />
                  Query
                </th>
                <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                  Verticale
                </th>
                <th className="text-right font-mono text-[10px] uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  <DollarSign size={12} className="inline mr-1 -mt-0.5" />
                  Min
                </th>
                <th className="text-right font-mono text-[10px] uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  <DollarSign size={12} className="inline mr-1 -mt-0.5" />
                  Max
                </th>
                <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  <ShoppingBag size={12} className="inline mr-1.5 -mt-0.5" />
                  Marketplace
                </th>
                <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  <MapPin size={12} className="inline mr-1.5 -mt-0.5" />
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={log.id}
                  className={`border-b border-line hover:bg-paper-deep transition-colors ${
                    i % 2 === 0 ? "bg-surface" : "bg-paper"
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-muted whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[12px] font-bold">
                      {log.query}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <VerticalBadge vertical={log.vertical} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[12px]">
                    {log.minPriceCents != null ? (
                      <span className="text-deal font-bold">
                        €{(log.minPriceCents / 100).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[12px]">
                    {log.maxPriceCents != null ? (
                      <span className="text-bin font-bold">
                        €{(log.maxPriceCents / 100).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {log.platforms ? (
                        log.platforms.split(",").map((p) => (
                          <span key={p} className="font-mono text-[8px] uppercase tracking-tighter bg-ink/5 border border-ink/10 px-1 py-0.5 rounded-sm">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-ink-faint text-[9px] italic">all</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">
                    {log.userIp ?? "—"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-ink-muted font-mono text-[12px]"
                  >
                    Nessuna ricerca effettuata
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-ink bg-surface p-4 space-y-1">
      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-muted">
        {label}
      </div>
      <div className="display text-xl font-black tracking-tightest">
        {value}
      </div>
    </div>
  )
}

function VerticalBadge({ vertical }: { vertical: string }) {
  const colors: Record<string, string> = {
    tcg: "bg-hot/20 text-hot",
    pokemon: "bg-hot/20 text-hot",
    coins: "bg-fair/20 text-fair",
    games: "bg-deal/20 text-deal-deep",
    shoes: "bg-bin/20 text-bin",
  }
  return (
    <span
      className={`inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-1 font-bold ${
        colors[vertical] ?? "bg-paper-deep text-ink-muted"
      }`}
    >
      {vertical}
    </span>
  )
}

function formatDate(d: Date | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
