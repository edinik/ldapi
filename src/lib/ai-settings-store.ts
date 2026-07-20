import { eq, inArray } from "drizzle-orm";
import { appSettings } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { parseAiSettingsPayload, type ParsedAiSettings, type StoredAiSettings } from "@/lib/ai-settings";

const keys = {
  baseUrl: "ai.base_url",
  apiKey: "ai.api_key",
  model: "ai.model",
  reasoningEffort: "ai.reasoning_effort",
} as const;

async function upsertSetting(database: AppDb, key: string, value: string | null) {
  await database
    .insert(appSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

function mapRows(rows: Array<{ key: string; value: string | null }>): StoredAiSettings {
  const values = new Map(rows.map((row) => [row.key, row.value]));
  return {
    baseUrl: values.get(keys.baseUrl) ?? null,
    apiKey: values.get(keys.apiKey) ?? null,
    model: values.get(keys.model) ?? null,
    reasoningEffort: parseAiSettingsPayload({
      reasoningEffort: values.get(keys.reasoningEffort),
    }).reasoningEffort,
  };
}

export async function getStoredAiSettings(database: AppDb): Promise<StoredAiSettings> {
  const rows = await database
    .select({ key: appSettings.key, value: appSettings.value })
    .from(appSettings)
    .where(inArray(appSettings.key, [keys.baseUrl, keys.apiKey, keys.model, keys.reasoningEffort]));

  return mapRows(rows);
}

export async function saveAiSettings(database: AppDb, settings: ParsedAiSettings) {
  await upsertSetting(database, keys.baseUrl, settings.baseUrl);
  await upsertSetting(database, keys.model, settings.model);
  await upsertSetting(database, keys.reasoningEffort, settings.reasoningEffort);

  if (settings.apiKey) {
    await upsertSetting(database, keys.apiKey, settings.apiKey);
    return;
  }

  const existing = await database
    .select({ key: appSettings.key })
    .from(appSettings)
    .where(eq(appSettings.key, keys.apiKey))
    .limit(1);

  if (existing.length === 0) {
    await upsertSetting(database, keys.apiKey, null);
  }
}
