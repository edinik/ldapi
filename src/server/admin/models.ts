import { eq, or } from "drizzle-orm";
import { models } from "@/db/schema";
import type { AppDb } from "@/db/types";

export type ModelWrite = typeof models.$inferInsert;

export async function createModel(database: AppDb, data: ModelWrite) {
  const [model] = await database.insert(models).values(data).returning();
  return model;
}

export async function updateModel(database: AppDb, modelId: number, data: ModelWrite) {
  await database
    .update(models)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(models.id, modelId));
}

export async function disableModel(database: AppDb, modelId: number) {
  await database
    .update(models)
    .set({ isActive: false, showOnHome: false, updatedAt: new Date() })
    .where(eq(models.id, modelId));
}

export async function deleteModel(database: AppDb, modelId: number) {
  await database.delete(models).where(eq(models.id, modelId));
}

type ImportModelsOptions = {
  dryRun: boolean;
  upsert: boolean;
};

export async function importModels(database: AppDb, items: ModelWrite[], { dryRun, upsert }: ImportModelsOptions) {
  const summary = { created: 0, updated: 0, skipped: 0 };
  const rows: Array<{ name: string; modelId: string | null | undefined; action: "create" | "update" | "skip" }> = [];

  for (const item of items) {
    const existing = await database.query.models.findFirst({
      where: item.modelId ? or(eq(models.modelId, item.modelId), eq(models.name, item.name)) : eq(models.name, item.name),
    });

    const action = existing ? (upsert ? "update" : "skip") : "create";
    rows.push({ name: item.name, modelId: item.modelId, action });

    if (existing) {
      if (!upsert) {
        summary.skipped += 1;
        continue;
      }

      summary.updated += 1;
      if (!dryRun) {
        await database
          .update(models)
          .set({ ...item, updatedAt: new Date() })
          .where(eq(models.id, existing.id));
      }
      continue;
    }

    summary.created += 1;
    if (!dryRun) {
      await database.insert(models).values(item);
    }
  }

  return { dryRun, summary, rows };
}
