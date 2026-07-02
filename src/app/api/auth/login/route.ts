import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, verifyPassword, createSession } from "@/lib/auth";
import { verifyTotpCode } from "@/lib/totp";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { username, password, totpCode } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "缺少用户名或密码" }, { status: 400 });
  }

  const user = await getAdminUser(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  if (user.totpSecret && !verifyTotpCode(user.totpSecret, totpCode)) {
    return NextResponse.json({ error: "验证码错误" }, { status: 401 });
  }

  const sessionId = await createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set("session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
