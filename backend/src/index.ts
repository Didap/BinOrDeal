import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { logger } from "hono/logger"
import { syncPokemonCatalog } from "./jobs/catalog-sync-pokemon.js"

const app = new Hono()
app.use(logger())

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "bin-or-deal-backend",
    ts: new Date().toISOString(),
  }),
)

/**
 * All /jobs/* endpoints require a shared secret header. Not user-facing —
 * these are meant to be hit by cron runners (GitHub Actions, QStash, Coolify
 * scheduled tasks) with the `BACKEND_SECRET` env var configured.
 */
app.use("/jobs/*", async (c, next) => {
  const expected = process.env.BACKEND_SECRET
  if (!expected) {
    return c.json(
      { error: "backend is not configured — BACKEND_SECRET missing" },
      500,
    )
  }
  const provided = c.req.header("x-backend-secret")
  if (provided !== expected) {
    return c.json({ error: "unauthorized" }, 401)
  }
  await next()
})

app.post("/jobs/catalog-sync-pokemon", async (c) => {
  try {
    const result = await syncPokemonCatalog()
    return c.json({ ok: true, ...result })
  } catch (e) {
    console.error("[catalog-sync] failed:", e)
    return c.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      500,
    )
  }
})

const port = Number(process.env.PORT ?? 4000)
serve({ fetch: app.fetch, port })
console.log(`[backend] listening on :${port}`)
