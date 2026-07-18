import { NextRequest, NextResponse } from "next/server";
import { databasePath } from "@/db/database-path";
import { getAdminUserById, verifyPassword } from "@/lib/auth";
import { reauthenticateBackup } from "@/lib/backup-auth";
import {
  createBackupResponseHeaders,
  isSecureBackupRequest,
} from "@/lib/backup-http";
import { requireApiSession } from "@/lib/session";
import { verifyTotpCode } from "@/lib/totp";
import { createDatabaseBackup } from "@/server/backup/create-database-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (
    !isSecureBackupRequest({
      nodeEnvironment: process.env.NODE_ENV,
      requestUrl: request.url,
      forwardedProto: request.headers.get("x-forwarded-proto"),
    })
  ) {
    return NextResponse.json(
      { error: "生产环境只能通过 HTTPS 下载备份" },
      { status: 400 },
    );
  }

  const apiSession = await requireApiSession();
  if (!apiSession.ok) {
    return apiSession.response;
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "备份请求格式无效" }, { status: 400 });
  }

  const authentication = await reauthenticateBackup(apiSession.session.userId, input, {
    getAdminUserById,
    verifyPassword,
    verifyTotpCode,
  });
  if (!authentication.ok) {
    return NextResponse.json(
      { error: authentication.error },
      { status: authentication.status },
    );
  }

  try {
    const backup = await createDatabaseBackup({ sourcePath: databasePath });
    return new NextResponse(new Uint8Array(backup.contents), {
      status: 200,
      headers: createBackupResponseHeaders(backup.filename),
    });
  } catch (error) {
    console.error("Database backup generation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "备份生成失败，请稍后重试" },
      { status: 500 },
    );
  }
}
