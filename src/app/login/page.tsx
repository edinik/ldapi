import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { db } from "@/db";
import { validateSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (sessionId && (await validateSession(sessionId))) {
    redirect("/admin");
  }

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const admin = await db.query.adminUsers.findFirst({
    columns: { totpSecret: true },
  });
  const requiresTotp = Boolean(admin?.totpSecret);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full border border-border bg-card text-sm font-semibold text-foreground shadow-sm">
                L
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">LDAPI</p>
                <p className="text-xs text-muted-foreground">管理员后台</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <div className="pt-6">
            <Badge variant="secondary" className="mb-5">
              登录
            </Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight">进入后台</CardTitle>
            <CardDescription className="mt-2">请输入管理员账号和密码。</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm turnstileSiteKey={turnstileSiteKey} requiresTotp={requiresTotp} />
        </CardContent>
      </Card>
    </main>
  );
}
