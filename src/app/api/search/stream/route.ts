import { runSearchStream, type SearchStreamEvent } from "@/lib/search"
import type { Platform, ScoreTier, Vertical } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs" // Wallapop adapter requires Playwright/Node runtime

/**
 * GET /api/search/stream?q=...
 *
 * Streams an NDJSON sequence of `SearchStreamEvent` objects (one per line):
 *   {"kind":"ref",...}
 *   {"kind":"chunk","platform":"subito",...}
 *   {"kind":"chunk","platform":"vinted",...}
 *   ...
 *   {"kind":"done",...}
 *
 * Same query parameters as /api/search. Designed for the search page client to
 * paint partial results as adapters resolve, without waiting for the slowest
 * one (Wallapop, ~3-15s).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()
  if (!q) {
    return new Response(JSON.stringify({ error: "missing 'q' param" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }

  const params = {
    q,
    vertical: ((searchParams.get("v") as Vertical) ?? "pokemon") as Vertical,
    platforms: searchParams.get("p")?.split(",").filter(Boolean) as
      | Platform[]
      | undefined,
    tiers: searchParams.get("t")?.split(",").filter(Boolean) as ScoreTier[] | undefined,
    sort:
      (searchParams.get("s") as
        | "score"
        | "price-asc"
        | "price-desc"
        | "posted-desc"
        | null) ?? "score",
    minPriceCents: searchParams.get("min")
      ? Math.round(Number(searchParams.get("min")) * 100)
      : undefined,
    maxPriceCents: searchParams.get("max")
      ? Math.round(Number(searchParams.get("max")) * 100)
      : undefined,
    gameKind: (searchParams.get("kind") as "console" | "game" | null) ?? undefined,
    gamePlatform: searchParams.get("platform") ?? undefined,
    shoeSize: searchParams.get("size") ?? undefined,
    shoeGender:
      (searchParams.get("gender") as "uomo" | "donna" | "unisex" | null) ?? undefined,
    pokemonSet: searchParams.get("set") ?? undefined,
    refOverride: searchParams.get("ref") ?? undefined,
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SearchStreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"))
      }
      try {
        for await (const event of runSearchStream(params)) {
          send(event)
        }
      } catch (e) {
        send({
          kind: "error",
          message: e instanceof Error ? e.message : "unknown",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      // Disable proxy buffering (nginx/coolify) so chunks reach the client
      // as they're produced instead of being held until the stream closes.
      "x-accel-buffering": "no",
    },
  })
}
