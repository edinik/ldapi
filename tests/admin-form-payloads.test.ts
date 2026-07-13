import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSiteFormPayload } from "../src/lib/admin/forms/site-form-payload";
import { buildModelFormPayload } from "../src/lib/admin/forms/model-form-payload";
import { buildResourceFormPayload } from "../src/lib/admin/forms/resource-form-payload";

function createFormData(entries: Array<[string, string]>) {
  const form = new FormData();
  entries.forEach(([name, value]) => form.append(name, value));
  return form;
}

describe("admin form payloads", () => {
  it("builds the existing site API payload", () => {
    const siteModels = [{ name: "Claude", rating: "顶级" }];
    const form = createFormData([
      ["name", "Example"],
      ["url", "https://example.com"],
      ["description", ""],
      ["adminProfileUrl", "https://linux.do/u/admin"],
      ["hasCheckIn", "on"],
      ["supportsCodex", "on"],
      ["rateLimitInfo", "3/min"],
      ["isActive", "on"],
    ]);

    assert.deepEqual(buildSiteFormPayload(form, siteModels), {
      name: "Example",
      url: "https://example.com",
      description: null,
      adminProfileUrl: "https://linux.do/u/admin",
      discussionUrl: null,
      hasCheckIn: true,
      autoCheckIn: false,
      checkInUrl: null,
      supportsClaudeCode: false,
      supportsCodex: true,
      supportsImmersiveTranslation: false,
      welfareUrl: null,
      statusUrl: null,
      hasRateLimit: false,
      rateLimitInfo: "3/min",
      hasActivityRequirement: false,
      activityRequirementInfo: null,
      isActive: true,
      siteModels,
    });
  });

  it("builds the existing model API payload including repeated values", () => {
    const form = createFormData([
      ["developer", "anthropic"],
      ["name", "Claude"],
      ["reasoningEffortLevels", "low"],
      ["reasoningEffortLevels", "high"],
      ["supportsReasoning", "on"],
      ["inputText", "on"],
      ["outputText", "on"],
      ["inputCostPerMTokens", "5"],
      ["isActive", "on"],
    ]);

    assert.deepEqual(buildModelFormPayload(form), {
      developer: "anthropic",
      modelId: null,
      name: "Claude",
      icon: null,
      officialUrl: null,
      group: null,
      type: null,
      notes: null,
      supportsToolCalling: false,
      supportsVision: false,
      supportsTemperatureControl: false,
      supportsReasoning: true,
      reasoningEffortLevels: ["low", "high"],
      supportsWebSearch: false,
      inputText: true,
      inputImage: false,
      inputAudio: false,
      inputVideo: false,
      outputText: true,
      outputImage: false,
      outputAudio: false,
      outputVideo: false,
      inputCostPerMTokens: "5",
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
    });
  });

  it("builds the existing resource API payload with controlled type and tags", () => {
    const form = createFormData([
      ["title", "Guide"],
      ["description", "A useful guide"],
      ["linuxdoUrl", "https://linux.do/t/topic/1"],
      ["recommendation", ""],
      ["isActive", "on"],
    ]);

    assert.deepEqual(buildResourceFormPayload(form, { type: "tutorial", tags: ["Docker", "AI"] }), {
      type: "tutorial",
      title: "Guide",
      description: "A useful guide",
      tags: ["Docker", "AI"],
      githubUrl: null,
      officialUrl: null,
      demoUrl: null,
      linuxdoUrl: "https://linux.do/t/topic/1",
      recommendation: null,
      isActive: true,
    });
  });
});
