import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveApiSession } from "../src/lib/api-session";

describe("API session resolution", () => {
  it("rejects a missing session cookie without validating it", async () => {
    let validated = false;
    const result = await resolveApiSession(undefined, async () => {
      validated = true;
      return { userId: 1 };
    });

    assert.deepEqual(result, { ok: false, error: "未登录" });
    assert.equal(validated, false);
  });

  it("rejects an invalid or expired session", async () => {
    const result = await resolveApiSession("expired", async () => null);

    assert.deepEqual(result, { ok: false, error: "会话过期" });
  });

  it("returns the validated session", async () => {
    const session = { id: "session-id", userId: 7 };
    const result = await resolveApiSession("session-id", async () => session);

    assert.deepEqual(result, { ok: true, session });
  });
});
