import type { SiteDirectoryItem } from "@/components/SiteDirectory";
import { models, resources, siteModels, sites } from "@/db/schema";
import type { ModelDisplayItem } from "@/lib/model-display";
import type { DirectoryResource } from "@/lib/resource-directory-filter";
import { parseStoredResourceTags } from "@/lib/resource-payload";
import {
  getSiteModelCapabilityLabels,
  parseReasoningEffortLevels,
  resolveSiteModelCapabilities,
} from "@/lib/site-model-capabilities";
import { formatSiteModelPricing, normalizeStoredSiteModelPricing } from "@/lib/site-model-pricing";

export type ModelProjectionSource = typeof models.$inferSelect;
export type ResourceProjectionSource = typeof resources.$inferSelect;
export type SiteProjectionSource = typeof sites.$inferSelect & {
  siteModels: Array<typeof siteModels.$inferSelect & { model: ModelProjectionSource }>;
};

export function projectDirectoryModel(model: ModelProjectionSource): ModelDisplayItem {
  return {
    ...model,
    reasoningEffortLevels: parseReasoningEffortLevels(model.reasoningEffortLevels),
  };
}

export function projectDirectoryResource(resource: ResourceProjectionSource): DirectoryResource {
  return {
    id: resource.id,
    type: resource.type === "tool" ? "tool" : "tutorial",
    title: resource.title,
    description: resource.description,
    tags: parseStoredResourceTags(resource.tags),
    githubUrl: resource.githubUrl,
    officialUrl: resource.officialUrl,
    demoUrl: resource.demoUrl,
    linuxdoUrl: resource.linuxdoUrl,
    recommendation: resource.recommendation,
  };
}

export function projectDirectorySite(site: SiteProjectionSource): SiteDirectoryItem {
  const modelCapabilities = site.siteModels.map((siteModel) => {
    const capabilities = resolveSiteModelCapabilities(
      {
        ...siteModel.model,
        reasoningEffortLevels: parseReasoningEffortLevels(siteModel.model.reasoningEffortLevels),
      },
      {
        ...siteModel,
        reasoningEffortLevelsOverride:
          siteModel.reasoningEffortLevelsOverride == null
            ? null
            : parseReasoningEffortLevels(siteModel.reasoningEffortLevelsOverride),
      },
    );
    const pricingLabels = formatSiteModelPricing(
      {
        inputCostPerMTokens: siteModel.model.inputCostPerMTokens,
        outputCostPerMTokens: siteModel.model.outputCostPerMTokens,
        cacheReadCostPerMTokens: siteModel.model.cacheReadCostPerMTokens,
        cacheWriteCostPerMTokens: siteModel.model.cacheWriteCostPerMTokens,
      },
      normalizeStoredSiteModelPricing({
        pricingMode: siteModel.pricingMode,
        usagePriceSource: siteModel.usagePriceSource,
        priceMultiplier: siteModel.priceMultiplier,
        inputCostPerMTokensOverride: siteModel.inputCostPerMTokensOverride,
        outputCostPerMTokensOverride: siteModel.outputCostPerMTokensOverride,
        cacheReadCostPerMTokensOverride: siteModel.cacheReadCostPerMTokensOverride,
        cacheWriteCostPerMTokensOverride: siteModel.cacheWriteCostPerMTokensOverride,
        perRequestCost: siteModel.perRequestCost,
        pricingNotes: siteModel.pricingNotes,
      }),
    );

    return {
      name: siteModel.model.name,
      capabilities: getSiteModelCapabilityLabels(capabilities),
      rating: siteModel.rating ?? null,
      pricingLabels,
    };
  });

  return {
    id: site.id,
    name: site.name,
    url: site.url,
    description: site.description,
    adminProfileUrl: site.adminProfileUrl,
    discussionUrl: site.discussionUrl,
    hasCheckIn: site.hasCheckIn,
    autoCheckIn: site.autoCheckIn,
    checkInUrl: site.checkInUrl,
    supportsClaudeCode: site.supportsClaudeCode,
    supportsCodex: site.supportsCodex,
    supportsImmersiveTranslation: site.supportsImmersiveTranslation,
    welfareUrl: site.welfareUrl,
    statusUrl: site.statusUrl,
    hasRateLimit: site.hasRateLimit,
    rateLimitInfo: site.rateLimitInfo,
    hasActivityRequirement: site.hasActivityRequirement,
    activityRequirementInfo: site.activityRequirementInfo,
    models: modelCapabilities.map((model) => model.name),
    modelCapabilities,
  };
}
