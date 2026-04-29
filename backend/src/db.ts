import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
// Schema is shared with the Next.js side — single source of truth.
// Relative import (not alias) — tsx/esbuild doesn't resolve TS path aliases
// at runtime. Works identically in the Docker build when we COPY the
// parent's src/db directory alongside backend/.
import * as schema from "../../src/db/schema"

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error("DATABASE_URL not set — refusing to start the backend")
}

const client = postgres(url, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
export { schema }
export { client as raw }
