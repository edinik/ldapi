import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterSites, type DirectorySite } from "../src/lib/site-directory-filter";

const sites: DirectorySite[] = [
  {
    id: 1,
    name: "Alpha Claude",
    url: "https://alpha.example.com",
    description: "Supports Claude workflows",
    models: ["Claude 4 Sonnet", "GPT-4.1"],
    hasCheckIn: true,
    autoCheckIn: false,
    supportsClaudeCode: true,
    supportsCodex: false,
    supportsImmersiveTranslation: false,
    hasRateLimit: false,
    hasActivityRequirement: false,
  },
  {
    id: 2,
    name: "Beta Codex",
    url: "https://beta.example.com",
    description: "Codex focused site",
    models: ["GPT-5", "Gemini 2.5 Pro"],
    hasCheckIn: true,
    autoCheckIn: true,
    supportsClaudeCode: false,
    supportsCodex: true,
    supportsImmersiveTranslation: true,
    hasRateLimit: true,
    hasActivityRequirement: false,
  },
  {
    id: 3,
    name: "Gamma Archive",
    url: "https://gamma.example.com",
    description: null,
    models: ["DeepSeek V3"],
    hasCheckIn: false,
    autoCheckIn: false,
    supportsClaudeCode: false,
    supportsCodex: false,
    supportsImmersiveTranslation: false,
    hasRateLimit: false,
    hasActivityRequirement: true,
  },
];

describe("filterSites", () => {
  it("matches search text across name, url, description, and models", () => {
    assert.deepEqual(
      filterSites(sites, { query: "gemini", capabilities: [], model: "" }).map((site) => site.id),
      [2],
    );
    assert.deepEqual(
      filterSites(sites, { query: "archive", capabilities: [], model: "" }).map((site) => site.id),
      [3],
    );
  });

  it("requires all selected capabilities to be present", () => {
    assert.deepEqual(
      filterSites(sites, { query: "", capabilities: ["hasCheckIn", "supportsCodex"], model: "" }).map((site) => site.id),
      [2],
    );
  });

  it("filters by an exact model name when selected", () => {
    assert.deepEqual(
      filterSites(sites, { query: "", capabilities: [], model: "Claude 4 Sonnet" }).map((site) => site.id),
      [1],
    );
  });
});
