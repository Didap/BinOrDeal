/**
 * Apply drizzle-kit-generated SQL migrations against the configured DB.
 * Ran by `npm run db:migrate` both locally and in CI/prod.
 */
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"
import { config } from "dotenv"

config({ path: ".env.local" })

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL not set. Add it to .env.local.")
  process.exit(1)
}

async function main() {
  const sql = postgres(url!, { max: 1 })
  const db = drizzle(sql)
  await migrate(db, { migrationsFolder: "./drizzle" })
  console.log("migrations applied")
  await sql.end()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
