import Link from "next/link"
import { getAllUsersWithStats, type UserWithStats } from "@/lib/admin"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const allUsers = await getAllUsersWithStats()

  return (
    <div className="space-y-8">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
          Gestione
        </div>
        <h1 className="display text-4xl sm:text-5xl font-black tracking-tightest leading-[0.95] mt-1">
          Utenti
        </h1>
      </div>

      <div className="border-2 border-ink bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-ink bg-ink text-paper">
              <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                Email
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-widest px-4 py-3">
                ID
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
                Registrato
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
                <td className="px-4 py-3 font-mono text-[12px] font-bold">
                  {u.email}
                </td>
                <td className="px-4 py-3 font-mono text-[10px] text-ink-faint max-w-[120px] truncate">
                  {u.id.slice(0, 8)}…
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-1 font-bold ${
                      u.tier === "pro"
                        ? "bg-deal text-paper"
                        : "bg-paper-deep text-ink-muted border border-line-strong"
                    }`}
                  >
                    {u.tier}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block font-mono text-[9px] uppercase tracking-widest px-2 py-1 font-bold ${
                      u.role === "admin"
                        ? "bg-hot text-paper"
                        : "bg-transparent text-ink-faint"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono tabular text-[13px] font-bold">
                  {u.searchCount}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-ink-muted whitespace-nowrap">
                  {new Date(u.createdAt).toLocaleDateString("it-IT", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
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
          </tbody>
        </table>
      </div>
    </div>
  )
}
