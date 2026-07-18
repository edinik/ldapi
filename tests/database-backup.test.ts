import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import {
  createBackupFilename,
  createDatabaseBackup,
} from "../src/server/backup/create-database-backup";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

async function createTemporaryRoot() {
  const directory = await mkdtemp(join(tmpdir(), "ldapi-backup-test-"));
  temporaryRoots.push(directory);
  return directory;
}

describe("database backup", () => {
  it("creates an integral snapshot, removes copied sessions, and leaves the source unchanged", async () => {
    const root = await createTemporaryRoot();
    const sourcePath = join(root, "source.sqlite");
    const backupTempRoot = join(root, "backup-temp");
    const source = new Database(sourcePath);
    source.pragma("journal_mode = WAL");
    source.exec(`
      CREATE TABLE sites (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL);
      CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);
      INSERT INTO sites (id, name) VALUES (1, 'Example');
      INSERT INTO sessions (id, user_id) VALUES ('active-session', 7);
      INSERT INTO app_settings (key, value) VALUES ('ai_api_key', 'secret-value');
    `);

    await mkdir(backupTempRoot, { recursive: true });

    try {
      const backup = await createDatabaseBackup({
        sourcePath,
        tempRoot: backupTempRoot,
        now: new Date("2026-07-18T08:09:10.123Z"),
      });
      const snapshot = new Database(backup.contents);

      try {
        assert.equal(backup.filename, "ldapi-backup-20260718T080910123Z.sqlite");
        assert.deepEqual(snapshot.prepare("SELECT * FROM sites").all(), [
          { id: 1, name: "Example" },
        ]);
        assert.deepEqual(snapshot.prepare("SELECT * FROM app_settings").all(), [
          { key: "ai_api_key", value: "secret-value" },
        ]);
        assert.deepEqual(snapshot.prepare("SELECT * FROM sessions").all(), []);
        assert.equal(snapshot.pragma("integrity_check", { simple: true }), "ok");
        assert.deepEqual(source.prepare("SELECT * FROM sessions").all(), [
          { id: "active-session", user_id: 7 },
        ]);
        assert.deepEqual(await readdir(backupTempRoot), []);
      } finally {
        snapshot.close();
      }
    } finally {
      source.close();
    }
  });

  it("cleans its temporary directory when snapshot sanitization fails", async () => {
    const root = await createTemporaryRoot();
    const sourcePath = join(root, "source.sqlite");
    const backupTempRoot = join(root, "backup-temp");
    const source = new Database(sourcePath);
    source.exec("CREATE TABLE sites (id INTEGER PRIMARY KEY)");
    source.close();
    await mkdir(backupTempRoot, { recursive: true });

    await assert.rejects(
      createDatabaseBackup({ sourcePath, tempRoot: backupTempRoot }),
      /no such table: sessions/,
    );
    assert.deepEqual(await readdir(backupTempRoot), []);
  });

  it("creates filesystem-safe UTC filenames", () => {
    assert.equal(
      createBackupFilename(new Date("2026-07-18T08:09:10.123Z")),
      "ldapi-backup-20260718T080910123Z.sqlite",
    );
  });
});
