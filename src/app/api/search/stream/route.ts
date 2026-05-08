import { runSearchStream, type SearchStreamEvent } from "@/lib/search"
import type { Platform, ScoreTier, Vertical } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs" // Wallapop adapter requires Playwright/Node runtime

/**
 * GET /api/search/stream?q=...
 *
 * Streams `SearchStreamEvent` objects as Server-Sent Events:
 *   data: {"kind":"start",...}\n\n
 *   data: {"kind":"chunk","platform":"subito",...}\n\n
 *   ...
 *   data: {"kind":"done",...}\n\n
 *
 * Why SSE and not plain NDJSON: Coolify uses Traefik as the front proxy by
 * default, and Traefik buffers `application/x-ndjson` (and other unknown
 * types) until the response closes — defeating the whole point of streaming.
 * `text/event-stream` is recognized by every common proxy (Traefik, nginx,
 * Cloudflare) as a streaming format and forwarded chunk-by-chunk without
 * buffering. The client uses fetch + ReadableStream to read the SSE
 * frames; we don't use EventSource because we don't want auto-reconnect.
 *
 * Designed for the search page client to paint partial results as adapters
 * resolve, without waiting for the slowest one (Wallapop, ~3-15s).
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
    // `exl=0` opts the user *into* seeing pokémon lotteries (flagged, not
    // dropped). Any other value or missing param keeps the default (drop).
    excludeLotteries: searchParams.get("exl") !== "0",
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: SearchStreamEvent) => {
        // SSE frame: each event is one or more `data:` lines, terminated by
        // a blank line. We send the whole JSON on a single data line.
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        )
      }

      // Preamble: a 2KB SSE-comment line forces the response headers + first
      // bytes through the proxy immediately, so the client's `fetch` resolves
      // and the reader starts producing chunks. Without this, some proxies
      // (and even some browser HTTP stacks) wait until ~4KB has accumulated
      // before delivering the first chunk to userland, masking the streaming.
      // 4KB padding to force-flush initial buffer in some proxies (e.g. Traefik)
      controller.enqueue(
        encoder.encode(`: ${" ".repeat(4096)}\n\n`),
      )

      // Heartbeat every 15s — nothing reads it client-side, but it keeps idle
      // proxies from closing the connection if a search runs longer than the
      // proxy's read timeout (Coolify/Traefik default = 30s).
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`))
        } catch {
          /* controller already closed */
        }
      }, 15_000)

      try {
        for await (const event of runSearchStream(params)) {
          sendEvent(event)
        }
        clearInterval(heartbeat)
        controller.close()
      } catch (e) {
        clearInterval(heartbeat)
        sendEvent({
          kind: "error",
          message: e instanceof Error ? e.message : "unknown",
        })
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Defense-in-depth: even if some proxies don't recognize event-stream,
      // the no-buffering hints help nginx (`x-accel-buffering`) and CDNs
      // (`cdn-cache-control`) keep the response unbuffered.
      "x-accel-buffering": "no",
    },
  })
}
