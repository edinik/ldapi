import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { models, resources, siteModels, sites } from "../src/db/schema";
import {
  projectDirectoryModel,
  projectDirectoryResource,
  projectDirectorySite,
} from "../src/server/directory/projections";
import { getHomeDirectoryData } from "../src/server/directory/get-home-directory-data";
import { createTestDb } from "./test-db";

describe("directory projections", () => {
  it("projects model reasoning levels and resource tags", async () => {
    const { database, sqlite } = createTestDb();
    try {
      const [model] = await database
        .insert(models)
        .values({ name: "Reasoner", supportsReasoning: true, reasoningEffortLevels: "high,low" })
        .returning();
      const [resource] = await database
        .insert(resources)
        .values({ type: "other", title: "Guide", tags: "[\"Docker\",\"AI\"]" })
        .returning();

      assert.deepEqual(projectDirectoryModel(model).reasoningEffortLevels, ["low", "high"]);
      assert.deepEqual(projectDirectoryResource(resource), {
        id: resource.id,
        type: "tutorial",
        title: "Guide",
        description: null,
        tags: ["Docker", "AI"],
        githubUrl: null,
        officialUrl: null,
        demoUrl: null,
        linuxdoUrl: null,
        recommendation: null,
      });
    } finally {
      sqlite.close();
    }
  });

  it("projects site model capability overrides, rating, and pricing", async () => {
    const { database, sqlite } = createTestDb();
    try {
      const [site] = await database
        .insert(sites)
        .values({ name: "Example", url: "https://example.com", supportsCodex: true })
        .returning();
      const [model] = await database
        .insert(models)
        .values({
          name: "Claude",
          supportsToolCalling: true,
          supportsVision: false,
          inputCostPerMTokens: 5,
          outputCostPerMTokens: 25,
        })
        .returning();
      await database.insert(siteModels).values({
        siteId: site.id,
        modelId: model.id,
        supportsToolCallingOverride: false,
        supportsVisionOverride: true,
        rating: "顶级",
        pricingMode: "usage",
        usagePriceSource: "model_default",
        priceMultiplier: 2,
      });

      const source = await database.query.sites.findFirst({
        where: eq(sites.id, site.id),
        with: { siteModels: { with: { model: true } } },
      });
      assert.ok(source);

      const projected = projectDirectorySite(source);
      assert.equal(projected.supportsCodex, true);
      assert.deepEqual(projected.models, ["Claude"]);
      assert.deepEqual(projected.modelCapabilities, [
        {
          name: "Claude",
          capabilities: ["视觉"],
          rating: "顶级",
          pricingLabels: ["输入 $10/M tokens", "输出 $50/M tokens"],
        },
      ]);
    } finally {
      sqlite.close();
    }
  });
});

describe("home directory query service", () => {
  it("preserves active filters and existing sort order", async () => {
    const { database, sqlite } = createTestDb();
    try {
      await database.insert(sites).values([
        { name: "Older", url: "https://older.example", isActive: true, createdAt: new Date("2026-01-01") },
        { name: "Newer", url: "https://newer.example", isActive: true, createdAt: new Date("2026-02-01") },
        { name: "Hidden", url: "https://hidden.example", isActive: false, createdAt: new Date("2026-03-01") },
      ]);
      await database.insert(models).values([
        { name: "Zeta", developer: "Beta", isActive: true, showOnHome: true },
        { name: "Alpha", developer: "Alpha", isActive: true, showOnHome: true },
        { name: "Hidden Model", developer: "Alpha", isActive: true, showOnHome: false },
      ]);
      await database.insert(resources).values([
        { title: "Older Resource", isActive: true, createdAt: new Date("2026-01-01") },
        { title: "Newer Resource", isActive: true, createdAt: new Date("2026-02-01") },
        { title: "Hidden Resource", isActive: false, createdAt: new Date("2026-03-01") },
      ]);

      const result = await getHomeDirectoryData(database);
      assert.deepEqual(result.sites.map((site) => site.name), ["Newer", "Older"]);
      assert.deepEqual(result.models.map((model) => model.name), ["Alpha", "Zeta"]);
      assert.deepEqual(result.resources.map((resource) => resource.title), ["Newer Resource", "Older Resource"]);
    } finally {
      sqlite.close();
    }
  });
});
