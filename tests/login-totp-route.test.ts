import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { authenticateLogin, type LoginDependencies } from "../src/lib/auth-login";

function createDependencies(overrides: Partial<LoginDependencies> = {}): LoginDependencies {
  return {
    turnstileRequired: false,
    verifyTurnstileToken: async () => true,
    getAdminUser: async () => ({ id: 7, passwordHash: "stored", totpSecret: "SECRET" }),
    verifyPassword: () => true,
    verifyTotpCode: () => true,
    createSession: async () => "session-id",
    ...overrides,
  };
}

describe("login authentication", () => {
  it("requires a valid TOTP code when the admin user has a TOTP secret", async () => {
    const result = await authenticateLogin(
      { username: "admin", password: "password", totpCode: "000000" },
      createDependencies({ verifyTotpCode: () => false }),
    );

    assert.deepEqual(result, { ok: false, status: 401, error: "验证码错误" });
  });

  it("creates a session after all login checks pass", async () => {
    const createdFor: number[] = [];
    const result = await authenticateLogin(
      { username: "admin", password: "password", totpCode: "123456" },
      createDependencies({
        createSession: async (userId) => {
          createdFor.push(userId);
          return "new-session";
        },
      }),
    );

    assert.deepEqual(result, { ok: true, sessionId: "new-session" });
    assert.deepEqual(createdFor, [7]);
  });
});
