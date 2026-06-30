import { serializeReasoningEffortLevels } from "@/lib/site-model-capabilities";

function nullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function nullableNumber(value: unknown) {
  if (value === "" || value == null) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function booleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

export function parseModelPayload(body: Record<string, unknown>) {
  return {
    name: requiredString(body.name),
    developer: nullableString(body.developer),
    modelId: nullableString(body.modelId),
    icon: nullableString(body.icon),
    officialUrl: nullableString(body.officialUrl),
    group: nullableString(body.group),
    type: nullableString(body.type),
    notes: nullableString(body.notes),
    supportsToolCalling: booleanValue(body.supportsToolCalling),
    supportsVision: booleanValue(body.supportsVision),
    supportsTemperatureControl: booleanValue(body.supportsTemperatureControl),
    supportsReasoning: booleanValue(body.supportsReasoning),
    reasoningEffortLevels: serializeReasoningEffortLevels(Array.isArray(body.reasoningEffortLevels) ? body.reasoningEffortLevels : []),
    supportsWebSearch: booleanValue(body.supportsWebSearch),
    inputText: booleanValue(body.inputText, true),
    inputImage: booleanValue(body.inputImage),
    inputAudio: booleanValue(body.inputAudio),
    inputVideo: booleanValue(body.inputVideo),
    outputText: booleanValue(body.outputText, true),
    outputImage: booleanValue(body.outputImage),
    outputAudio: booleanValue(body.outputAudio),
    outputVideo: booleanValue(body.outputVideo),
    inputCostPerMTokens: nullableNumber(body.inputCostPerMTokens),
    outputCostPerMTokens: nullableNumber(body.outputCostPerMTokens),
    cacheReadCostPerMTokens: nullableNumber(body.cacheReadCostPerMTokens),
    cacheWriteCostPerMTokens: nullableNumber(body.cacheWriteCostPerMTokens),
    contextWindow: nullableNumber(body.contextWindow),
    maxOutputTokens: nullableNumber(body.maxOutputTokens),
    knowledgeCutoff: nullableString(body.knowledgeCutoff),
    releaseDate: nullableString(body.releaseDate),
    lastUpdated: nullableString(body.lastUpdated),
    isActive: booleanValue(body.isActive, true),
    showOnHome: booleanValue(body.showOnHome),
  };
}
