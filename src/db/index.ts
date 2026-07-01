import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "sqlite.db");
const sqlite = new Database(dbPath);

if (process.env.npm_lifecycle_event !== "build") {
  // Enable WAL at runtime. During `next build`, multiple workers import this
  // module and can contend on SQLite while collecting route data.
  sqlite.pragma("journal_mode = WAL");
}

export const db = drizzle(sqlite, { schema });
