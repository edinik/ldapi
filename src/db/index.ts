import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { databasePath } from "./database-path";

const sqlite = new Database(databasePath);

if (process.env.npm_lifecycle_event !== "build") {
  // Enable WAL at runtime. During `next build`, multiple workers import this
  // module and can contend on SQLite while collecting route data.
  sqlite.pragma("journal_mode = WAL");
}

export const db = drizzle(sqlite, { schema });
