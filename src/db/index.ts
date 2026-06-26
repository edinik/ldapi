import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "sqlite.db");
const sqlite = new Database(dbPath);

// 启用 WAL 模式提升并发性能
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
