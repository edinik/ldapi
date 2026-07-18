import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";

type CreateDatabaseBackupOptions = {
  sourcePath: string;
  now?: Date;
  tempRoot?: string;
};

export type DatabaseBackup = {
  contents: Buffer;
  filename: string;
};

export async function createDatabaseBackup({
  sourcePath,
  now = new Date(),
  tempRoot = tmpdir(),
}: CreateDatabaseBackupOptions): Promise<DatabaseBackup> {
  const temporaryDirectory = await mkdtemp(join(tempRoot, "ldapi-backup-"));
  const snapshotPath = join(temporaryDirectory, "snapshot.sqlite");
  let sourceDatabase: Database.Database | null = null;
  let snapshotDatabase: Database.Database | null = null;

  try {
    sourceDatabase = new Database(sourcePath, {
      readonly: true,
      fileMustExist: true,
      timeout: 5_000,
    });
    await sourceDatabase.backup(snapshotPath);
    sourceDatabase.close();
    sourceDatabase = null;

    snapshotDatabase = new Database(snapshotPath, { timeout: 5_000 });
    snapshotDatabase.pragma("journal_mode = DELETE");
    snapshotDatabase.transaction(() => {
      snapshotDatabase?.prepare("DELETE FROM sessions").run();
    })();

    const integrityRows = snapshotDatabase.pragma("integrity_check") as Array<{
      integrity_check: string;
    }>;
    if (integrityRows.length !== 1 || integrityRows[0]?.integrity_check !== "ok") {
      throw new Error("SQLite backup integrity check failed");
    }

    snapshotDatabase.close();
    snapshotDatabase = null;

    return {
      contents: await readFile(snapshotPath),
      filename: createBackupFilename(now),
    };
  } finally {
    closeDatabase(sourceDatabase);
    closeDatabase(snapshotDatabase);
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

export function createBackupFilename(now: Date) {
  const timestamp = now.toISOString().replace(/[-:.]/g, "");
  return `ldapi-backup-${timestamp}.sqlite`;
}

function closeDatabase(database: Database.Database | null) {
  if (database?.open) {
    database.close();
  }
}
