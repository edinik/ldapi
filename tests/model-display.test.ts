import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatCost,
  formatTokenLimit,
  filterModels,
  getCapabilityLabels,
  getHomepageModels,
  type ModelDisplayItem,
} from "../src/lib/model-display";

const models: ModelDisplayItem[] = [
  {
    id: 1,
    name: "Claude Opus 4.8",
    developer: "anthropic",
    modelId: "claude-opus-4-8",
    icon: "Claude",
    officialUrl: "https://example.com/claude-opus",
    group: "claude-opus",
    type: "对话",
    notes: null,
    supportsToolCalling: true,
    supportsVision: true,
    supportsTemperatureControl: true,
    supportsReasoning: false,
    reasoningEffortLevels: null,
    supportsWebSearch: true,
    inputText: true,
    inputImage: true,
    inputAudio: false,
    inputVideo: false,
    outputText: true,
    outputImage: false,
    outputAudio: false,
    outputVideo: false,
    inputCostPerMTokens: 5,
    outputCostPerMTokens: 25,
    cacheReadCostPerMTokens: 0.5,
    cacheWriteCostPerMTokens: 6.25,
    contextWindow: 1000000,
    maxOutputTokens: 128000,
    knowledgeCutoff: null,
    releaseDate: "2026-05-28",
    lastUpdated: "2026-05-28",
    isActive: true,
    showOnHome: true,
  },
  {
    id: 2,
    name: "Hidden Model",
    developer: "example",
    modelId: "hidden-model",
    icon: null,
    officialUrl: null,
    group: null,
    type: null,
    notes: null,
    supportsToolCalling: false,
    supportsVision: false,
    supportsTemperatureControl: false,
    supportsReasoning: false,
    reasoningEffortLevels: null,
    supportsWebSearch: false,
    inputText: true,
    inputImage: false,
    inputAudio: false,
    inputVideo: false,
    outputText: true,
    outputImage: false,
    outputAudio: false,
    outputVideo: false,
    inputCostPerMTokens: null,
    outputCostPerMTokens: null,
    cacheReadCostPerMTokens: null,
    cacheWriteCostPerMTokens: null,
    contextWindow: null,
    maxOutputTokens: null,
    knowledgeCutoff: null,
    releaseDate: null,
    lastUpdated: null,
    isActive: true,
    showOnHome: false,
  },
];

describe("model display helpers", () => {
  it("formats large token limits using compact K and M suffixes", () => {
    assert.equal(formatTokenLimit(128000), "128K");
    assert.equal(formatTokenLimit(1000000), "1M");
    assert.equal(formatTokenLimit(null), "未填写");
  });

  it("formats model token costs without unnecessary decimal places", () => {
    assert.equal(formatCost(5), "$5 / M tokens");
    assert.equal(formatCost(6.25), "$6.25 / M tokens");
    assert.equal(formatCost(null), "未填写");
  });

  it("returns capability labels in the configured display order", () => {
    assert.deepEqual(getCapabilityLabels(models[0]), ["工具调用", "视觉", "温度", "联网"]);
  });

  it("only exposes active models selected for homepage display", () => {
    assert.deepEqual(
      getHomepageModels(models).map((model) => model.id),
      [1],
    );
  });

  it("filters homepage models by text across name, model id, developer, and group", () => {
    assert.deepEqual(
      filterModels(models, { query: "opus", developer: "", capabilities: [] }).map((model) => model.id),
      [1],
    );
    assert.deepEqual(
      filterModels(models, { query: "example", developer: "", capabilities: [] }).map((model) => model.id),
      [2],
    );
  });

  it("filters models by developer and all selected capabilities", () => {
    assert.deepEqual(
      filterModels(models, {
        query: "",
        developer: "anthropic",
        capabilities: ["supportsVision", "supportsTemperatureControl", "supportsWebSearch"],
      }).map((model) => model.id),
      [1],
    );
    assert.deepEqual(
      filterModels(models, { query: "", developer: "anthropic", capabilities: ["supportsReasoning"] }).map((model) => model.id),
      [],
    );
  });
});
