import { MARKETPLACE_META } from "@/lib/adapters/meta"
import { cn } from "@/lib/cn"

/**
 * Compact strip shown above search results listing which marketplaces
 * contributed live data vs. fell back to samples. Honest telemetry.
 *
 * Reads the static metadata file rather than the runtime adapter module so
 * server-rendering this component never transitively imports Playwright /
 * OAuth code. Critical for /search TTFB on container hosts.
 */
export function AdapterStatusStrip() {
  const byStatus = {
    live: MARKETPLACE_META.filter((a) => a.status === "live"),
    stub: MARKETPLACE_META.filter((a) => a.status === "stub"),
    down: MARKETPLACE_META.filter((a) => a.status === "down"),
  }

  return (
    <div className="flex items-center flex-wrap gap-x-5 gap-y-2 bg-surface border-2 border-ink px-4 py-3 font-mono text-[11px] uppercase tracking-widest">
      <span className="text-ink-muted">Sorgenti</span>
      {MARKETPLACE_META.map((a) => (
        <span key={a.platform} className="inline-flex items-center gap-1.5">
          <StatusDot status={a.status} />
          <span className={cn(a.status === "live" ? "text-ink" : "text-ink-muted")}>
            {a.label}
          </span>
          <span
            className={cn(
              "normal-case tracking-normal text-[10px]",
              a.status === "live" && "text-deal-deep",
              a.status === "stub" && "text-fair",
              a.status === "down" && "text-bin",
            )}
          >
            {a.status === "live"
              ? "live"
              : a.status === "stub"
                ? "campione — serve API key"
                : "bloccato — fallback"}
          </span>
        </span>
      ))}
      {byStatus.live.length < MARKETPLACE_META.length && (
        <span className="ml-auto text-[10px] normal-case tracking-normal text-ink-muted max-w-[28ch] leading-snug">
          I risultati marcati <em className="not-italic text-fair">campione</em> sono esempi per la demo.
        </span>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: "live" | "stub" | "down" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-1.5 rounded-full",
        status === "live" && "bg-deal pulse-dot",
        status === "stub" && "bg-fair",
        status === "down" && "bg-bin",
      )}
    />
  )
}
