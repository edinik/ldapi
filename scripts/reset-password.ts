import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { adminUsers } from "../src/db/schema";
import { hashPassword } from "../src/lib/password";
import { eq } from "drizzle-orm";

const sqlite = new Database("data/sqlite.db");
const db = drizzle(sqlite);

db.update(adminUsers)
  .set({ passwordHash: hashPassword("admin") })
  .where(eq(adminUsers.username, "admin"))
  .run();

console.log("密码已重置为: admin");
sqlite.close();
