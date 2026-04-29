import { NextResponse } from "next/server"
import { marketplaceAdapters, catalogAdapters } from "@/lib/adapters"

export const dynamic = "force-dynamic"

/**
 * GET /api/adapter-status?probe=charizard
 *
 * Pings every adapter with a known query and reports:
 *   - configured status (live/stub/down)
 *   - live call result (count, latency, error if any)
 *
 * Use this during the spike phase to see at a glance which adapters are
 * currently functional. Do NOT hit this from client-side polling in prod —
 * it makes real outbound calls.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const probe = (searchParams.get("probe") ?? "charizard").trim()

  const marketplaces = await Promise.all(
    marketplaceAdapters.map(async (a) => {
      const start = Date.now()
      try {
        const items = await a.search({ q: probe, vertical: "pokemon" })
        return {
          platform: a.platform,
          label: a.label,
          status: a.status,
          probe: {
            ok: true,
            count: items.length,
            latencyMs: Date.now() - start,
            sample: items[0]?.title ?? null,
          },
        }
      } catch (e) {
        return {
          platform: a.platform,
          label: a.label,
          status: a.status,
          probe: {
            ok: false,
            error: e instanceof Error ? e.message : String(e),
            latencyMs: Date.now() - start,
          },
        }
      }
    }),
  )

  const catalogs = await Promise.all(
    Object.entries(catalogAdapters).map(async ([vertical, a]) => {
      const start = Date.now()
      try {
        const ref = await a.lookup(probe, vertical as "pokemon" | "coins")
        return {
          vertical,
          source: a.source,
          label: a.label,
          status: a.status,
          probe: {
            ok: true,
            matched: Boolean(ref),
            refPriceCents: ref?.refPriceCents ?? null,
            productName: ref?.productName ?? null,
            latencyMs: Date.now() - start,
          },
        }
      } catch (e) {
        return {
          vertical,
          source: a.source,
          label: a.label,
          status: a.status,
          probe: {
            ok: false,
            error: e instanceof Error ? e.message : String(e),
            latencyMs: Date.now() - start,
          },
        }
      }
    }),
  )

  return NextResponse.json({
    probe,
    checkedAt: new Date().toISOString(),
    marketplaces,
    catalogs,
  })
}
