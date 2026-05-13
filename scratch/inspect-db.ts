import { db } from "../src/db/client"
import { sql } from "drizzle-orm"

async function main() {
  if (!db) return
  const res = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'search_logs'
    ORDER BY column_name
  `)
  console.log("Columns of search_logs:", JSON.stringify(res, null, 2))
}

main()
