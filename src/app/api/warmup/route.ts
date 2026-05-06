import { getBrowser } from "@/lib/browser"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GET /api/warmup
 *
 * Loads Playwright, launches headless Chromium, and reports the wallclock
 * cost. Hit this once after a fresh deploy so the very first user search
 * doesn't pay for module loading + browser launch.
 *
 * Returns:
 *   { ok: true, browserMs: 3120 }       — browser launched successfully
 *   { ok: false, error: "...", ms: ... } — launch failed (Chromium missing,
 *                                           sandbox issue, etc.); body
 *                                           includes the error so we can
 *                                           diagnose why prod is slow.
 *
 * No auth: it's idempotent and revealing only the launch latency.
 */
export async function GET() {
  const t0 = Date.now()
  try {
    await getBrowser()
    const browserMs = Date.now() - t0
    return Response.json({ ok: true, browserMs })
  } catch (e) {
    const ms = Date.now() - t0
    return Response.json(
      {
        ok: false,
        ms,
        error: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 },
    )
  }
}
