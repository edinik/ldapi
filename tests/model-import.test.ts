import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createModelImportTemplate, parseModelImportInput } from "../src/lib/model-import";

describe("model import helpers", () => {
  it("provides an AI-friendly JSON template that can be parsed", () => {
    const template = createModelImportTemplate();
    const parsed = JSON.parse(template);

    assert.ok(Array.isArray(parsed.models));
    assert.equal(parsed.models[0].name, "Claude Opus 4.1");
    assert.equal(parsed.models[0].notes, "");
    assert.equal(parsed.models[0].officialUrl, "https://docs.anthropic.com/en/docs/about-claude/models/overview");
    assert.equal(parsed.models[0].supportsReasoning, true);
  });

  it("accepts either a raw array or an object with a models array", () => {
    const asArray = parseModelImportInput(JSON.stringify([{ name: "Model A", officialUrl: "https://example.com/pricing" }]));
    const asObject = parseModelImportInput(JSON.stringify({ models: [{ name: "Model B" }] }));

    assert.equal(asArray.items[0].name, "Model A");
    assert.equal(asArray.items[0].officialUrl, "https://example.com/pricing");
    assert.equal(asObject.items[0].name, "Model B");
    assert.deepEqual(asArray.errors, []);
    assert.deepEqual(asObject.errors, []);
  });

  it("returns row-level errors for invalid model records", () => {
    const result = parseModelImportInput(JSON.stringify({ models: [{ developer: "openai" }] }));

    assert.equal(result.items.length, 0);
    assert.deepEqual(result.errors, [{ index: 0, message: "模型名称不能为空" }]);
  });

  it("reports invalid JSON with a friendly error", () => {
    const result = parseModelImportInput("{not json");

    assert.equal(result.items.length, 0);
    assert.equal(result.errors[0]?.message, "JSON 格式不正确");
  });
});
