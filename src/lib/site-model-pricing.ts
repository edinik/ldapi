export const pricingModes = ["inherit", "usage", "per_request", "free", "custom"] as const;
export type PricingMode = (typeof pricingModes)[number];

export const usagePriceSources = ["model_default", "manual"] as const;
export type UsagePriceSource = (typeof usagePriceSources)[number];

export type SiteModelPricingSettings = {
  pricingMode: PricingMode;
  usagePriceSource: UsagePriceSource;
  priceMultiplier: number;
  inputCostPerMTokensOverride: number | null;
  outputCostPerMTokensOverride: number | null;
  cacheReadCostPerMTokensOverride: number | null;
  cacheWriteCostPerMTokensOverride: number | null;
  perRequestCost: number | null;
  pricingNotes: string | null;
};

export type ModelPricingDefaults = {
  inputCostPerMTokens: number | null;
  outputCostPerMTokens: number | null;
  cacheReadCostPerMTokens: number | null;
  cacheWriteCostPerMTokens: number | null;
};

function isPricingMode(value: unknown): value is PricingMode {
  return typeof value === "string" && pricingModes.includes(value as PricingMode);
}

function isUsagePriceSource(value: unknown): value is UsagePriceSource {
  return typeof value === "string" && usagePriceSources.includes(value as UsagePriceSource);
}

export function parseNullablePrice(value: unknown) {
  if (value === "" || value == null) return null;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parsePositiveMultiplier(value: unknown) {
  const parsed = parseNullablePrice(value);
  if (parsed == null || parsed <= 0) return 1;
  return parsed;
}

function parseNotes(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function normalizeSiteModelPricingPayload(value: Record<string, unknown>): SiteModelPricingSettings {
  return {
    pricingMode: isPricingMode(value.pricingMode) ? value.pricingMode : "inherit",
    usagePriceSource: isUsagePriceSource(value.usagePriceSource) ? value.usagePriceSource : "model_default",
    priceMultiplier: parsePositiveMultiplier(value.priceMultiplier),
    inputCostPerMTokensOverride: parseNullablePrice(value.inputCostPerMTokensOverride),
    outputCostPerMTokensOverride: parseNullablePrice(value.outputCostPerMTokensOverride),
    cacheReadCostPerMTokensOverride: parseNullablePrice(value.cacheReadCostPerMTokensOverride),
    cacheWriteCostPerMTokensOverride: parseNullablePrice(value.cacheWriteCostPerMTokensOverride),
    perRequestCost: parseNullablePrice(value.perRequestCost),
    pricingNotes: parseNotes(value.pricingNotes),
  };
}

export function normalizeStoredSiteModelPricing(value: Partial<SiteModelPricingSettings>): SiteModelPricingSettings {
  return normalizeSiteModelPricingPayload({
    pricingMode: value.pricingMode,
    usagePriceSource: value.usagePriceSource,
    priceMultiplier: value.priceMultiplier,
    inputCostPerMTokensOverride: value.inputCostPerMTokensOverride,
    outputCostPerMTokensOverride: value.outputCostPerMTokensOverride,
    cacheReadCostPerMTokensOverride: value.cacheReadCostPerMTokensOverride,
    cacheWriteCostPerMTokensOverride: value.cacheWriteCostPerMTokensOverride,
    perRequestCost: value.perRequestCost,
    pricingNotes: value.pricingNotes,
  });
}

function formatMoney(value: number) {
  return `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
}

function multiply(value: number | null, multiplier: number) {
  if (value == null) return null;
  return value * multiplier;
}

function usageLabels(source: ModelPricingDefaults, multiplier: number) {
  const labels = [
    ["输入", multiply(source.inputCostPerMTokens, multiplier)],
    ["输出", multiply(source.outputCostPerMTokens, multiplier)],
    ["缓存读", multiply(source.cacheReadCostPerMTokens, multiplier)],
    ["缓存写", multiply(source.cacheWriteCostPerMTokens, multiplier)],
  ] as const;

  const resolved = labels
    .filter((item): item is readonly [string, number] => item[1] != null)
    .map(([label, value]) => `${label} ${formatMoney(value)}/M tokens`);

  return resolved.length > 0 ? resolved : ["价格未填写"];
}

export function formatSiteModelPricing(model: ModelPricingDefaults, settings: SiteModelPricingSettings) {
  if (settings.pricingMode === "free") return ["免费"];
  if (settings.pricingMode === "custom") return settings.pricingNotes ? [settings.pricingNotes] : ["价格未填写"];
  if (settings.pricingMode === "per_request") {
    return settings.perRequestCost == null ? ["价格未填写"] : [`每次 ${formatMoney(settings.perRequestCost)}`];
  }

  const source =
    settings.pricingMode === "usage" && settings.usagePriceSource === "manual"
      ? {
          inputCostPerMTokens: settings.inputCostPerMTokensOverride,
          outputCostPerMTokens: settings.outputCostPerMTokensOverride,
          cacheReadCostPerMTokens: settings.cacheReadCostPerMTokensOverride,
          cacheWriteCostPerMTokens: settings.cacheWriteCostPerMTokensOverride,
        }
      : model;

  const multiplier = settings.pricingMode === "inherit" ? 1 : settings.priceMultiplier;
  return usageLabels(source, multiplier);
}
