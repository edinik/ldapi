import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatReasoningEffortLevels,
  getSiteModelCapabilityLabels,
  resolveSiteModelCapabilities,
} from "../src/lib/site-model-capabilities";

const modelDefaults = {
  supportsToolCalling: true,
  supportsVision: true,
  supportsTemperatureControl: false,
  supportsReasoning: true,
  supportsWebSearch: false,
  reasoningEffortLevels: ["low", "medium", "high"],
};

describe("resolveSiteModelCapabilities", () => {
  it("inherits model capabilities when site overrides are null", () => {
    assert.deepEqual(
      resolveSiteModelCapabilities(modelDefaults, {
        supportsToolCallingOverride: null,
        supportsVisionOverride: null,
        supportsTemperatureControlOverride: null,
        supportsReasoningOverride: null,
        supportsWebSearchOverride: null,
        reasoningEffortLevelsOverride: null,
      }),
      modelDefaults,
    );
  });

  it("allows a site to explicitly disable or enable model capabilities", () => {
    assert.deepEqual(
      resolveSiteModelCapabilities(modelDefaults, {
        supportsToolCallingOverride: false,
        supportsVisionOverride: null,
        supportsTemperatureControlOverride: true,
        supportsReasoningOverride: false,
        supportsWebSearchOverride: true,
        reasoningEffortLevelsOverride: ["none", "minimal"],
      }),
      {
        supportsToolCalling: false,
        supportsVision: true,
        supportsTemperatureControl: true,
        supportsReasoning: false,
        supportsWebSearch: true,
        reasoningEffortLevels: [],
      },
    );
  });

  it("uses site reasoning effort override when reasoning stays enabled", () => {
    assert.deepEqual(
      resolveSiteModelCapabilities(modelDefaults, {
        supportsToolCallingOverride: null,
        supportsVisionOverride: null,
        supportsTemperatureControlOverride: null,
        supportsReasoningOverride: true,
        supportsWebSearchOverride: null,
        reasoningEffortLevelsOverride: ["none", "low"],
      }),
      {
        ...modelDefaults,
        reasoningEffortLevels: ["none", "low"],
      },
    );
  });

  it("returns display labels for resolved capabilities", () => {
    assert.deepEqual(
      getSiteModelCapabilityLabels({
        supportsToolCalling: true,
        supportsVision: true,
        supportsTemperatureControl: false,
        supportsReasoning: true,
        supportsWebSearch: true,
        reasoningEffortLevels: ["low", "medium", "high"],
      }),
      ["工具调用", "视觉", "推理: low-high", "联网"],
    );
  });

  it("keeps plain reasoning label when reasoning is supported but effort is not configurable", () => {
    assert.deepEqual(
      getSiteModelCapabilityLabels({
        supportsToolCalling: false,
        supportsVision: false,
        supportsTemperatureControl: false,
        supportsReasoning: true,
        supportsWebSearch: false,
        reasoningEffortLevels: [],
      }),
      ["推理"],
    );
  });

  it("returns an empty label list when no capabilities are marked", () => {
    assert.deepEqual(
      getSiteModelCapabilityLabels({
        supportsToolCalling: false,
        supportsVision: false,
        supportsTemperatureControl: false,
        supportsReasoning: false,
        supportsWebSearch: false,
        reasoningEffortLevels: [],
      }),
      [],
    );
  });

  it("formats non-contiguous reasoning effort levels compactly", () => {
    assert.equal(formatReasoningEffortLevels(["none", "low", "high"]), "none/low/high");
    assert.equal(formatReasoningEffortLevels(["none", "minimal", "low", "medium", "high", "xhigh", "max"]), "none-max");
  });
});
