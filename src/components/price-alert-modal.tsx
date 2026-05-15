"use client"
import { useState, useEffect } from "react"
import { createAlertAction, getAlertCountAction, type AlertFrequency } from "@/lib/actions/alerts"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/cn"
import { Bell, X, Loader2, Check, Clock, Zap, CalendarDays } from "lucide-react"

const MAX_ALERTS = 3

const FREQUENCY_OPTIONS: { value: AlertFrequency; label: string; icon: typeof Clock; desc: string }[] = [
  { value: "hourly", label: "Ogni ora", icon: Zap, desc: "Controllo massimo, notifica entro 1h" },
  { value: "daily", label: "Ogni giorno", icon: Clock, desc: "Un controllo al giorno alle 9:00" },
  { value: "weekly", label: "Ogni settimana", icon: CalendarDays, desc: "Report settimanale ogni lunedì" },
]

interface Props {
  query: string
  vertical: string
  /** Full SearchParams serialized as JSON */
  searchParams: string
  /** Lowest price found in the current search */
  lowestPriceCents?: number
  /** Reference price if available */
  refPriceCents?: number
  onClose: () => void
  onCreated?: () => void
}

export function PriceAlertModal({
  query,
  vertical,
  searchParams,
  lowestPriceCents,
  refPriceCents,
  onClose,
  onCreated,
}: Props) {
  const [targetPrice, setTargetPrice] = useState<string>(
    lowestPriceCents ? (lowestPriceCents / 100).toFixed(2) : ""
  )
  const [frequency, setFrequency] = useState<AlertFrequency>("daily")
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alertCount, setAlertCount] = useState<number>(0)
  const [loadingCount, setLoadingCount] = useState(true)

  useEffect(() => {
    getAlertCountAction()
      .then((c) => setAlertCount(c))
      .catch(() => {})
      .finally(() => setLoadingCount(false))
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  async function handleCreate() {
    setError(null)
    const cents = Math.round(parseFloat(targetPrice) * 100)
    if (isNaN(cents) || cents <= 0) {
      setError("Inserisci un prezzo valido.")
      return
    }

    setSaving(true)
    try {
      await createAlertAction({
        query,
        vertical,
        params: searchParams,
        targetPriceCents: cents,
        frequency,
      })
      setJustSaved(true)
      setAlertCount((c) => c + 1)
      setTimeout(() => {
        onCreated?.()
        onClose()
      }, 1500)
    } catch (e: any) {
      setError(e.message ?? "Errore durante la creazione dell'alert.")
    } finally {
      setSaving(false)
    }
  }

  const slotsLeft = MAX_ALERTS - alertCount
  const canCreate = slotsLeft > 0

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface border-2 border-ink shadow-[8px_8px_0_0_var(--ink)] animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-ink px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-deal/10 border-2 border-deal flex items-center justify-center">
              <Bell size={20} className="text-deal" />
            </div>
            <div>
              <h2 className="display text-lg font-black tracking-tight">
                Imposta Alert
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mt-0.5">
                Notifica email · Pro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border-2 border-ink hover:bg-paper-deep transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Query tag */}
          <div className="bg-paper-deep border-2 border-line p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Ricerca monitorata
            </div>
            <div className="display text-lg font-bold mt-1 truncate">
              "{query}"
            </div>
            {refPriceCents && (
              <div className="font-mono text-[11px] text-ink-muted mt-1">
                Prezzo di riferimento: {formatPrice(refPriceCents)}
              </div>
            )}
          </div>

          {/* Slots indicator */}
          <div className="flex items-center gap-3">
            {loadingCount ? (
              <div className="h-5 w-32 bg-line animate-pulse" />
            ) : (
              <>
                <div className="flex gap-1">
                  {Array.from({ length: MAX_ALERTS }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-3 h-3 border-2 transition-colors",
                        i < alertCount
                          ? "bg-deal border-deal"
                          : "bg-transparent border-ink-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="font-mono text-[11px] text-ink-muted">
                  {slotsLeft > 0
                    ? `${slotsLeft} alert disponibil${slotsLeft === 1 ? "e" : "i"}`
                    : "Nessun slot disponibile"}
                </span>
              </>
            )}
          </div>

          {canCreate && !justSaved && (
            <>
              {/* Price input */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                  Avvisami se il prezzo scende sotto
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="es. 45.00"
                    className="w-full h-12 bg-paper-deep border-2 border-ink px-4 font-mono text-xl outline-none focus:border-deal transition-colors pr-10"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-lg text-ink-muted">
                    €
                  </span>
                </div>
                {lowestPriceCents && (
                  <p className="text-[10px] text-ink-muted">
                    Prezzo più basso trovato ora:{" "}
                    <span className="font-bold text-deal">
                      {formatPrice(lowestPriceCents)}
                    </span>
                  </p>
                )}
              </div>

              {/* Frequency */}
              <div className="space-y-2">
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                  Frequenza di controllo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const active = frequency === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFrequency(opt.value)}
                        className={cn(
                          "border-2 p-3 text-center transition-all group",
                          active
                            ? "border-deal bg-deal/5"
                            : "border-line hover:border-ink"
                        )}
                      >
                        <Icon
                          size={18}
                          className={cn(
                            "mx-auto mb-1.5 transition-colors",
                            active ? "text-deal" : "text-ink-muted group-hover:text-ink"
                          )}
                        />
                        <div
                          className={cn(
                            "font-mono text-[11px] font-bold uppercase tracking-wider",
                            active ? "text-deal" : "text-ink"
                          )}
                        >
                          {opt.label}
                        </div>
                        <div className="font-mono text-[9px] text-ink-muted mt-1 leading-tight">
                          {opt.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Success state */}
          {justSaved && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-14 h-14 bg-deal/10 border-2 border-deal flex items-center justify-center">
                <Check size={28} className="text-deal" />
              </div>
              <div className="display text-xl font-black text-deal">
                Alert Creato!
              </div>
              <p className="font-mono text-[11px] text-ink-muted text-center">
                Ti invieremo un'email quando il prezzo scende sotto{" "}
                {formatPrice(Math.round(parseFloat(targetPrice) * 100))}.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border-2 border-bin bg-bin/5 p-3">
              <p className="font-mono text-[11px] text-bin">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {canCreate && !justSaved && (
          <div className="border-t-2 border-ink px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="font-mono text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !targetPrice}
              className={cn(
                "h-11 px-6 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                "bg-deal text-paper border-2 border-deal hover:brightness-110",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Bell size={14} />
              )}
              Crea Alert
            </button>
          </div>
        )}

        {!canCreate && !justSaved && (
          <div className="border-t-2 border-ink px-6 py-4">
            <p className="font-mono text-[11px] text-ink-muted text-center">
              Hai raggiunto il limite di {MAX_ALERTS} alert. Disattiva o elimina un alert esistente per crearne uno nuovo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
