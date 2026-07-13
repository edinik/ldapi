import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth";
import { clearAdminSession } from "@/lib/auth-logout";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;
  const redirectPath = await clearAdminSession(sessionId, deleteSession);

  if (sessionId) {
    cookieStore.delete("session");
  }

  return NextResponse.redirect(new URL(redirectPath, req.url));
}
