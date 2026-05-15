import { db } from "../src/db/client";
import { users } from "../src/db/schema";

async function test() {
  try {
    console.log("Testing DB connection...");
    const result = await db.select().from(users).limit(1);
    console.log("Success! Users found:", result.length);
  } catch (e) {
    console.error("DB Test Failed:", e);
  } finally {
    process.exit();
  }
}

test();
