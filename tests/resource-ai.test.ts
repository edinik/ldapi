import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildResourceAiPrompt,
  generateResourceAiSuggestion,
  parseResourceAiSuggestionContent,
} from "../src/lib/resource-ai";
import {
  mergeResourceAiSuggestion,
  parseResourceAiRequest,
  parseResourceAiSuggestion,
} from "../src/lib/resource-ai-contract";

describe("resource AI helpers", () => {
  it("normalizes browser input and rejects missing titles or invalid URLs", () => {
    assert.deepEqual(
      parseResourceAiRequest({
        title: "  Example Tool  ",
        githubUrl: "https://github.com/example/tool",
        officialUrl: "https://example.com",
        existingTags: ["AI", " ai ", "Tools"],
      }),
      {
        ok: true,
        value: {
          title: "Example Tool",
          githubUrl: "https://github.com/example/tool",
          officialUrl: "https://example.com/",
          existingTags: ["AI", "Tools"],
        },
      },
    );

    assert.deepEqual(parseResourceAiRequest({ title: " " }), {
      ok: false,
      error: "请先填写资源标题",
    });
    assert.deepEqual(parseResourceAiRequest({ title: "Tool", officialUrl: "file:///tmp/tool" }), {
      ok: false,
      error: "官网地址必须是有效的 HTTP(S) 地址",
    });
    assert.deepEqual(parseResourceAiRequest({ title: "Tool", githubUrl: "https://gitlab.com/example/tool" }), {
      ok: false,
      error: "GitHub 地址必须是有效的 github.com HTTP(S) 地址",
    });
  });

  it("builds a research prompt that prioritizes supplied GitHub and official sources", () => {
    const messages = buildResourceAiPrompt({
      title: "Example Tool",
      githubUrl: "https://github.com/example/tool",
      officialUrl: "https://example.com/",
      existingTags: ["AI", "开源"],
    });

    assert.equal(messages.length, 2);
    assert.match(messages[0].content, /只输出一个 JSON 对象/);
    assert.match(messages[0].content, /无法确认时填 null/);
    assert.match(messages[1].content, /必须先访问并核对/);
    assert.match(messages[1].content, /https:\/\/github\.com\/example\/tool/);
    assert.match(messages[1].content, /https:\/\/example\.com/);
    assert.match(messages[1].content, /AI、开源/);
  });

  it("validates and normalizes generated suggestions", () => {
    const result = parseResourceAiSuggestion({
      description: "  一个用于整理 API 文档的开源工具。  ",
      tags: ["API", "开源", "api", "文档"],
      githubUrl: "https://github.com/example/tool",
      officialUrl: "https://example.com",
      demoUrl: "javascript:alert(1)",
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.value, {
        description: "一个用于整理 API 文档的开源工具。",
        tags: ["API", "开源", "文档"],
        githubUrl: "https://github.com/example/tool",
        officialUrl: "https://example.com/",
        demoUrl: null,
      });
    }

    const nonGithub = parseResourceAiSuggestion({
      description: "一句话简介。",
      tags: ["工具", "开源"],
      githubUrl: "https://gitlab.com/example/tool",
    });
    assert.equal(nonGithub.ok, true);
    if (nonGithub.ok) assert.equal(nonGithub.value.githubUrl, null);
  });

  it("extracts JSON from fenced output and rejects malformed suggestions", () => {
    const result = parseResourceAiSuggestionContent(
      '```json\n{"description":"一句话简介。","tags":["AI","工具"],"githubUrl":null,"officialUrl":null,"demoUrl":null}\n```',
    );
    assert.equal(result.ok, true);

    assert.deepEqual(parseResourceAiSuggestionContent("not json"), {
      ok: false,
      error: "AI 返回内容不是有效 JSON",
    });
    assert.deepEqual(parseResourceAiSuggestion({ description: "一句话简介。", tags: [] }), {
      ok: false,
      error: "AI 返回中缺少足够的有效标签",
    });
  });

  it("calls Chat Completions with research tools and reasoning effort", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const result = await generateResourceAiSuggestion({
      request: {
        title: "Example Tool",
        githubUrl: null,
        officialUrl: null,
        existingTags: ["AI"],
      },
      config: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "secret-key",
        model: "gpt-test",
        reasoningEffort: "high",
      },
      fetcher: async (url, init) => {
        requests.push({ url: String(url), init: init || {} });
        return Response.json({
          choices: [
            {
              message: {
                content:
                  '{"description":"一句话简介。","tags":["AI","工具","开源"],"githubUrl":"https://github.com/example/tool","officialUrl":null,"demoUrl":null}',
              },
            },
          ],
        });
      },
    });

    assert.equal(result.ok, true);
    assert.equal(requests[0].url, "https://api.example.com/v1/chat/completions");
    assert.equal(requests[0].init.method, "POST");
    assert.equal((requests[0].init.headers as Record<string, string>).Authorization, "Bearer secret-key");

    const body = JSON.parse(String(requests[0].init.body));
    assert.equal(body.model, "gpt-test");
    assert.equal(body.reasoning_effort, "high");
    assert.equal(body.stream, true);
    assert.deepEqual(body.stream_options, { include_usage: true });
    assert.deepEqual(body.tools, [
      { type: "code_interpreter" },
      { type: "web_search", enable_image_understanding: true },
      { type: "x_search", enable_image_understanding: true },
    ]);
  });

  it("parses streamed assistant content and omits default reasoning effort", async () => {
    let requestBody: Record<string, unknown> | null = null;
    const result = await generateResourceAiSuggestion({
      request: {
        title: "Example Tool",
        githubUrl: null,
        officialUrl: null,
        existingTags: [],
      },
      config: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "secret-key",
        model: "gpt-test",
        reasoningEffort: null,
      },
      fetcher: async (_url, init) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response(
          [
            'data: {"choices":[{"delta":{"content":"{\\"description\\":\\"一句话简介。\\",\\"tags\\":[\\"工具\\",\\"开源\\"],"}}]}\n\n',
            'data: {"choices":[{"delta":{"content":"\\"githubUrl\\":null,\\"officialUrl\\":null,\\"demoUrl\\":null}"}}]}\n\n',
            "data: [DONE]\n\n",
          ].join(""),
          { status: 200, headers: { "content-type": "text/event-stream" } },
        );
      },
    });

    assert.equal(result.ok, true);
    assert.ok(requestBody);
    assert.equal(Object.prototype.hasOwnProperty.call(requestBody, "reasoning_effort"), false);
  });

  it("returns safe upstream errors without response bodies", async () => {
    const result = await generateResourceAiSuggestion({
      request: {
        title: "Example Tool",
        githubUrl: null,
        officialUrl: null,
        existingTags: [],
      },
      config: {
        baseUrl: "https://api.example.com/v1",
        apiKey: "secret-key",
        model: "gpt-test",
      },
      fetcher: async () => new Response('{"secret":"provider details"}', { status: 403 }),
    });

    assert.deepEqual(result, { ok: false, error: "AI 请求失败：HTTP 403" });
  });

  it("fills only empty fields and leaves generated tags as candidates", () => {
    const suggestion = {
      description: "AI description",
      tags: ["AI", "Open Source", "Tools"],
      githubUrl: "https://github.com/example/tool",
      officialUrl: "https://example.com/",
      demoUrl: "https://demo.example.com/",
    };
    const result = mergeResourceAiSuggestion(
      {
        description: "User description",
        githubUrl: "",
        officialUrl: "https://custom.example.com",
        demoUrl: "  ",
        selectedTags: ["ai", "Existing"],
      },
      suggestion,
    );

    assert.deepEqual(result.values, {
      description: "User description",
      githubUrl: "https://github.com/example/tool",
      officialUrl: "https://custom.example.com",
      demoUrl: "https://demo.example.com/",
    });
    assert.deepEqual(result.filledFields, ["githubUrl", "demoUrl"]);
    assert.deepEqual(result.candidateTags, ["Open Source", "Tools"]);
  });
});
