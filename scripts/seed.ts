import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { adminUsers } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";

const sqlite = new Database("data/sqlite.db");
const db = drizzle(sqlite);

const username = process.argv[2] || "admin";
const password = process.argv[3] || "changeme";

db.insert(adminUsers)
  .values({ username, passwordHash: hashPassword(password) })
  .onConflictDoNothing()
  .run();

console.log(`管理员账户已创建: ${username}`);
sqlite.close();
