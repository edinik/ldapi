import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { disableTotp, confirmTotpSetup, generateTotpSetup } from "./actions";
import { requireAdmin } from "@/lib/session";
import { createTotpUri } from "@/lib/totp";
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
  const error = params?.error ? errorMessages[params.error] : null;
  const success = params?.success ? successMessages[params.success] : null;

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

          {error && (
            <p className="mt-5 rounded-lg border border-[rgba(198,69,69,0.24)] bg-[rgba(198,69,69,0.08)] px-3 py-2 text-sm text-[var(--error)]">
              {error}
            </p>
          )}
          {success && (
            <p className="mt-5 rounded-lg border border-[rgba(93,184,114,0.28)] bg-[rgba(93,184,114,0.12)] px-3 py-2 text-sm text-[var(--ink)]">
              {success}
            </p>
          )}

          {totpUri && (
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="totpSecret" className="ld-label">
                  密钥
                </label>
                <input
                  id="totpSecret"
                  readOnly
                  value={user.pendingTotpSecret ?? ""}
                  className="ld-input mt-2 font-mono text-sm"
                />
              </div>

              <div>
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
                  />
                </div>
                <button type="submit" className="ld-button-primary">
                  确认启用
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
