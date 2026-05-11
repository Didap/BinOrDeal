import { MARKETPLACE_META } from "@/lib/adapters/meta"
import { cn } from "@/lib/cn"

/**
 * Compact strip shown above search results listing which marketplaces
 * contributed live data vs. fell back to samples. Honest telemetry.
 */
export function AdapterStatusStrip() {
  const byStatus = {
    live: MARKETPLACE_META.filter((a) => a.status === "live"),
    stub: MARKETPLACE_META.filter((a) => a.status === "stub"),
    down: MARKETPLACE_META.filter((a) => a.status === "down"),
  }

  return (
    <div className="flex flex-col gap-2 bg-surface border-2 border-ink px-3 sm:px-4 py-3 font-mono uppercase tracking-widest">
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-[10px] sm:text-[11px]">
        <span className="text-ink-muted shrink-0">Sorgenti:</span>
        {MARKETPLACE_META.map((a) => (
          <span key={a.platform} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <StatusDot status={a.status} />
            <span className={cn(a.status === "live" ? "text-ink" : "text-ink-muted")}>
              {a.label}
            </span>
          </span>
        ))}
      </div>
      {byStatus.stub.length > 0 && (
        <div className="text-[9px] sm:text-[10px] normal-case tracking-normal text-ink-muted leading-snug pt-1 border-t border-line/50">
          I risultati marcati <em className="not-italic text-fair font-bold">campione</em> sono esempi per la demo.
        </div>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: "live" | "stub" | "down" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 rounded-full shrink-0",
        status === "live" && "bg-deal pulse-dot",
        status === "stub" && "bg-fair",
        status === "down" && "bg-bin",
      )}
    />
  )
}
