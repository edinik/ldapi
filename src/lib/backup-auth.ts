type BackupAdmin = {
  passwordHash: string;
  totpSecret: string | null;
};

export type BackupAuthDependencies = {
  getAdminUserById: (userId: number) => Promise<BackupAdmin | null>;
  verifyPassword: (password: string, storedHash: string) => boolean;
  verifyTotpCode: (secret: string, code: unknown) => boolean;
};

export type BackupAuthResult =
  | { ok: true }
  | { ok: false; status: 400 | 401 | 403; error: string };

export async function reauthenticateBackup(
  userId: number,
  input: unknown,
  dependencies: BackupAuthDependencies,
): Promise<BackupAuthResult> {
  if (!isRecord(input) || typeof input.password !== "string" || input.password.length === 0) {
    return { ok: false, status: 400, error: "请输入当前管理员密码" };
  }

  const user = await dependencies.getAdminUserById(userId);
  if (!user) {
    return { ok: false, status: 401, error: "会话过期" };
  }

  if (!dependencies.verifyPassword(input.password, user.passwordHash)) {
    return { ok: false, status: 403, error: "管理员密码不正确" };
  }

  if (user.totpSecret) {
    if (typeof input.totpCode !== "string" || input.totpCode.length === 0) {
      return { ok: false, status: 400, error: "请输入 TOTP 验证码" };
    }

    if (!dependencies.verifyTotpCode(user.totpSecret, input.totpCode)) {
      return { ok: false, status: 403, error: "TOTP 验证码不正确" };
    }
  }

  return { ok: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
