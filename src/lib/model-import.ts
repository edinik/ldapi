import { parseModelPayload } from "@/lib/model-payload";

export type ModelImportError = {
  index: number;
  message: string;
};

export function createModelImportTemplate() {
  return JSON.stringify(
    {
      models: [
        {
          name: "Claude Opus 4.1",
          developer: "anthropic",
          modelId: "claude-opus-4-1",
          icon: "",
          officialUrl: "https://docs.anthropic.com/en/docs/about-claude/models/overview",
          group: "claude-opus",
          type: "对话",
          notes: "",
          supportsToolCalling: true,
          supportsVision: true,
          supportsTemperatureControl: true,
          supportsReasoning: true,
          reasoningEffortLevels: ["low", "medium", "high"],
          supportsWebSearch: false,
          inputText: true,
          inputImage: true,
          inputAudio: false,
          inputVideo: false,
          outputText: true,
          outputImage: false,
          outputAudio: false,
          outputVideo: false,
          inputCostPerMTokens: 15,
          outputCostPerMTokens: 75,
          cacheReadCostPerMTokens: null,
          cacheWriteCostPerMTokens: null,
          contextWindow: 200000,
          maxOutputTokens: 32000,
          knowledgeCutoff: "2025-03-01",
          releaseDate: "2025-08-05",
          lastUpdated: "2026-06-30",
          isActive: true,
          showOnHome: true,
        },
      ],
    },
    null,
    2,
  );
}

function getRawItems(parsed: unknown) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { models?: unknown }).models)) {
    return (parsed as { models: unknown[] }).models;
  }
  return null;
}

export function parseModelImportInput(input: string) {
  const errors: ModelImportError[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    return { items: [], errors: [{ index: -1, message: "JSON 格式不正确" }] };
  }

  const rawItems = getRawItems(parsed);
  if (!rawItems) {
    return { items: [], errors: [{ index: -1, message: "JSON 顶层必须是数组，或包含 models 数组" }] };
  }

  const items = rawItems.flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push({ index, message: "模型记录必须是对象" });
      return [];
    }

    const parsedItem = parseModelPayload(item as Record<string, unknown>);
    if (!parsedItem.name) {
      errors.push({ index, message: "模型名称不能为空" });
      return [];
    }

    return [parsedItem];
  });

  return { items, errors };
}
