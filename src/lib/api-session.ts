export type ApiSessionResult<T> =
  | { ok: true; session: T }
  | { ok: false; error: "未登录" | "会话过期" };

export async function resolveApiSession<T>(
  sessionId: string | undefined,
  validateSession: (sessionId: string) => Promise<T | null>,
): Promise<ApiSessionResult<T>> {
  if (!sessionId) {
    return { ok: false, error: "未登录" };
  }

  const session = await validateSession(sessionId);
  if (!session) {
    return { ok: false, error: "会话过期" };
  }

  return { ok: true, session };
}
