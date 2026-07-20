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
        reasoningEffort: "high",
      },
      fetcher: async (url, init) => {
        requests.push({ url: String(url), init: init || {} });
        return new Response(
          JSON.stringify({
            model: "gpt-test-2026-07-03",
            choices: [
              {
                message: {
                  content: '{"models":[{"name":"GPT-4.1","developer":"openai"}]}',
                },
              },
            ],
            usage: {
              prompt_tokens: 120,
              completion_tokens: 80,
              total_tokens: 200,
              prompt_tokens_details: { cached_tokens: 40 },
              completion_tokens_details: { reasoning_tokens: 25 },
            },
          }),
          { status: 200 },
        );
      },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.content, /GPT-4\.1/);
      assert.deepEqual(result.metadata, {
        requestedModel: "gpt-test",
        responseModel: "gpt-test-2026-07-03",
        usage: {
          inputTokens: 120,
          outputTokens: 80,
          cachedTokens: 40,
          reasoningTokens: 25,
          totalTokens: 200,
        },
      });
    }
    assert.equal(requests[0].url, "https://api.example.com/v1/chat/completions");
    assert.equal(requests[0].init.method, "POST");
    assert.equal((requests[0].init.headers as Record<string, string>).Authorization, "Bearer test-key");
    assert.equal((requests[0].init.headers as Record<string, string>).Accept, "text/event-stream");

    const requestBody = JSON.parse(String(requests[0].init.body));
    assert.equal(requestBody.model, "gpt-test");
    assert.equal(requestBody.reasoning_effort, "high");
    assert.equal(requestBody.stream, true);
    assert.deepEqual(requestBody.stream_options, { include_usage: true });
    assert.deepEqual(requestBody.tools, [
      { type: "code_interpreter" },
      { type: "web_search", enable_image_understanding: true },
      { type: "x_search", enable_image_understanding: true },
    ]);
  });

  it("parses streamed chat completion chunks before validating import content", async () => {
    const result = await generateModelImportContent({
      query: "OpenAI GPT-4.1",
      template: createModelImportTemplate(),
      today: "2026-07-03",
      config: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "test-key",
        model: "gpt-test",
      },
      fetcher: async () =>
        new Response(
          [
            'data: {"model":"gpt-stream-actual","choices":[{"delta":{"content":"{\\"models\\":["}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"{\\"name\\":\\"GPT-4.1\\",\\"developer\\":\\"openai\\"}"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"]}"}}]}\n\n',
            'data: {"model":"gpt-stream-actual","choices":[],"usage":{"prompt_tokens":90,"completion_tokens":35,"total_tokens":125,"prompt_tokens_details":{"cached_tokens":20},"completion_tokens_details":{"reasoning_tokens":10}}}\n\n',
            "data: [DONE]\n\n",
          ].join(""),
          {
            status: 200,
            headers: { "content-type": "text/event-stream" },
          },
        ),
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.content, '{"models":[{"name":"GPT-4.1","developer":"openai"}]}');
      assert.deepEqual(result.metadata, {
        requestedModel: "gpt-test",
        responseModel: "gpt-stream-actual",
        usage: {
          inputTokens: 90,
          outputTokens: 35,
          cachedTokens: 20,
          reasoningTokens: 10,
          totalTokens: 125,
        },
      });
    }
  });

  it("omits reasoning_effort when the provider default is selected", async () => {
    let requestBody: Record<string, unknown> | null = null;
    const result = await generateModelImportContent({
      query: "OpenAI GPT-4.1",
      template: createModelImportTemplate(),
      today: "2026-07-03",
      config: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "test-key",
        model: "gpt-test",
        reasoningEffort: null,
      },
      fetcher: async (_url, init) => {
        requestBody = JSON.parse(String(init?.body));
        return Response.json({
          choices: [
            {
              message: {
                content: '{"models":[{"name":"GPT-4.1","developer":"openai"}]}',
              },
            },
          ],
        });
      },
    });

    assert.equal(result.ok, true);
    assert.ok(requestBody);
    assert.equal(Object.prototype.hasOwnProperty.call(requestBody, "reasoning_effort"), false);
  });

  it("normalizes compatible usage fields and ignores invalid token values", async () => {
    const result = await generateModelImportContent({
      query: "Claude",
      template: createModelImportTemplate(),
      today: "2026-07-03",
      config: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "test-key",
        model: "claude-requested",
      },
      fetcher: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '{"models":[{"name":"Claude","developer":"anthropic"}]}',
                },
              },
            ],
            usage: {
              prompt_tokens: -1,
              input_tokens: 150,
              completion_tokens: "invalid",
              output_tokens: 45,
              cached_tokens: "invalid",
              cache_read_input_tokens: 50,
              cache_creation_input_tokens: 5,
              reasoning_tokens: 12,
              total_tokens: "invalid",
            },
          }),
          { status: 200 },
        ),
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.metadata.responseModel, null);
      assert.deepEqual(result.metadata.usage, {
        inputTokens: 150,
        outputTokens: 45,
        cachedTokens: 55,
        reasoningTokens: 12,
        totalTokens: null,
      });
    }
  });
});
