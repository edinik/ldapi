import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  reauthenticateBackup,
  type BackupAuthDependencies,
} from "../src/lib/backup-auth";

function createDependencies(
  overrides: Partial<BackupAuthDependencies> = {},
): BackupAuthDependencies {
  return {
    getAdminUserById: async () => ({
      passwordHash: "stored-hash",
      totpSecret: null,
    }),
    verifyPassword: () => true,
    verifyTotpCode: () => true,
    ...overrides,
  };
}

describe("backup reauthentication", () => {
  it("requires a non-empty password before loading the user", async () => {
    let loaded = false;
    const result = await reauthenticateBackup(
      7,
      { password: "" },
      createDependencies({
        getAdminUserById: async () => {
          loaded = true;
          return null;
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 400,
      error: "请输入当前管理员密码",
    });
    assert.equal(loaded, false);
  });

  it("rejects a session whose admin user no longer exists", async () => {
    const result = await reauthenticateBackup(
      7,
      { password: "password" },
      createDependencies({ getAdminUserById: async () => null }),
    );

    assert.deepEqual(result, { ok: false, status: 401, error: "会话过期" });
  });

  it("rejects an incorrect password before checking TOTP", async () => {
    let totpChecked = false;
    const result = await reauthenticateBackup(
      7,
      { password: "wrong", totpCode: "123456" },
      createDependencies({
        getAdminUserById: async () => ({
          passwordHash: "stored-hash",
          totpSecret: "SECRET",
        }),
        verifyPassword: () => false,
        verifyTotpCode: () => {
          totpChecked = true;
          return true;
        },
      }),
    );

    assert.deepEqual(result, {
      ok: false,
      status: 403,
      error: "管理员密码不正确",
    });
    assert.equal(totpChecked, false);
  });

  it("allows password-only reauthentication when TOTP is disabled", async () => {
    const result = await reauthenticateBackup(
      7,
      { password: "password" },
      createDependencies(),
    );

    assert.deepEqual(result, { ok: true });
  });

  it("requires and validates TOTP when it is enabled", async () => {
    const dependencies = createDependencies({
      getAdminUserById: async () => ({
        passwordHash: "stored-hash",
        totpSecret: "SECRET",
      }),
      verifyTotpCode: (_secret, code) => code === "123456",
    });

    assert.deepEqual(
      await reauthenticateBackup(7, { password: "password" }, dependencies),
      { ok: false, status: 400, error: "请输入 TOTP 验证码" },
    );
    assert.deepEqual(
      await reauthenticateBackup(
        7,
        { password: "password", totpCode: "000000" },
        dependencies,
      ),
      { ok: false, status: 403, error: "TOTP 验证码不正确" },
    );
    assert.deepEqual(
      await reauthenticateBackup(
        7,
        { password: "password", totpCode: "123456" },
        dependencies,
      ),
      { ok: true },
    );
  });
});
