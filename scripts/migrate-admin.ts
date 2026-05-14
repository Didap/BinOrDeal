import postgres from "postgres"
import { config } from "dotenv"

config({ path: ".env.local" })

const sql = postgres(process.env.DATABASE_URL!)

async function main() {
  console.log("Applying admin dashboard migration...")

  // Add role column to users (if not exists)
  await sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL
  `
  console.log("✓ Added role column to users")

  // Add min_price_cents to search_logs (if not exists)
  await sql`
    ALTER TABLE "search_logs" ADD COLUMN IF NOT EXISTS "min_price_cents" integer
  `
  console.log("✓ Added min_price_cents column to search_logs")

  // Add max_price_cents to search_logs (if not exists)
  await sql`
    ALTER TABLE "search_logs" ADD COLUMN IF NOT EXISTS "max_price_cents" integer
  `
  console.log("✓ Added max_price_cents column to search_logs")

  // Promote the first user to admin
  const [adminUser] = await sql`
    UPDATE "users"
    SET "role" = 'admin'
    WHERE "email" = 'alessandrocaroli777@gmail.com'
    RETURNING "id", "email", "role"
  `

  if (adminUser) {
    console.log(`✓ Promoted ${adminUser.email} to admin (id: ${adminUser.id})`)
  } else {
    console.log("⚠ No user found with that email to promote")
  }

  await sql.end()
  console.log("\n✅ Migration complete!")
}

main().catch((e) => {
  console.error("Migration failed:", e)
  process.exit(1)
})
