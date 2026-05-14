import Link from "next/link"
import { db } from "@/db/client"
import { searchLogs, users } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { Search, Calendar, MapPin, DollarSign, User, ShoppingBag } from "lucide-react"

type SearchLogWithUser = {
  id: string
  userId: string | null
  sessionId: string
  userIp: string | null
  query: string
  vertical: string
  minPriceCents: number | null
  maxPriceCents: number | null
  platforms: string | null
  createdAt: Date
  userEmail: string | null
}

export const dynamic = "force-dynamic"

export default async function AdminSearchesPage() {
  if (!db) {
    return (
      <div className="text-center py-20 text-ink-muted font-mono">
        Database non disponibile
      </div>
    )
  }

  // Last 500 searches (all users + anonymous)
  const logs: SearchLogWithUser[] = await db
    .select({
      id: searchLogs.id,
      userId: searchLogs.userId,
      sessionId: searchLogs.sessionId,
      userIp: searchLogs.userIp,
      query: searchLogs.query,
      vertical: searchLogs.vertical,
      minPriceCents: searchLogs.minPriceCents,
      maxPriceCents: searchLogs.maxPriceCents,
      platforms: searchLogs.platforms,
      createdAt: searchLogs.createdAt,
      userEmail: users.email,
    })
    .from(searchLogs)
    .leftJoin(users, eq(searchLogs.userId, users.id))
    .orderBy(desc(searchLogs.createdAt))
    .limit(500)

  return (
    <div className="space-y-8">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
          Log Globale
        </div>
        <h1 className="display text-4xl sm:text-5xl font-black tracking-tightest leading-[0.95] mt-1">
          Ricerche
        </h1>
        <p className="font-mono text-[11px] text-ink-muted mt-2">
          Ultime 500 ricerche (utenti registrati + anonimi)
        </p>
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
                <User size={12} className="inline mr-1.5 -mt-0.5" />
                Utente
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                <Search size={12} className="inline mr-1.5 -mt-0.5" />
                Query
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                Vert.
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
                <MapPin size={12} className="inline mr-1 -mt-0.5" />
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
                <td className="px-4 py-3 font-mono text-[11px]">
                  {log.userId && log.userEmail ? (
                    <Link
                      href={`/admin/users/${log.userId}`}
                      className="text-deal hover:text-deal-deep transition-colors font-bold"
                    >
                      {log.userEmail}
                    </Link>
                  ) : (
                    <span className="text-ink-faint italic">anonimo</span>
                  )}
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
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
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
          </tbody>
        </table>
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
    hour: "2-digit",
    minute: "2-digit",
  })
}
