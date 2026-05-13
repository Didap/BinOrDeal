import { db } from "../src/db/client"
import { searchLogs } from "../src/db/schema"
import { desc } from "drizzle-orm"

async function main() {
  if (!db) {
    console.error("DB not connected")
    return
  }
  const logs = await db.select().from(searchLogs).orderBy(desc(searchLogs.createdAt)).limit(10)
  console.log("Recent logs:", JSON.stringify(logs, null, 2))
}

main()
