import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, verifyPassword, createSession } from "@/lib/auth";
import { verifyTotpCode } from "@/lib/totp";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { cookies } from "next/headers";
import { authenticateLogin, type LoginInput } from "@/lib/auth-login";

export async function POST(req: NextRequest) {
  const input = (await req.json()) as LoginInput;
  const result = await authenticateLogin(input, {
    turnstileRequired: Boolean(process.env.TURNSTILE_SECRET_KEY),
    verifyTurnstileToken,
    getAdminUser,
    verifyPassword,
    verifyTotpCode,
    createSession,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const cookieStore = await cookies();
  cookieStore.set("session", result.sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
