import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";

const migrationFiles = [
  "0000_fluffy_violations.sql",
  "0001_opposite_wasp.sql",
  "0002_tiresome_hedge_knight.sql",
  "0003_previous_elektra.sql",
  "0004_site_model_pricing.sql",
];

export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");

  for (const file of migrationFiles) {
    const sql = readFileSync(join(process.cwd(), "drizzle", file), "utf8").replaceAll("--> statement-breakpoint", "");
    sqlite.exec(sql);
  }

  return { database: drizzle(sqlite, { schema }), sqlite };
}
