import postgres from "postgres"
import { config } from "dotenv"

config({ path: ".env.local" })

const sql = postgres(process.env.DATABASE_URL!)

async function main() {
  console.log("Adding platforms column to search_logs...")

  await sql`
    ALTER TABLE "search_logs" ADD COLUMN IF NOT EXISTS "platforms" text
  `
  console.log("✓ Added platforms column to search_logs")

  await sql.end()
  console.log("\n✅ Migration complete!")
}

main().catch((e) => {
  console.error("Migration failed:", e)
  process.exit(1)
})
