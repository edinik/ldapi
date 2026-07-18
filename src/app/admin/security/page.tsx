import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { disableTotp, confirmTotpSetup, generateTotpSetup, saveAiGenerationSettings } from "./actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { maskSecret, resolveOpenAiCompatibleConfig } from "@/lib/ai-settings";
import { getStoredAiSettings } from "@/lib/ai-settings-store";
import { requireAdmin } from "@/lib/session";
import { createTotpUri, generateTotpQrCode } from "@/lib/totp";
import { eq } from "drizzle-orm";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  "invalid-code": "验证码不正确，请确认手机时间同步后重试。",
  "missing-secret": "请先生成 TOTP 密钥。",
};

const successMessages: Record<string, string> = {
  generated: "已生成新的 TOTP 密钥，请添加到验证器后确认。",
  enabled: "TOTP 验证已启用。",
  disabled: "TOTP 验证已停用。",
  "ai-saved": "AI 生成配置已保存。",
};

export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const session = await requireAdmin();
  const params = await searchParams;
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.userId))
    .limit(1);

  if (!user) {
    throw new Error("Admin user not found");
  }

  const totpUri = user.pendingTotpSecret
    ? createTotpUri({ issuer: "LDAPI", accountName: user.username, secret: user.pendingTotpSecret })
    : null;
  const qrCodeDataUrl = totpUri ? await generateTotpQrCode(totpUri) : null;
  const error = params?.error ? errorMessages[params.error] : null;
  const success = params?.success ? successMessages[params.success] : null;
  const aiSettings = await getStoredAiSettings(db);
  const aiConfig = resolveOpenAiCompatibleConfig(process.env, aiSettings);
  const configuredApiKey = aiSettings.apiKey || process.env.AI_API_KEY || null;

  return (
    <main className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-[min(100%-2rem,48rem)]">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-8">
          <div>
            <Link href="/admin" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              返回后台
            </Link>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">安全设置</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">为管理员登录增加基于时间的一次性验证码。</p>
          </div>
          <ThemeToggle />
        </header>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mt-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card className="mt-8">
          <CardHeader className="flex flex-col justify-between gap-4 border-b sm:flex-row sm:items-center">
            <div>
              <CardTitle>TOTP 两步验证</CardTitle>
              <CardDescription className="mt-1">当前状态：{user.totpSecret ? "已启用" : "未启用"}</CardDescription>
            </div>
            {user.totpSecret ? (
              <form action={disableTotp}>
                <Button type="submit" variant="outline">
                  停用 TOTP
                </Button>
              </form>
            ) : (
              <form action={generateTotpSetup}>
                <Button type="submit">生成密钥</Button>
              </form>
            )}
          </CardHeader>

          {totpUri && (
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6">
                <p className="text-sm font-medium text-foreground">使用验证器扫描二维码</p>
                {qrCodeDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeDataUrl}
                    alt="TOTP QR Code"
                    width={256}
                    height={256}
                    className="rounded-lg border border-border"
                  />
                )}
                <p className="text-xs text-muted-foreground">支持 Google Authenticator、Microsoft Authenticator 等应用</p>
              </div>

              <Field>
                <FieldLabel htmlFor="totpSecret">密钥（手动输入）</FieldLabel>
                <Input id="totpSecret" readOnly value={user.pendingTotpSecret ?? ""} className="font-mono text-sm" />
                <FieldDescription>如果无法扫描二维码，可以手动输入此密钥</FieldDescription>
              </Field>

              <details className="rounded-lg border border-border bg-muted/40 p-4">
                <summary className="cursor-pointer text-sm font-medium text-foreground">高级选项</summary>
                <div className="mt-4">
                  <Field>
                    <FieldLabel htmlFor="totpUri">otpauth URI</FieldLabel>
                    <Textarea id="totpUri" readOnly value={totpUri} className="min-h-28 font-mono text-xs leading-5" />
                  </Field>
                </div>
              </details>

              <form action={confirmTotpSetup} className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="totpCode">验证码</FieldLabel>
                  <Input
                    id="totpCode"
                    name="totpCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9 ]{6,8}"
                    required
                    autoComplete="one-time-code"
                    placeholder="请输入 6 位验证码"
                  />
                  <FieldDescription>请输入验证器应用中显示的 6 位数字</FieldDescription>
                </Field>
                <Button type="submit">确认启用</Button>
              </form>
            </CardContent>
          )}
        </Card>

        <Card className="mt-6">
          <CardHeader className="border-b">
            <CardTitle>AI 导入生成</CardTitle>
            <CardDescription>
              配置 OpenAI-compatible 接口，用于模型导入页的 AI 生成。数据库配置优先于环境变量。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm font-semibold text-foreground">当前状态：{aiConfig.ok ? "已配置" : aiConfig.error}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                API Key：{configuredApiKey ? maskSecret(configuredApiKey) : "未配置"}
              </p>
            </div>

            <form action={saveAiGenerationSettings} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="aiBaseUrl">Base URL</FieldLabel>
                <Input
                  id="aiBaseUrl"
                  name="baseUrl"
                  type="url"
                  defaultValue={aiSettings.baseUrl || process.env.AI_BASE_URL || ""}
                  placeholder="https://api.openai.com/v1"
                />
                <FieldDescription>留空时使用默认 OpenAI 地址或环境变量。</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="aiModel">模型</FieldLabel>
                <Input
                  id="aiModel"
                  name="model"
                  defaultValue={aiSettings.model || process.env.AI_MODEL || ""}
                  placeholder="gpt-4.1-mini"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="aiApiKey">API Key</FieldLabel>
                <Input
                  id="aiApiKey"
                  name="apiKey"
                  type="password"
                  autoComplete="new-password"
                  placeholder={configuredApiKey ? "留空则保留当前密钥" : "请输入 API Key"}
                />
                <FieldDescription>出于安全考虑，已保存的密钥不会明文显示。</FieldDescription>
              </Field>

              <Button type="submit">保存 AI 配置</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
