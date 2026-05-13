import { db } from "../src/db/client"
import { sql } from "drizzle-orm"

async function main() {
  if (!db) {
    console.error("DB not connected")
    return
  }
  try {
    console.log("Adding user_ip column to search_logs...")
    await db.execute(sql`ALTER TABLE "search_logs" ADD COLUMN IF NOT EXISTS "user_ip" text`);
    console.log("Adding index search_logs_ip_idx...")
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "search_logs_ip_idx" ON "search_logs" ("user_ip")`);
    console.log("Success!");
  } catch (e) {
    console.error("Manual fix failed:", e)
  }
}

main()
