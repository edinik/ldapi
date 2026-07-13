import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { models, resources, siteModels, sites } from "../src/db/schema";
import { createModel, deleteModel, disableModel, importModels, updateModel } from "../src/server/admin/models";
import { createResource, deleteResource, updateResource } from "../src/server/admin/resources";
import { createSite, deleteSite, updateSite } from "../src/server/admin/sites";
import { normalizeSiteModelPricingPayload } from "../src/lib/site-model-pricing";
import { createTestDb } from "./test-db";

describe("admin entity services", () => {
  it("creates, updates, disables, and deletes models", async () => {
    const { database, sqlite } = createTestDb();
    try {
      const model = await createModel(database, { name: "Claude", developer: "Anthropic", showOnHome: true });
      await updateModel(database, model.id, { name: "Claude", developer: "Anthropic Inc.", showOnHome: true });

      let [stored] = await database.select().from(models).where(eq(models.id, model.id));
      assert.equal(stored.developer, "Anthropic Inc.");

      await disableModel(database, model.id);
      [stored] = await database.select().from(models).where(eq(models.id, model.id));
      assert.equal(stored.isActive, false);
      assert.equal(stored.showOnHome, false);

      await deleteModel(database, model.id);
      assert.deepEqual(await database.select().from(models).where(eq(models.id, model.id)), []);
    } finally {
      sqlite.close();
    }
  });

  it("previews and applies model imports with upsert semantics", async () => {
    const { database, sqlite } = createTestDb();
    try {
      await createModel(database, { name: "Claude", developer: "Anthropic" });
      const items = [
        { name: "Claude", developer: "Anthropic Inc." },
        { name: "GPT", developer: "OpenAI" },
      ];

      const preview = await importModels(database, items, { dryRun: true, upsert: true });
      assert.deepEqual(preview.summary, { created: 1, updated: 1, skipped: 0 });
      assert.equal((await database.select().from(models)).length, 1);

      const applied = await importModels(database, items, { dryRun: false, upsert: true });
      assert.deepEqual(applied.summary, { created: 1, updated: 1, skipped: 0 });
      const stored = await database.select().from(models);
      assert.deepEqual(
        stored.map((model) => [model.name, model.developer]).sort(),
        [
          ["Claude", "Anthropic Inc."],
          ["GPT", "OpenAI"],
        ],
      );
    } finally {
      sqlite.close();
    }
  });

  it("creates, updates, and deletes resources", async () => {
    const { database, sqlite } = createTestDb();
    try {
      const resource = await createResource(database, { type: "tool", title: "Project", tags: "[]" });
      await updateResource(database, resource.id, { type: "tool", title: "Updated Project", tags: "[\"AI\"]" });

      const [stored] = await database.select().from(resources).where(eq(resources.id, resource.id));
      assert.equal(stored.title, "Updated Project");
      assert.equal(stored.tags, "[\"AI\"]");

      await deleteResource(database, resource.id);
      assert.deepEqual(await database.select().from(resources).where(eq(resources.id, resource.id)), []);
    } finally {
      sqlite.close();
    }
  });

  it("creates and replaces site model associations before deleting the site", async () => {
    const { database, sqlite } = createTestDb();
    try {
      const inheritedPricing = normalizeSiteModelPricingPayload({});
      const site = await createSite(
        database,
        { name: "Example", url: "https://example.com" },
        [{ name: "Claude", rating: "顶级", ...inheritedPricing }],
      );

      let associations = await database.select().from(siteModels).where(eq(siteModels.siteId, site.id));
      assert.equal(associations.length, 1);
      assert.equal(associations[0].rating, "顶级");

      await updateSite(
        database,
        site.id,
        { name: "Updated Example", url: "https://example.com" },
        [{ name: "GPT", supportsVisionOverride: true, ...inheritedPricing }],
        true,
      );

      const [storedSite] = await database.select().from(sites).where(eq(sites.id, site.id));
      assert.equal(storedSite.name, "Updated Example");

      associations = await database.select().from(siteModels).where(eq(siteModels.siteId, site.id));
      assert.equal(associations.length, 1);
      assert.equal(associations[0].supportsVisionOverride, true);

      const associatedModel = await database
        .select({ name: models.name })
        .from(models)
        .where(eq(models.id, associations[0].modelId));
      assert.deepEqual(associatedModel, [{ name: "GPT" }]);

      await deleteSite(database, site.id);
      assert.deepEqual(await database.select().from(sites).where(eq(sites.id, site.id)), []);
      assert.deepEqual(await database.select().from(siteModels).where(eq(siteModels.siteId, site.id)), []);
    } finally {
      sqlite.close();
    }
  });
});
