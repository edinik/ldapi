import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { validateSession } from "./auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) redirect("/login");

  const session = await validateSession(sessionId);
  if (!session) {
    cookieStore.delete("session");
    redirect("/login");
  }

  return session;
}

export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const session = await validateSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "会话过期" }, { status: 401 });
  }

  return null;
}
