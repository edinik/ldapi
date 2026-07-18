import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { validateSession } from "./auth";
import { redirect } from "next/navigation";
import { resolveApiSession } from "./api-session";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) redirect("/login");

  const session = await validateSession(sessionId);
  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAuth(): Promise<NextResponse | null> {
  const result = await requireApiSession();
  return result.ok ? null : result.response;
}

export async function requireApiSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  const result = await resolveApiSession(sessionId, validateSession);

  if (!result.ok) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: result.error }, { status: 401 }),
    };
  }

  return { ok: true as const, session: result.session };
}
