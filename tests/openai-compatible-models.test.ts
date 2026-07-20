import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  listOpenAiCompatibleModels,
  parseOpenAiCompatibleModelList,
} from "../src/lib/openai-compatible-models";

describe("OpenAI-compatible model listing", () => {
  it("normalizes, deduplicates, and sorts model IDs", () => {
    assert.deepEqual(
      parseOpenAiCompatibleModelList({
        data: [
          { id: " model-z " },
          { id: "model-a" },
          { id: "model-z" },
          { id: "" },
          { id: 123 },
          null,
        ],
      }),
      { ok: true, models: ["model-a", "model-z"] },
    );
  });

  it("requests the models endpoint with server-side authorization", async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const result = await listOpenAiCompatibleModels({
      baseUrl: "https://api.example.com/v1",
      apiKey: "secret-key",
      fetcher: async (url, init) => {
        requests.push({ url: String(url), init: init || {} });
        return Response.json({ data: [{ id: "gpt-test" }] });
      },
    });

    assert.deepEqual(result, { ok: true, models: ["gpt-test"] });
    assert.equal(requests[0].url, "https://api.example.com/v1/models");
    assert.equal(requests[0].init.method, "GET");
    assert.equal((requests[0].init.headers as Record<string, string>).Authorization, "Bearer secret-key");
    assert.equal((requests[0].init.headers as Record<string, string>).Accept, "application/json");
  });

  it("returns safe errors for incompatible, invalid, and failed responses", async () => {
    assert.deepEqual(parseOpenAiCompatibleModelList({ models: [] }), {
      ok: false,
      error: "模型列表响应格式不兼容",
    });

    const invalidJson = await listOpenAiCompatibleModels({
      baseUrl: "https://api.example.com/v1",
      apiKey: "secret-key",
      fetcher: async () => new Response("not-json", { status: 200 }),
    });
    assert.deepEqual(invalidJson, { ok: false, error: "模型列表返回的不是有效 JSON" });

    const upstreamFailure = await listOpenAiCompatibleModels({
      baseUrl: "https://api.example.com/v1",
      apiKey: "secret-key",
      fetcher: async () => new Response("upstream-secret-body", { status: 403 }),
    });
    assert.deepEqual(upstreamFailure, { ok: false, error: "模型列表拉取失败：HTTP 403" });
    assert.doesNotMatch(upstreamFailure.error, /secret/i);

    const networkFailure = await listOpenAiCompatibleModels({
      baseUrl: "https://api.example.com/v1",
      apiKey: "secret-key",
      fetcher: async () => {
        throw new Error("network down with secret-key");
      },
    });
    assert.deepEqual(networkFailure, {
      ok: false,
      error: "模型列表拉取失败，请检查服务地址和网络后重试",
    });
  });
});
