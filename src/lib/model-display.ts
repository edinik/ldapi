import { formatReasoningEffortLevels } from "@/lib/site-model-capabilities";

export type ModelDisplayItem = {
  id: number;
  name: string;
  developer: string | null;
  modelId: string | null;
  icon: string | null;
  officialUrl: string | null;
  group: string | null;
  type: string | null;
  notes: string | null;
  supportsToolCalling: boolean | null;
  supportsVision: boolean | null;
  supportsTemperatureControl: boolean | null;
  supportsReasoning: boolean | null;
  reasoningEffortLevels: string[] | null;
  supportsWebSearch: boolean | null;
  inputText: boolean | null;
  inputImage: boolean | null;
  inputAudio: boolean | null;
  inputVideo: boolean | null;
  outputText: boolean | null;
  outputImage: boolean | null;
  outputAudio: boolean | null;
  outputVideo: boolean | null;
  inputCostPerMTokens: number | null;
  outputCostPerMTokens: number | null;
  cacheReadCostPerMTokens: number | null;
  cacheWriteCostPerMTokens: number | null;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  knowledgeCutoff: string | null;
  releaseDate: string | null;
  lastUpdated: string | null;
  isActive: boolean | null;
  showOnHome: boolean | null;
};

const capabilityFields: { key: keyof ModelDisplayItem; label: string }[] = [
  { key: "supportsToolCalling", label: "工具调用" },
  { key: "supportsVision", label: "视觉" },
  { key: "supportsTemperatureControl", label: "温度" },
  { key: "supportsReasoning", label: "推理" },
  { key: "supportsWebSearch", label: "联网" },
];

export type ModelCapabilityKey = (typeof capabilityFields)[number]["key"];

export type ModelFilters = {
  query: string;
  developer: string;
  capabilities: ModelCapabilityKey[];
};

const inputModalityFields: { key: keyof ModelDisplayItem; label: string }[] = [
  { key: "inputText", label: "文本" },
  { key: "inputImage", label: "图像" },
  { key: "inputAudio", label: "音频" },
  { key: "inputVideo", label: "视频" },
];

const outputModalityFields: { key: keyof ModelDisplayItem; label: string }[] = [
  { key: "outputText", label: "文本" },
  { key: "outputImage", label: "图像" },
  { key: "outputAudio", label: "音频" },
  { key: "outputVideo", label: "视频" },
];

function compactNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

export function formatTokenLimit(value: number | null | undefined) {
  if (value == null) return "未填写";
  if (value >= 1_000_000) return `${compactNumber(value / 1_000_000)}M`;
  if (value >= 1_000) return `${compactNumber(value / 1_000)}K`;
  return value.toLocaleString("en-US");
}

export function formatCost(value: number | null | undefined) {
  if (value == null) return "未填写";
  return `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 4 })} / M tokens`;
}

export function getCapabilityLabels(model: ModelDisplayItem) {
  return capabilityFields
    .filter((field) => model[field.key])
    .map((field) => {
      if (field.key !== "supportsReasoning") return field.label;
      const effortLabel = formatReasoningEffortLevels(model.reasoningEffortLevels);
      return effortLabel ? `推理: ${effortLabel}` : field.label;
    });
}

export function getInputModalityLabels(model: ModelDisplayItem) {
  return inputModalityFields.filter((field) => model[field.key]).map((field) => field.label);
}

export function getOutputModalityLabels(model: ModelDisplayItem) {
  return outputModalityFields.filter((field) => model[field.key]).map((field) => field.label);
}

export function getHomepageModels(models: ModelDisplayItem[]) {
  return models.filter((model) => model.isActive !== false && model.showOnHome === true);
}

export function filterModels(models: ModelDisplayItem[], filters: ModelFilters) {
  const query = filters.query.trim().toLowerCase();

  return models.filter((model) => {
    const searchable = [model.name, model.modelId, model.developer, model.group, model.type, model.notes]
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.toLowerCase());
    const matchesQuery = query.length === 0 || searchable.some((value) => value.includes(query));
    const matchesDeveloper = filters.developer.length === 0 || model.developer === filters.developer;
    const matchesCapabilities = filters.capabilities.every((capability) => !!model[capability]);

    return matchesQuery && matchesDeveloper && matchesCapabilities;
  });
}
