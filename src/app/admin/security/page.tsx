import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { disableTotp, confirmTotpSetup, generateTotpSetup, saveAiGenerationSettings } from "./actions";
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
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container max-w-3xl">
        <header className="border-b border-[var(--hairline)] pb-8">
          <Link href="/admin" className="ld-link text-sm">
            返回后台
          </Link>
          <h1 className="ld-display mt-4 text-4xl text-[var(--ink)]">安全设置</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            为管理员登录增加基于时间的一次性验证码。
          </p>
        </header>

        {error && (
          <p className="mt-6 rounded-lg border border-[rgba(198,69,69,0.24)] bg-[rgba(198,69,69,0.08)] px-3 py-2 text-sm text-[var(--error)]">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-6 rounded-lg border border-[rgba(93,184,114,0.28)] bg-[rgba(93,184,114,0.12)] px-3 py-2 text-sm text-[var(--ink)]">
            {success}
          </p>
        )}

        <section className="ld-card-light mt-8 p-6">
          <div className="flex flex-col justify-between gap-4 border-b border-[var(--hairline)] pb-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">TOTP 两步验证</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                当前状态：{user.totpSecret ? "已启用" : "未启用"}
              </p>
            </div>
            {user.totpSecret ? (
              <form action={disableTotp}>
                <button type="submit" className="ld-button-secondary">
                  停用 TOTP
                </button>
              </form>
            ) : (
              <form action={generateTotpSetup}>
                <button type="submit" className="ld-button-primary">
                  生成密钥
                </button>
              </form>
            )}
          </div>

          {totpUri && (
            <div className="mt-6 space-y-5">
              <div className="flex flex-col items-center gap-4 rounded-lg border border-[var(--hairline)] bg-white p-6">
                <p className="text-sm font-medium text-[var(--ink)]">使用验证器扫描二维码</p>
                {qrCodeDataUrl && (
                  <img
                    src={qrCodeDataUrl}
                    alt="TOTP QR Code"
                    width={256}
                    height={256}
                    className="rounded-lg border border-[var(--hairline)]"
                  />
                )}
                <p className="text-xs text-[var(--muted)]">
                  支持 Google Authenticator、Microsoft Authenticator 等应用
                </p>
              </div>

              <div>
                <label htmlFor="totpSecret" className="ld-label">
                  密钥（手动输入）
                </label>
                <input
                  id="totpSecret"
                  readOnly
                  value={user.pendingTotpSecret ?? ""}
                  className="ld-input mt-2 font-mono text-sm"
                />
                <p className="mt-1 text-xs text-[var(--muted)]">
                  如果无法扫描二维码，可以手动输入此密钥
                </p>
              </div>

              <details className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-4">
                <summary className="cursor-pointer text-sm font-medium text-[var(--ink)]">
                  高级选项
                </summary>
                <div className="mt-4">
                  <label htmlFor="totpUri" className="ld-label">
                    otpauth URI
                  </label>
                  <textarea
                    id="totpUri"
                    readOnly
                    value={totpUri}
                    className="ld-input mt-2 min-h-28 font-mono text-xs leading-5"
                  />
                </div>
              </details>

              <form action={confirmTotpSetup} className="space-y-4">
                <div>
                  <label htmlFor="totpCode" className="ld-label">
                    验证码
                  </label>
                  <input
                    id="totpCode"
                    name="totpCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9 ]{6,8}"
                    required
                    autoComplete="one-time-code"
                    className="ld-input mt-2"
                    placeholder="请输入 6 位验证码"
                  />
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    请输入验证器应用中显示的 6 位数字
                  </p>
                </div>
                <button type="submit" className="ld-button-primary">
                  确认启用
                </button>
              </form>
            </div>
          )}
        </section>

        <section className="ld-card-light mt-6 p-6">
          <div className="border-b border-[var(--hairline)] pb-5">
            <h2 className="text-lg font-semibold text-[var(--ink)]">AI 导入生成</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              配置 OpenAI-compatible 接口，用于模型导入页的 AI 生成。数据库配置优先于环境变量。
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.64)] p-3">
            <p className="text-sm font-semibold text-[var(--ink)]">
              当前状态：{aiConfig.ok ? "已配置" : aiConfig.error}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              API Key：{configuredApiKey ? maskSecret(configuredApiKey) : "未配置"}
            </p>
          </div>

          <form action={saveAiGenerationSettings} className="mt-5 space-y-4">
            <div>
              <label htmlFor="aiBaseUrl" className="ld-label">
                Base URL
              </label>
              <input
                id="aiBaseUrl"
                name="baseUrl"
                type="url"
                defaultValue={aiSettings.baseUrl || process.env.AI_BASE_URL || ""}
                placeholder="https://api.openai.com/v1"
                className="ld-input mt-2"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                留空时使用默认 OpenAI 地址或环境变量。
              </p>
            </div>

            <div>
              <label htmlFor="aiModel" className="ld-label">
                模型
              </label>
              <input
                id="aiModel"
                name="model"
                defaultValue={aiSettings.model || process.env.AI_MODEL || ""}
                placeholder="gpt-4.1-mini"
                className="ld-input mt-2"
              />
            </div>

            <div>
              <label htmlFor="aiApiKey" className="ld-label">
                API Key
              </label>
              <input
                id="aiApiKey"
                name="apiKey"
                type="password"
                autoComplete="new-password"
                placeholder={configuredApiKey ? "留空则保留当前密钥" : "请输入 API Key"}
                className="ld-input mt-2"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">
                出于安全考虑，已保存的密钥不会明文显示。
              </p>
            </div>

            <button type="submit" className="ld-button-primary">
              保存 AI 配置
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
