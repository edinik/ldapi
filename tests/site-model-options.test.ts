import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterAvailableSiteModels, type AvailableSiteModelOption } from "../src/lib/site-model-options";

const options: AvailableSiteModelOption[] = [
  { name: "Claude Opus 4.1", developer: "anthropic", modelId: "claude-opus-4-1" },
  { name: "GPT-5.1", developer: "openai", modelId: "gpt-5.1" },
  { name: "DeepSeek V3.2", developer: "deepseek", modelId: "deepseek-v3.2" },
];

describe("site model options", () => {
  it("filters models by name, developer, or model id", () => {
    assert.deepEqual(
      filterAvailableSiteModels(options, "opus", []).map((item) => item.name),
      ["Claude Opus 4.1"],
    );
    assert.deepEqual(
      filterAvailableSiteModels(options, "openai", []).map((item) => item.name),
      ["GPT-5.1"],
    );
    assert.deepEqual(
      filterAvailableSiteModels(options, "deepseek-v3", []).map((item) => item.name),
      ["DeepSeek V3.2"],
    );
  });

  it("excludes models already selected by site", () => {
    assert.deepEqual(
      filterAvailableSiteModels(options, "", ["GPT-5.1"]).map((item) => item.name),
      ["Claude Opus 4.1", "DeepSeek V3.2"],
    );
  });
});
