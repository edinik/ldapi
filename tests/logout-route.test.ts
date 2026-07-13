import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clearAdminSession, loginPath } from "../src/lib/auth-logout";

describe("logout", () => {
  it("deletes the active session and returns the login redirect path", async () => {
    const deleted: string[] = [];
    const redirectPath = await clearAdminSession("session-id", async (sessionId) => {
      deleted.push(sessionId);
    });

    assert.deepEqual(deleted, ["session-id"]);
    assert.equal(redirectPath, loginPath);
  });

  it("still returns the login path when no session cookie exists", async () => {
    let called = false;
    const redirectPath = await clearAdminSession(undefined, async () => {
      called = true;
    });

    assert.equal(called, false);
    assert.equal(redirectPath, "/login");
  });
});
