import { desc, eq } from "drizzle-orm";
import { resources } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { getHomepageModels } from "@/lib/model-display";
import { projectDirectoryModel, projectDirectoryResource, projectDirectorySite } from "./projections";
import type { HomeDirectoryData } from "./types";

export async function getHomeDirectoryData(database: AppDb): Promise<HomeDirectoryData> {
  const allSites = await database.query.sites.findMany({
    where: (sites, { eq }) => eq(sites.isActive, true),
    with: {
      siteModels: {
        with: { model: true },
      },
    },
    orderBy: (sites, { desc }) => [desc(sites.createdAt)],
  });
  const allModels = await database.query.models.findMany({
    orderBy: (models, { asc }) => [asc(models.developer), asc(models.name)],
  });
  const allResources = await database
    .select()
    .from(resources)
    .where(eq(resources.isActive, true))
    .orderBy(desc(resources.createdAt));

  return {
    sites: allSites.map(projectDirectorySite),
    models: getHomepageModels(allModels.map(projectDirectoryModel)),
    resources: allResources.map(projectDirectoryResource),
  };
}
