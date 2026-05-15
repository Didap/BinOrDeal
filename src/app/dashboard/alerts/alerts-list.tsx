"use client"
import { useState } from "react"
import { deleteAlertAction, toggleAlertAction } from "@/lib/actions/alerts"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/cn"
import {
  Bell,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Clock,
  Zap,
  CalendarDays,
  Search,
} from "lucide-react"
import type { PriceAlert } from "@/db/schema"

const FREQ_LABELS: Record<string, { label: string; icon: typeof Clock }> = {
  hourly: { label: "Ogni ora", icon: Zap },
  daily: { label: "Ogni giorno", icon: Clock },
  weekly: { label: "Ogni settimana", icon: CalendarDays },
}

const MAX_ALERTS = 3

export function AlertsList({ alerts: initial }: { alerts: PriceAlert[] }) {
  const [alerts, setAlerts] = useState(initial)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const activeCount = alerts.filter((a) => a.isEnabled === 1).length

  async function handleToggle(id: string, currentEnabled: number) {
    setLoadingId(id)
    try {
      await toggleAlertAction(id, currentEnabled === 0)
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, isEnabled: currentEnabled === 0 ? 1 : 0 } : a
        )
      )
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questo alert?")) return
    setLoadingId(id)
    try {
      await deleteAlertAction(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: MAX_ALERTS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 border-2 transition-colors",
                  i < activeCount
                    ? "bg-deal border-deal"
                    : "bg-transparent border-ink-muted"
                )}
              />
            ))}
          </div>
          <span className="font-mono text-[12px] text-ink-muted">
            {activeCount}/{MAX_ALERTS} alert attivi
          </span>
        </div>
        <a
          href="/search"
          className="font-mono text-[11px] uppercase tracking-widest text-deal hover:text-deal-deep transition-colors flex items-center gap-1.5"
        >
          <Search size={14} />
          Nuova ricerca
        </a>
      </div>

      {/* Alert cards */}
      {alerts.length === 0 ? (
        <div className="border-2 border-ink border-dashed p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-paper-deep border-2 border-line flex items-center justify-center">
            <Bell size={28} className="text-ink-muted" />
          </div>
          <div className="display text-2xl font-bold mb-2">
            Nessun alert attivo
          </div>
          <p className="text-ink-muted max-w-md mx-auto">
            Effettua una ricerca e clicca "Imposta Alert" per ricevere
            notifiche email quando un prodotto scende sotto il prezzo che scegli.
          </p>
          <a
            href="/search"
            className="inline-block mt-6 bg-ink text-paper px-6 py-3 font-mono text-xs uppercase tracking-widest border-2 border-ink hover:bg-deal hover:border-deal transition-all"
          >
            Vai alla ricerca
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const freq = FREQ_LABELS[alert.frequency] ?? FREQ_LABELS.daily
            const FreqIcon = freq.icon
            const isEnabled = alert.isEnabled === 1
            const isLoading = loadingId === alert.id

            return (
              <div
                key={alert.id}
                className={cn(
                  "border-2 p-4 sm:p-5 transition-all",
                  isEnabled
                    ? "border-ink bg-surface"
                    : "border-line bg-paper-deep opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 border",
                          isEnabled
                            ? "text-deal border-deal bg-deal/10"
                            : "text-ink-muted border-line"
                        )}
                      >
                        {isEnabled ? "Attivo" : "Disattivato"}
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-ink-muted">
                        <FreqIcon size={12} />
                        {freq.label}
                      </div>
                    </div>

                    <h3 className="display text-xl font-bold mt-2 truncate">
                      "{alert.query}"
                    </h3>

                    <div className="mt-2 flex items-center gap-4 flex-wrap font-mono text-[11px] text-ink-muted">
                      <span>
                        Target:{" "}
                        <span className="text-deal font-bold">
                          {formatPrice(alert.targetPriceCents)}
                        </span>
                      </span>
                      <span className="uppercase">{alert.vertical}</span>
                      {alert.lastCheckedAt && (
                        <span>
                          Ultimo check:{" "}
                          {new Date(alert.lastCheckedAt).toLocaleDateString(
                            "it-IT",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      )}
                      {alert.lastNotifiedAt && (
                        <span className="text-deal">
                          Ultima notifica:{" "}
                          {new Date(alert.lastNotifiedAt).toLocaleDateString(
                            "it-IT",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(alert.id, alert.isEnabled)}
                      disabled={isLoading}
                      className="p-2 border-2 border-ink hover:bg-paper-deep transition-colors disabled:opacity-40"
                      title={isEnabled ? "Disattiva" : "Attiva"}
                    >
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : isEnabled ? (
                        <ToggleRight size={18} className="text-deal" />
                      ) : (
                        <ToggleLeft size={18} className="text-ink-muted" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      disabled={isLoading}
                      className="p-2 border-2 border-ink hover:bg-bin/10 hover:border-bin hover:text-bin transition-colors disabled:opacity-40"
                      title="Elimina"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
