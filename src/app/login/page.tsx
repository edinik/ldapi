import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (sessionId && await validateSession(sessionId)) {
    redirect("/admin");
  }

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <main className="ld-page grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-[var(--hairline)] bg-[rgba(250,249,245,0.88)] p-8 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-[var(--hairline)] bg-[rgba(250,249,245,0.92)] text-sm font-semibold text-[var(--primary)] shadow-[var(--shadow-soft)]">
            L
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">LDAPI</p>
            <p className="text-xs text-[var(--muted)]">管理员后台</p>
          </div>
        </div>

        <div className="mt-10">
          <p className="ld-badge mb-5 w-fit">登录</p>
          <h1 className="ld-display text-3xl text-[var(--ink)]">进入后台</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            请输入管理员账号和密码。
          </p>
        </div>

        <LoginForm turnstileSiteKey={turnstileSiteKey} />
      </section>
    </main>
  );
}
