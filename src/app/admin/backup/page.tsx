import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/session";
import { eq } from "drizzle-orm";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import BackupDownloadForm from "./BackupDownloadForm";

export default async function AdminBackupPage() {
  const session = await requireAdmin();
  const [user] = await db
    .select({ totpSecret: adminUsers.totpSecret })
    .from(adminUsers)
    .where(eq(adminUsers.id, session.userId))
    .limit(1);

  if (!user) {
    throw new Error("Admin user not found");
  }

  return (
    <main className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-[min(100%-2rem,48rem)]">
        <header className="border-b border-border pb-8">
          <Link href="/admin" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            返回后台
          </Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">数据备份</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            生成当前数据库的一致性副本并下载到本机。
          </p>
        </header>

        <Alert variant="destructive" className="mt-6">
          <ShieldAlert />
          <AlertTitle>备份文件包含敏感数据</AlertTitle>
          <AlertDescription>
            文件未加密，可能包含密码哈希、TOTP 密钥和 AI API Key。请仅保存在可信设备，不要通过公开渠道传输。
          </AlertDescription>
        </Alert>

        <Card className="mt-6">
          <CardHeader className="border-b">
            <CardTitle>下载 SQLite 备份</CardTitle>
            <CardDescription>
              备份保留全部业务数据和配置，但会清空登录会话；恢复后需要重新登录。
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <BackupDownloadForm requiresTotp={Boolean(user.totpSecret)} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
