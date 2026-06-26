"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error || "登录失败");
    }
    setLoading(false);
  }

  return (
    <main className="ld-page grid min-h-screen place-items-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface-card)] shadow-[var(--shadow-soft)] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="ld-card-dark flex flex-col justify-between rounded-none p-8 lg:p-10">
          <div>
            <Link href="/" className="ld-focus-ring inline-flex items-center gap-3 rounded-md">
              <span className="grid size-8 place-items-center rounded-full bg-[var(--on-dark)] text-sm font-semibold text-[var(--surface-dark)]">
                L
              </span>
              <span className="text-sm font-semibold text-[var(--on-dark)]">LDAPI</span>
            </Link>
            <h1 className="ld-display mt-12 text-4xl leading-tight text-[var(--on-dark)]">
              管理公益站目录，保持信息可用。
            </h1>
            <p className="mt-5 text-sm leading-7 text-[var(--on-dark-soft)]">
              后台用于维护站点入口、模型支持、签到方式、限速说明和 LinuxDo 讨论链接。
            </p>
          </div>
          <div className="mt-10 rounded-lg bg-[var(--surface-dark-elevated)] p-4 font-mono text-xs leading-6 text-[var(--on-dark-soft)]">
            <p>role = admin</p>
            <p>scope = site directory</p>
            <p>surface = warm editorial system</p>
          </div>
        </section>

        <section className="bg-[rgba(250,249,245,0.76)] p-8 lg:p-10">
          <div className="mx-auto max-w-sm">
            <p className="ld-badge mb-5 w-fit">管理员登录</p>
            <h2 className="ld-display text-3xl text-[var(--ink)]">进入后台</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              使用管理员账号登录后，可以新增、编辑和删除公益站记录。
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="username" className="ld-label">
                  用户名
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  className="ld-input mt-2"
                />
              </div>
              <div>
                <label htmlFor="password" className="ld-label">
                  密码
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="ld-input mt-2"
                />
              </div>
              {error && (
                <p className="rounded-lg border border-[rgba(198,69,69,0.24)] bg-[rgba(198,69,69,0.08)] px-3 py-2 text-sm text-[var(--error)]">
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading} className="ld-button-primary w-full">
                {loading ? "登录中..." : "登录"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
