import { eq } from "drizzle-orm";
import { sites, siteModels } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { syncSiteModels, type SiteModelPayload } from "@/lib/site-model-payload";

export type SiteWrite = typeof sites.$inferInsert;

export async function createSite(database: AppDb, data: SiteWrite, modelPayloads: SiteModelPayload[]) {
  const [site] = await database.insert(sites).values(data).returning();

  if (modelPayloads.length > 0) {
    await syncSiteModels(database, site.id, modelPayloads);
  }

  return site;
}

export async function updateSite(
  database: AppDb,
  siteId: number,
  data: SiteWrite,
  modelPayloads: SiteModelPayload[],
  shouldSyncModels: boolean,
) {
  await database
    .update(sites)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sites.id, siteId));

  if (shouldSyncModels) {
    await database.delete(siteModels).where(eq(siteModels.siteId, siteId));
    await syncSiteModels(database, siteId, modelPayloads);
  }
}

export async function deleteSite(database: AppDb, siteId: number) {
  await database.delete(sites).where(eq(sites.id, siteId));
}
