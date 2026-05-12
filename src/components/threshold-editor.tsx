"use client"
import { useState, useEffect } from "react"
import { saveUserThreshold } from "@/lib/actions/thresholds"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/cn"
import { Loader2, Save, Info, Check } from "lucide-react"

interface Props {
  productId: string
  marketRefCents: number
  initialDealPriceCents?: number
  initialBinPriceCents?: number
  onSaved?: () => void
}

export function ThresholdEditor({
  productId,
  marketRefCents,
  initialDealPriceCents,
  initialBinPriceCents,
  onSaved,
}: Props) {
  const [deal, setDeal] = useState<string>(
    initialDealPriceCents ? (initialDealPriceCents / 100).toString() : ""
  )
  const [bin, setBin] = useState<string>(
    initialBinPriceCents ? (initialBinPriceCents / 100).toString() : ""
  )
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  // Default thresholds for visual reference
  const defaultDeal = Math.round(marketRefCents * 0.82)
  const defaultBin = Math.round(marketRefCents * 1.08)

  async function handleSave() {
    setSaving(true)
    try {
      const dealCents = deal ? Math.round(parseFloat(deal) * 100) : undefined
      const binCents = bin ? Math.round(parseFloat(bin) * 100) : undefined
      
      await saveUserThreshold({
        productId,
        dealPriceCents: dealCents,
        binPriceCents: binCents,
      })
      
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
      onSaved?.()
    } catch (e) {
      console.error("Failed to save threshold:", e)
      alert("Errore nel salvataggio delle soglie.")
    } finally {
      setSaving(false)
    }
  }

  const isCustom = !!(initialDealPriceCents || initialBinPriceCents)

  return (
    <div className={cn(
      "border-2 p-4 transition-colors",
      isCustom ? "border-deal bg-deal/5" : "border-ink bg-paper-deep"
    )}>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <div className="font-mono text-[11px] uppercase tracking-widest font-bold">
            Personalizza Scoring
          </div>
          {isCustom && (
            <span className="bg-deal text-paper px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest">
              Attivo
            </span>
          )}
        </div>
        <div className="font-mono text-[10px] text-ink-muted flex items-center gap-1.5">
          <Info size={12} />
          Market Ref: {formatPrice(marketRefCents)}
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Soglia DEAL (Prezzo massimo)
          </label>
          <div className="relative group">
            <input
              type="number"
              step="0.01"
              value={deal}
              onChange={(e) => setDeal(e.target.value)}
              placeholder={(defaultDeal / 100).toFixed(2)}
              className="w-full h-11 bg-surface border-2 border-ink px-3 font-mono text-lg outline-none focus:border-deal transition-colors pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-muted">€</span>
          </div>
          <p className="text-[10px] text-ink-muted leading-tight">
            I risultati sotto questo prezzo saranno marcati <span className="text-deal font-bold uppercase">Deal</span>.
          </p>
        </div>

        <div className="space-y-2">
          <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Soglia BIN (Prezzo minimo)
          </label>
          <div className="relative group">
            <input
              type="number"
              step="0.01"
              value={bin}
              onChange={(e) => setBin(e.target.value)}
              placeholder={(defaultBin / 100).toFixed(2)}
              className="w-full h-11 bg-surface border-2 border-ink px-3 font-mono text-lg outline-none focus:border-bin transition-colors pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-muted">€</span>
          </div>
          <p className="text-[10px] text-ink-muted leading-tight">
            I risultati sopra questo prezzo saranno marcati <span className="text-bin font-bold uppercase">Bin</span>.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "h-11 px-6 font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-2",
            justSaved 
              ? "bg-deal text-paper border-2 border-deal" 
              : "bg-ink text-paper border-2 border-ink hover:bg-ink-muted"
          )}
        >
          {saving ? (
            <Loader2 className="animate-spin" size={14} />
          ) : justSaved ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {justSaved ? "Salvato" : "Applica Soglie"}
        </button>

        {isCustom && (
          <button
            onClick={() => {
              setDeal("")
              setBin("")
              handleSave()
            }}
            className="font-mono text-[10px] uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
          >
            Ripristina Default
          </button>
        )}
      </div>
    </div>
  )
}
