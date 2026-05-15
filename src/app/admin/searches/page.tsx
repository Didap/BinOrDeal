import Link from "next/link"
import { Search, Calendar, MapPin, DollarSign, User, ShoppingBag } from "lucide-react"
import { getAllSearchLogs } from "@/lib/admin"

export const dynamic = "force-dynamic"

export default async function AdminSearchesPage() {
  // Last 500 searches (all users + anonymous) via Supabase Client (HTTPS)
  const logs = await getAllSearchLogs(500)

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

      {/* Desktop View: Table */}
      <div className="hidden lg:block border-2 border-ink bg-surface overflow-x-auto">
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
                      log.platforms.split(",").map((p: string) => (
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

      {/* Mobile View: Cards */}
      <div className="lg:hidden space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="border-2 border-ink bg-surface p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="font-mono text-[9px] uppercase tracking-widest text-ink-muted">
                  {formatDate(log.createdAt)}
                </div>
                <div className="font-bold text-base leading-tight">"{log.query}"</div>
              </div>
              <VerticalBadge vertical={log.vertical} />
            </div>

            <div className="flex items-center gap-2 py-2 border-t border-line">
              <User size={10} className="text-ink-muted" />
              <div className="font-mono text-[10px] truncate">
                {log.userId && log.userEmail ? (
                  <Link href={`/admin/users/${log.userId}`} className="text-deal font-bold">
                    {log.userEmail}
                  </Link>
                ) : (
                  <span className="text-ink-faint italic">Utente anonimo</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-paper-deep p-2 border-2 border-ink/5">
              <div className="space-y-0.5">
                <div className="font-mono text-[8px] uppercase tracking-widest text-ink-muted">Range Min</div>
                <div className="font-mono text-[11px] font-bold text-deal">
                  {log.minPriceCents != null ? `€${(log.minPriceCents / 100).toFixed(2)}` : "—"}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="font-mono text-[8px] uppercase tracking-widest text-ink-muted">Range Max</div>
                <div className="font-mono text-[11px] font-bold text-bin">
                  {log.maxPriceCents != null ? `€${(log.maxPriceCents / 100).toFixed(2)}` : "—"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {log.platforms ? (
                log.platforms.split(",").map((p: string) => (
                  <span key={p} className="font-mono text-[8px] uppercase tracking-tighter border border-ink/10 px-1 py-0.5 rounded-sm bg-white">
                    {p}
                  </span>
                ))
              ) : (
                <span className="text-ink-faint text-[9px] italic font-mono">Tutti i marketplace</span>
              )}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-10 text-center text-ink-muted font-mono text-[12px] border-2 border-ink border-dashed">
            Nessun log di ricerca trovato
          </div>
        )}
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
