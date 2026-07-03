import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildModelImportPrompt,
  extractJsonContent,
  generateModelImportContent,
  getOpenAiCompatibleConfig,
  validateGeneratedImportContent,
} from "../src/lib/model-import-ai";
import { createModelImportTemplate } from "../src/lib/model-import";

describe("AI model import helpers", () => {
  it("builds OpenAI-compatible chat messages with the requested target and JSON template", () => {
    const template = createModelImportTemplate();
    const messages = buildModelImportPrompt({
      query: "DeepSeek",
      template,
      today: "2026-07-03",
    });

    assert.equal(messages.length, 2);
    assert.equal(messages[0].role, "system");
    assert.match(messages[0].content, /只输出 JSON/);
    assert.equal(messages[1].role, "user");
    assert.match(messages[1].content, /DeepSeek/);
    assert.match(messages[1].content, /2026-07-03/);
    assert.match(messages[1].content, /"models"/);
  });

  it("extracts JSON from plain text or fenced AI responses", () => {
    assert.equal(extractJsonContent('{"models":[{"name":"GPT"}]}'), '{"models":[{"name":"GPT"}]}');
    assert.equal(
      extractJsonContent('```json\n{"models":[{"name":"Claude"}]}\n```'),
      '{"models":[{"name":"Claude"}]}',
    );
    assert.equal(
      extractJsonContent('Here is the JSON:\n{"models":[{"name":"DeepSeek"}]}\nDone.'),
      '{"models":[{"name":"DeepSeek"}]}',
    );
  });

  it("validates extracted import content with the existing import parser", () => {
    const result = validateGeneratedImportContent('```json\n{"models":[{"name":"GPT-4.1","developer":"openai"}]}\n```');

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.content, /GPT-4\.1/);
    }
  });

  it("reports missing OpenAI-compatible configuration", () => {
    const result = getOpenAiCompatibleConfig({});

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /AI_API_KEY/);
      assert.match(result.error, /AI_MODEL/);
    }
  });

  it("calls an OpenAI-compatible endpoint and returns validated import content", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const result = await generateModelImportContent({
      query: "OpenAI GPT-4.1",
      template: createModelImportTemplate(),
      today: "2026-07-03",
      config: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "test-key",
        model: "gpt-test",
      },
      fetcher: async (url, init) => {
        requests.push({ url: String(url), init: init || {} });
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '{"models":[{"name":"GPT-4.1","developer":"openai"}]}',
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.content, /GPT-4\.1/);
    }
    assert.equal(requests[0].url, "https://api.example.com/v1/chat/completions");
    assert.equal(requests[0].init.method, "POST");
    assert.equal((requests[0].init.headers as Record<string, string>).Authorization, "Bearer test-key");
    assert.match(String(requests[0].init.body), /gpt-test/);
  });
});
