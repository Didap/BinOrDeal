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
    <div className="flex flex-col gap-2 bg-paper-deep border-2 border-ink px-4 py-3 font-mono uppercase tracking-widest relative overflow-hidden">
      {/* Decorative slant for texture */}
      <div className="absolute top-0 right-0 w-24 h-full bg-ink/5 -skew-x-12 translate-x-12 pointer-events-none" />
      
      <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-[10px] sm:text-[11px] relative z-10">
        <span className="text-ink-muted shrink-0 flex items-center gap-2">
          <span className="w-2 h-[2px] bg-ink/20" />
          Sorgenti
        </span>
        {MARKETPLACE_META.map((a) => (
          <div key={a.platform} className="flex items-center gap-1.5 whitespace-nowrap">
            <StatusDot status={a.status} />
            <span className={cn(
              "font-bold",
              a.status === "live" ? "text-ink" : "text-ink-muted"
            )}>
              {a.label}
            </span>
          </div>
        ))}
      </div>
      {byStatus.stub.length > 0 && (
        <div className="text-[9px] sm:text-[10px] normal-case tracking-normal text-ink-muted leading-snug pt-2 mt-1 border-t border-ink/10 relative z-10">
          I risultati marcati <span className="text-fair font-bold italic">campione</span> sono simulazioni per la demo.
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
