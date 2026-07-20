import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  maskSecret,
  parseAiSettingsPayload,
  resolveOpenAiCompatibleConnection,
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
      reasoningEffort: " high ",
    });

    assert.deepEqual(result, {
      baseUrl: "https://api.example.com/v1",
      apiKey: null,
      model: "gpt-test",
      reasoningEffort: "high",
    });
  });

  it("normalizes unsupported or empty reasoning effort to the provider default", () => {
    assert.equal(parseAiSettingsPayload({ reasoningEffort: "turbo" }).reasoningEffort, null);
    assert.equal(parseAiSettingsPayload({ reasoningEffort: "" }).reasoningEffort, null);
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
        reasoningEffort: "xhigh",
      },
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.config, {
        baseUrl: "https://db.example.com/v1",
        apiKey: "db-key",
        model: "db-model",
        reasoningEffort: "xhigh",
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
        reasoningEffort: null,
      },
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.config.apiKey, "env-key");
      assert.equal(result.config.baseUrl, "https://db.example.com/v1");
      assert.equal(result.config.model, "db-model");
      assert.equal(result.config.reasoningEffort, null);
    }
  });

  it("resolves submitted connection values before stored and environment settings", () => {
    const result = resolveOpenAiCompatibleConnection(
      {
        AI_BASE_URL: "https://env.example.com/v1",
        AI_API_KEY: "env-key",
      },
      {
        baseUrl: "https://db.example.com/v1",
        apiKey: "db-key",
        model: "db-model",
        reasoningEffort: null,
      },
      {
        baseUrl: "https://form.example.com/v1/",
        apiKey: "form-key",
      },
    );

    assert.deepEqual(result, {
      ok: true,
      connection: {
        baseUrl: "https://form.example.com/v1",
        apiKey: "form-key",
      },
    });
  });
});
