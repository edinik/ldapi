import { describe, it } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";
import { getStoredAiSettings, saveAiSettings } from "../src/lib/ai-settings-store";

function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE app_settings (
      key text PRIMARY KEY NOT NULL,
      value text,
      updated_at integer
    )
  `);
  return drizzle(sqlite, { schema });
}

describe("AI settings store", () => {
  it("saves and reads OpenAI-compatible settings", async () => {
    const database = createTestDb();

    await saveAiSettings(database, {
      baseUrl: "https://api.example.com/v1",
      apiKey: "secret-key",
      model: "gpt-test",
    });

    assert.deepEqual(await getStoredAiSettings(database), {
      baseUrl: "https://api.example.com/v1",
      apiKey: "secret-key",
      model: "gpt-test",
    });
  });

  it("keeps the existing API key when the submitted API key is empty", async () => {
    const database = createTestDb();

    await saveAiSettings(database, {
      baseUrl: "https://api.example.com/v1",
      apiKey: "secret-key",
      model: "gpt-test",
    });
    await saveAiSettings(database, {
      baseUrl: "https://api.other.com/v1",
      apiKey: null,
      model: "gpt-other",
    });

    assert.deepEqual(await getStoredAiSettings(database), {
      baseUrl: "https://api.other.com/v1",
      apiKey: "secret-key",
      model: "gpt-other",
    });
  });
});
