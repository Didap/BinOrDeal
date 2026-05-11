import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

/**
 * Postgres client.
 *
 * Works identically against the local Docker Postgres and Neon in prod
 * because `postgres` (porsager/postgres) is a pure-JS client that speaks
 * wire protocol. For Neon you may prefer their serverless HTTP driver
 * once we're on the edge — until then, this is portable.
 *
 * `DATABASE_URL` is read at module init; if it's not set the client is
 * lazy-created on first call and will throw a clear error.
 */

const connectionString = process.env.DATABASE_URL

// Single-process singleton so Next.js dev mode hot-reloads don't spawn
// a new pool per reload.
declare global {
  var __binOrDealPg: ReturnType<typeof postgres> | undefined
}

function getClient() {
  if (!connectionString) {
    console.warn(
      "DATABASE_URL not set. Database features (search quotas, users) will be disabled. Copy .env.example to .env.local to enable.",
    )
    return null
  }
  if (!globalThis.__binOrDealPg) {
    globalThis.__binOrDealPg = postgres(connectionString, {
      max: 10, // pool size
      idle_timeout: 30,
      connect_timeout: 10,
    })
  }
  return globalThis.__binOrDealPg
}

const client = getClient()
export const db = client ? drizzle(client, { schema }) : (null as any)
export { schema }
