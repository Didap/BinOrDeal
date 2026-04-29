"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { cn } from "@/lib/cn"
import { formatPrice } from "@/lib/format"
import type { CatalogRef } from "@/lib/types"

interface Props {
  // NOTE: `ref` is reserved by React as a prop name — it triggers
  // "Refs cannot be used in Server Components" even when you mean a plain
  // prop. Call it `matched` instead.
  matched: CatalogRef | null
  candidates: CatalogRef[]
}

/**
 * Shows the catalog reference matched for the current search — and lets the
 * user swap it if the auto-match is wrong. Implemented as a disclosure: the
 * matched ref is always visible; "Cambia" opens a list of alternatives.
 *
 * Selecting an alternative pushes a `ref=<productId>` URL param which the
 * server honors in runSearch (resolveCatalogById bypass).
 */
export function RefMatch({ matched, candidates }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  function pick(productId: string | null) {
    const next = new URLSearchParams(params.toString())
    if (productId) next.set("ref", productId)
    else next.delete("ref")
    setOpen(false)
    startTransition(() => {
      router.push(`/search?${next.toString()}`, { scroll: false })
    })
  }

  const activeId = params.get("ref") ?? matched?.productId ?? null
  const alternatives = candidates.filter((c) => c.productId !== activeId)

  if (!matched) {
    return (
      <div className="rule-double pt-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
          Nessun riferimento trovato — scoring euristico
        </div>
        {candidates.length > 0 && (
          <div className="mt-2 font-mono text-[11px] text-ink-soft">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="underline decoration-dotted underline-offset-4 hover:text-ink"
            >
              {open ? "Chiudi" : `Scegli tra ${candidates.length} candidati →`}
            </button>
            {open && <Candidates items={candidates} onPick={pick} />}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rule-double pt-5">
      <div className="flex items-start justify-between gap-5 flex-wrap">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-muted">
            Prezzo di riferimento · {matched.refSource}
            {params.get("ref") && (
              <span className="ml-2 inline-flex items-center gap-1 text-hot normal-case tracking-normal">
                · scelto da te
              </span>
            )}
          </div>
          <div className="mt-1 display text-lg font-bold truncate">
            {matched.productName}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 border-2 border-ink bg-paper hover:bg-ink hover:text-paper transition-colors",
                open && "bg-ink text-paper",
              )}
            >
              {open ? "Chiudi" : "Non è questo? Cambia →"}
            </button>
            {params.get("ref") && (
              <button
                type="button"
                onClick={() => pick(null)}
                className="underline decoration-dotted underline-offset-4 text-ink-muted hover:text-bin normal-case tracking-normal"
              >
                ripristina auto-match
              </button>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            AVG
          </div>
          <div className="font-mono tabular text-3xl font-black">
            {formatPrice(matched.refPriceCents)}
          </div>
        </div>
      </div>

      {open && alternatives.length > 0 && (
        <div className="mt-4 border-2 border-ink bg-surface">
          <div className="px-4 py-2 border-b border-line font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Altri riferimenti per questa ricerca
          </div>
          <Candidates items={alternatives} onPick={pick} />
        </div>
      )}
      {open && alternatives.length === 0 && (
        <div className="mt-4 border-2 border-dashed border-line-strong bg-transparent p-4 text-sm text-ink-muted">
          Nessun altro candidato nel catalogo. Affina la keyword.
        </div>
      )}
    </div>
  )
}

function Candidates({
  items,
  onPick,
}: {
  items: CatalogRef[]
  onPick: (id: string | null) => void
}) {
  return (
    <ul>
      {items.map((c) => (
        <li key={c.productId ?? c.query} className="border-b border-line last:border-0">
          <button
            type="button"
            onClick={() => c.productId && onPick(c.productId)}
            className="w-full text-left px-4 py-3 hover:bg-paper-deep transition-colors flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="display text-sm font-bold truncate">
                {c.productName}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                {c.refSource}
                {c.meta?.kind ? ` · ${c.meta.kind}` : ""}
                {c.meta?.platform ? ` · ${c.meta.platform}` : ""}
              </div>
            </div>
            <div className="font-mono tabular text-sm font-bold shrink-0">
              {formatPrice(c.refPriceCents)}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
