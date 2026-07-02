import Database from "better-sqlite3";
import { randomBytes, scryptSync } from "crypto";
import fs from "fs";
import path from "path";

const appRoot = "/app";
const dbPath = path.join(appRoot, "data", "sqlite.db");
const migrationsPath = path.join(appRoot, "drizzle");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function normalizeStatement(statement) {
  return statement
    .trim()
    .replace(/^CREATE TABLE\s+`/i, "CREATE TABLE IF NOT EXISTS `")
    .replace(/^CREATE UNIQUE INDEX\s+`/i, "CREATE UNIQUE INDEX IF NOT EXISTS `")
    .replace(/^CREATE INDEX\s+`/i, "CREATE INDEX IF NOT EXISTS `")
    .trim();
}

function runStatement(db, statement) {
  const sql = normalizeStatement(statement);
  if (!sql) {
    return;
  }

  try {
    db.exec(sql);
  } catch (error) {
    if (/duplicate column name/i.test(error.message)) {
      return;
    }
    throw error;
  }
}

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS __ldapi_migrations (
      tag TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);

  const journal = JSON.parse(
    fs.readFileSync(path.join(migrationsPath, "meta", "_journal.json"), "utf8"),
  );

  const applied = new Set(
    db.prepare("SELECT tag FROM __ldapi_migrations").all().map((row) => row.tag),
  );
  const markApplied = db.prepare(
    "INSERT OR IGNORE INTO __ldapi_migrations (tag, applied_at) VALUES (?, ?)",
  );

  for (const entry of journal.entries) {
    if (applied.has(entry.tag)) {
      continue;
    }

    const filePath = path.join(migrationsPath, `${entry.tag}.sql`);
    const sql = fs.readFileSync(filePath, "utf8");
    const statements = sql.split("--> statement-breakpoint");

    db.transaction(() => {
      for (const statement of statements) {
        runStatement(db, statement);
      }
      markApplied.run(entry.tag, Date.now());
    })();
  }
}

function seedAdmin(db) {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error("ADMIN_PASSWORD is required. Set it in .env before starting the container.");
  }

  db.prepare(
    "INSERT OR IGNORE INTO admin_users (username, password_hash, created_at) VALUES (?, ?, ?)",
  ).run(username, hashPassword(password), Date.now());

  console.log(`管理员账户已创建: ${username}`);
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
try {
  db.pragma("journal_mode = WAL");
  runMigrations(db);
  seedAdmin(db);
} finally {
  db.close();
}
