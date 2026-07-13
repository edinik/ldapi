export const loginPath = "/login";

export async function clearAdminSession(
  sessionId: string | undefined,
  deleteSession: (sessionId: string) => Promise<void>,
) {
  if (sessionId) {
    await deleteSession(sessionId);
  }

  return loginPath;
}
