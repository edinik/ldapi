import { db } from "@/db";
import { models, siteModels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { serializeReasoningEffortLevels } from "@/lib/site-model-capabilities";
import { normalizeSiteModelPricingPayload, type SiteModelPricingSettings } from "@/lib/site-model-pricing";

export type SiteModelPayload = SiteModelPricingSettings & {
  name: string;
  supportsToolCallingOverride?: boolean | null;
  supportsVisionOverride?: boolean | null;
  supportsTemperatureControlOverride?: boolean | null;
  supportsReasoningOverride?: boolean | null;
  reasoningEffortLevelsOverride?: string[] | null;
  supportsWebSearchOverride?: boolean | null;
  rating?: string | null;
};

function nullableBoolean(value: unknown) {
  if (value === true || value === false) return value;
  return null;
}

function normalizeSiteModelPayload(value: unknown): SiteModelPayload | null {
  if (typeof value === "string") {
    const name = value.trim();
    return name ? { name, ...normalizeSiteModelPricingPayload({}) } : null;
  }

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (!name) return null;
  const pricing = normalizeSiteModelPricingPayload(record);

  return {
    name,
    supportsToolCallingOverride: nullableBoolean(record.supportsToolCallingOverride),
    supportsVisionOverride: nullableBoolean(record.supportsVisionOverride),
    supportsTemperatureControlOverride: nullableBoolean(record.supportsTemperatureControlOverride),
    supportsReasoningOverride: nullableBoolean(record.supportsReasoningOverride),
    reasoningEffortLevelsOverride: Array.isArray(record.reasoningEffortLevelsOverride) ? record.reasoningEffortLevelsOverride.map(String) : null,
    supportsWebSearchOverride: nullableBoolean(record.supportsWebSearchOverride),
    rating: typeof record.rating === "string" ? record.rating || null : null,
    ...pricing,
  };
}

export function getSiteModelPayloads(body: Record<string, unknown>) {
  if (Array.isArray(body.siteModels)) {
    return body.siteModels.map(normalizeSiteModelPayload).filter((item): item is SiteModelPayload => item !== null);
  }

  if (Array.isArray(body.modelNames)) {
    return body.modelNames.map(normalizeSiteModelPayload).filter((item): item is SiteModelPayload => item !== null);
  }

  return [];
}

export async function syncSiteModels(siteId: number, payloads: SiteModelPayload[]) {
  for (const payload of payloads) {
    let [model] = await db.select().from(models).where(eq(models.name, payload.name));
    if (!model) {
      [model] = await db.insert(models).values({ name: payload.name }).returning();
    }

    await db.insert(siteModels).values({
      siteId,
      modelId: model.id,
      supportsToolCallingOverride: payload.supportsToolCallingOverride ?? null,
      supportsVisionOverride: payload.supportsVisionOverride ?? null,
      supportsTemperatureControlOverride: payload.supportsTemperatureControlOverride ?? null,
      supportsReasoningOverride: payload.supportsReasoningOverride ?? null,
      reasoningEffortLevelsOverride: payload.reasoningEffortLevelsOverride
        ? serializeReasoningEffortLevels(payload.reasoningEffortLevelsOverride)
        : null,
      supportsWebSearchOverride: payload.supportsWebSearchOverride ?? null,
      rating: payload.rating ?? null,
      pricingMode: payload.pricingMode,
      usagePriceSource: payload.usagePriceSource,
      priceMultiplier: payload.priceMultiplier,
      inputCostPerMTokensOverride: payload.inputCostPerMTokensOverride,
      outputCostPerMTokensOverride: payload.outputCostPerMTokensOverride,
      cacheReadCostPerMTokensOverride: payload.cacheReadCostPerMTokensOverride,
      cacheWriteCostPerMTokensOverride: payload.cacheWriteCostPerMTokensOverride,
      perRequestCost: payload.perRequestCost,
      pricingNotes: payload.pricingNotes,
    });
  }
}
