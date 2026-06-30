export const reasoningEffortLevels = ["none", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

export type ReasoningEffortLevel = (typeof reasoningEffortLevels)[number];

export type ModelCapabilityDefaults = {
  supportsToolCalling: boolean | null;
  supportsVision: boolean | null;
  supportsTemperatureControl: boolean | null;
  supportsReasoning: boolean | null;
  supportsWebSearch: boolean | null;
  reasoningEffortLevels?: string[] | null;
};

export type SiteModelCapabilityOverrides = {
  supportsToolCallingOverride: boolean | null;
  supportsVisionOverride: boolean | null;
  supportsTemperatureControlOverride: boolean | null;
  supportsReasoningOverride: boolean | null;
  supportsWebSearchOverride: boolean | null;
  reasoningEffortLevelsOverride?: string[] | null;
};

export type ResolvedSiteModelCapabilities = {
  supportsToolCalling: boolean;
  supportsVision: boolean;
  supportsTemperatureControl: boolean;
  supportsReasoning: boolean;
  supportsWebSearch: boolean;
  reasoningEffortLevels: ReasoningEffortLevel[];
};

function resolveCapability(defaultValue: boolean | null, overrideValue: boolean | null) {
  return overrideValue ?? defaultValue ?? false;
}

export function parseReasoningEffortLevels(value: string[] | string | null | undefined): ReasoningEffortLevel[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const valid = raw.filter((item): item is ReasoningEffortLevel =>
    reasoningEffortLevels.includes(item.trim() as ReasoningEffortLevel),
  );

  return Array.from(new Set(valid)).sort((a, b) => reasoningEffortLevels.indexOf(a) - reasoningEffortLevels.indexOf(b));
}

export function serializeReasoningEffortLevels(value: string[] | null | undefined) {
  return parseReasoningEffortLevels(value).join(",");
}

export function formatReasoningEffortLevels(levels: string[] | null | undefined) {
  const parsed = parseReasoningEffortLevels(levels);
  if (parsed.length === 0) return "";

  const indexes = parsed.map((level) => reasoningEffortLevels.indexOf(level));
  const contiguous = indexes.every((index, position) => position === 0 || index === indexes[position - 1] + 1);
  if (contiguous && parsed.length >= 3) {
    return `${parsed[0]}-${parsed[parsed.length - 1]}`;
  }

  return parsed.join("/");
}

export function resolveSiteModelCapabilities(
  model: ModelCapabilityDefaults,
  overrides: SiteModelCapabilityOverrides,
): ResolvedSiteModelCapabilities {
  const supportsReasoning = resolveCapability(model.supportsReasoning, overrides.supportsReasoningOverride);
  const reasoningEffortLevelsOverride = overrides.reasoningEffortLevelsOverride ?? null;
  const resolvedReasoningEffortLevels = supportsReasoning
    ? parseReasoningEffortLevels(reasoningEffortLevelsOverride ?? model.reasoningEffortLevels)
    : [];

  return {
    supportsToolCalling: resolveCapability(model.supportsToolCalling, overrides.supportsToolCallingOverride),
    supportsVision: resolveCapability(model.supportsVision, overrides.supportsVisionOverride),
    supportsTemperatureControl: resolveCapability(model.supportsTemperatureControl, overrides.supportsTemperatureControlOverride),
    supportsReasoning,
    supportsWebSearch: resolveCapability(model.supportsWebSearch, overrides.supportsWebSearchOverride),
    reasoningEffortLevels: resolvedReasoningEffortLevels,
  };
}

export function getSiteModelCapabilityLabels(capabilities: ResolvedSiteModelCapabilities) {
  const reasoningEffortLabel = formatReasoningEffortLevels(capabilities.reasoningEffortLevels);

  return [
    capabilities.supportsToolCalling ? "工具调用" : null,
    capabilities.supportsVision ? "视觉" : null,
    capabilities.supportsTemperatureControl ? "温度" : null,
    capabilities.supportsReasoning ? (reasoningEffortLabel ? `推理: ${reasoningEffortLabel}` : "推理") : null,
    capabilities.supportsWebSearch ? "联网" : null,
  ].filter((label): label is string => label !== null);
}
