import Link from "next/link"
import {
  getAllUsersWithStats,
  getGlobalStats,
} from "@/lib/admin"
import { Users, Search, Activity, UserX, TrendingUp, ShoppingBag } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const [allUsers, stats] = await Promise.all([
    getAllUsersWithStats(),
    getGlobalStats(),
  ])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
          Pannello di Controllo
        </div>
        <h1 className="display text-4xl sm:text-5xl font-black tracking-tightest leading-[0.95] mt-1">
          Dashboard
        </h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} />}
          label="Utenti totali"
          value={stats.totalUsers}
          accent="bg-deal"
        />
        <StatCard
          icon={<Search size={20} />}
          label="Ricerche totali"
          value={stats.totalSearches}
          accent="bg-fair"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Ricerche oggi"
          value={stats.searchesToday}
          accent="bg-hot"
        />
        <StatCard
          icon={<UserX size={20} />}
          label="Ricerche anonime"
          value={stats.anonymousSearches}
          accent="bg-bin"
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Queries */}
        <section>
          <div className="rule-thick pt-4 pb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-hot" />
            <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink font-bold">
              Top 10 Ricerche
            </h2>
          </div>
          <div className="border-2 border-ink bg-surface divide-y-2 divide-ink">
            {stats.topQueries.map((q: { query: string; count: number }, i: number) => (
              <div key={q.query} className="flex items-center justify-between p-3 px-4 hover:bg-paper-deep transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-ink-faint w-4">#{i+1}</span>
                  <span className="font-bold text-sm truncate max-w-[200px]">{q.query}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-fair rounded-full" style={{ width: `${Math.max(4, (q.count / stats.topQueries[0].count) * 80)}px` }} />
                  <span className="font-mono text-[11px] font-bold tabular">{q.count}</span>
                </div>
              </div>
            ))}
            {stats.topQueries.length === 0 && (
              <div className="p-10 text-center text-ink-muted font-mono text-[12px]">Nessun dato disponibile</div>
            )}
          </div>
        </section>

        {/* Top Platforms */}
        <section>
          <div className="rule-thick pt-4 pb-4 flex items-center gap-2">
            <ShoppingBag size={14} className="text-deal-deep" />
            <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink font-bold">
              Marketplace più usati
            </h2>
          </div>
          <div className="border-2 border-ink bg-surface divide-y-2 divide-ink">
            {stats.topPlatforms.map((p: { name: string; count: number }, i: number) => (
              <div key={p.name} className="flex items-center justify-between p-3 px-4 hover:bg-paper-deep transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-ink-faint w-4">#{i+1}</span>
                  <span className="font-mono text-[11px] uppercase tracking-widest font-bold">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-deal rounded-full" style={{ width: `${Math.max(4, (p.count / stats.topPlatforms[0].count) * 80)}px` }} />
                  <span className="font-mono text-[11px] font-bold tabular">{p.count}</span>
                </div>
              </div>
            ))}
            {stats.topPlatforms.length === 0 && (
              <div className="p-10 text-center text-ink-muted font-mono text-[12px]">Nessun dato disponibile</div>
            )}
          </div>
        </section>
      </div>

      {/* Users table */}
      <section>
        <div className="rule-thick pt-4 pb-4 flex items-center justify-between">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink font-bold">
            Utenti registrati
          </h2>
          <span className="font-mono text-[11px] text-ink-muted tabular">
            {allUsers.length} utenti
          </span>
        </div>

        <div className="border-2 border-ink bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-ink text-paper">
                <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                  Email
                </th>
                <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                  Tier
                </th>
                <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                  Ruolo
                </th>
                <th className="text-right font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                  Ricerche
                </th>
                <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                  Registrato il
                </th>
                <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-b border-line hover:bg-paper-deep transition-colors ${
                    i % 2 === 0 ? "bg-surface" : "bg-paper"
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-[12px]">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={u.tier} />
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular text-[13px] font-bold">
                    {u.searchCount}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-mono text-[10px] uppercase tracking-widest text-deal hover:text-deal-deep transition-colors font-bold"
                    >
                      Dettaglio →
                    </Link>
                  </td>
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-ink-muted font-mono text-[12px]"
                  >
                    Nessun utente registrato
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

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="border-2 border-ink bg-surface p-5 space-y-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_var(--ink)] transition-all">
      <div className="flex items-center gap-2">
        <div
          className={`${accent} text-paper p-1.5 inline-flex items-center justify-center`}
        >
          {icon}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
          {label}
        </span>
      </div>
      <div className="display text-3xl sm:text-4xl font-black tracking-tightest tabular">
        {value.toLocaleString("it-IT")}
      </div>
    </div>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const styles =
    tier === "pro"
      ? "bg-deal text-paper"
      : "bg-paper-deep text-ink-muted border border-line-strong"
  return (
    <span
      className={`inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-1 font-bold ${styles}`}
    >
      {tier}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles =
    role === "admin"
      ? "bg-hot text-paper"
      : "bg-transparent text-ink-faint"
  return (
    <span
      className={`inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-1 font-bold ${styles}`}
    >
      {role}
    </span>
  )
}

function formatDate(d: Date | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("it-IT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
