export type LoginInput = {
  username?: string;
  password?: string;
  totpCode?: unknown;
  turnstileToken?: string;
};

type AdminUser = {
  id: number;
  passwordHash: string;
  totpSecret: string | null;
};

export type LoginDependencies = {
  turnstileRequired: boolean;
  verifyTurnstileToken: (token: string) => Promise<boolean>;
  getAdminUser: (username: string) => Promise<AdminUser | undefined>;
  verifyPassword: (password: string, stored: string) => boolean;
  verifyTotpCode: (secret: string, code: unknown) => boolean;
  createSession: (userId: number) => Promise<string>;
};

export type LoginResult =
  | { ok: true; sessionId: string }
  | { ok: false; status: 400 | 401; error: string };

export async function authenticateLogin(input: LoginInput, dependencies: LoginDependencies): Promise<LoginResult> {
  const { username, password, totpCode, turnstileToken } = input;

  if (!username || !password) {
    return { ok: false, status: 400, error: "缺少用户名或密码" };
  }

  if (dependencies.turnstileRequired && !turnstileToken) {
    return { ok: false, status: 400, error: "缺少验证码" };
  }

  if (turnstileToken && !(await dependencies.verifyTurnstileToken(turnstileToken))) {
    return { ok: false, status: 400, error: "验证码验证失败，请重试" };
  }

  const user = await dependencies.getAdminUser(username);
  if (!user || !dependencies.verifyPassword(password, user.passwordHash)) {
    return { ok: false, status: 401, error: "用户名或密码错误" };
  }

  if (user.totpSecret && !dependencies.verifyTotpCode(user.totpSecret, totpCode)) {
    return { ok: false, status: 401, error: "验证码错误" };
  }

  return { ok: true, sessionId: await dependencies.createSession(user.id) };
}
