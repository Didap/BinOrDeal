
import { db } from "../src/db/client";
import { users } from "../src/db/schema";

async function checkUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log("Current Users:", JSON.stringify(allUsers, null, 2));
  } catch (e) {
    console.error("Error fetching users:", e);
  }
  process.exit(0);
}

checkUsers();
