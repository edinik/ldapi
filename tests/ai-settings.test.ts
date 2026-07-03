import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  maskSecret,
  parseAiSettingsPayload,
  resolveOpenAiCompatibleConfig,
} from "../src/lib/ai-settings";

describe("AI settings helpers", () => {
  it("masks stored API keys without exposing the full value", () => {
    assert.equal(maskSecret(null), "");
    assert.equal(maskSecret("sk-short"), "已配置");
    assert.equal(maskSecret("sk-1234567890abcdef"), "sk-1...cdef");
  });

  it("parses settings form payload and keeps an empty API key as no-change", () => {
    const result = parseAiSettingsPayload({
      baseUrl: " https://api.example.com/v1/ ",
      apiKey: "   ",
      model: " gpt-test ",
    });

    assert.deepEqual(result, {
      baseUrl: "https://api.example.com/v1",
      apiKey: null,
      model: "gpt-test",
    });
  });

  it("resolves database settings before environment variables", () => {
    const result = resolveOpenAiCompatibleConfig(
      {
        AI_BASE_URL: "https://env.example.com/v1",
        AI_API_KEY: "env-key",
        AI_MODEL: "env-model",
      },
      {
        baseUrl: "https://db.example.com/v1",
        apiKey: "db-key",
        model: "db-model",
      },
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.config, {
        baseUrl: "https://db.example.com/v1",
        apiKey: "db-key",
        model: "db-model",
      });
    }
  });

  it("falls back to environment API key when stored API key is empty", () => {
    const result = resolveOpenAiCompatibleConfig(
      {
        AI_API_KEY: "env-key",
      },
      {
        baseUrl: "https://db.example.com/v1",
        apiKey: null,
        model: "db-model",
      },
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.config.apiKey, "env-key");
      assert.equal(result.config.baseUrl, "https://db.example.com/v1");
      assert.equal(result.config.model, "db-model");
    }
  });
});
