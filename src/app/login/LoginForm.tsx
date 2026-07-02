"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
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
  );
}
