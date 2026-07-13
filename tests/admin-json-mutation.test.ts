import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { requestJson, type Fetcher } from "../src/lib/admin/json-mutation";

describe("admin JSON mutation", () => {
  it("serializes JSON bodies with the existing request headers", async () => {
    const calls: Array<[RequestInfo | URL, RequestInit | undefined]> = [];
    const fetcher = (async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push([url, init]);
      return new Response(null, { status: 201 });
    }) as Fetcher;

    const response = await requestJson("/api/models", {
      method: "POST",
      body: { name: "Claude" },
      fetcher,
    });

    assert.equal(response.status, 201);
    assert.deepEqual(calls, [
      [
        "/api/models",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Claude" }),
        },
      ],
    ]);
  });

  it("keeps DELETE requests bodyless", async () => {
    let options: RequestInit | undefined;
    const fetcher = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      options = init;
      return new Response(null, { status: 200 });
    }) as Fetcher;

    await requestJson("/api/resources/1", { method: "DELETE", fetcher });
    assert.deepEqual(options, { method: "DELETE" });
  });
});
