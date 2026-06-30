import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { developerIconOptions, getDeveloperIconPath, getLobeIconUrl, lobeIconOptions, normalizeDeveloperName } from "../src/lib/developer-icons";

describe("developer icon helpers", () => {
  it("normalizes developer names for stable icon lookup", () => {
    assert.equal(normalizeDeveloperName(" Anthropic "), "anthropic");
    assert.equal(normalizeDeveloperName("Ali Baba"), "alibaba");
    assert.equal(normalizeDeveloperName(null), "");
  });

  it("returns lobe-icons CDN paths for known developers", () => {
    assert.equal(getDeveloperIconPath("anthropic"), "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/anthropic.svg");
    assert.equal(getDeveloperIconPath("Google"), "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg");
    assert.equal(getDeveloperIconPath("OpenAI"), "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg");
    assert.equal(getDeveloperIconPath("xiaomi"), "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/xiaomimimo.svg");
    assert.equal(getDeveloperIconPath("unknown"), null);
  });

  it("exposes icon options for admin selection", () => {
    assert.ok(developerIconOptions.some((option) => option.developer === "anthropic"));
    assert.ok(developerIconOptions.every((option) => option.value.startsWith("https://unpkg.com/@lobehub/icons-static-svg")));
  });

  it("exposes all lobe-icons static SVG options for admin selection", () => {
    assert.ok(lobeIconOptions.length > developerIconOptions.length);
    assert.ok(lobeIconOptions.some((option) => option.label === "claude"));
    assert.equal(getLobeIconUrl("openai"), "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg");
  });
});
