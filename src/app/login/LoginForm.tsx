"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useTheme } from "@/components/ThemeProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
  turnstileSiteKey?: string;
  requiresTotp: boolean;
}

export function LoginForm({ turnstileSiteKey, requiresTotp }: LoginFormProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const turnstileTokenRef = useRef<string>("");

  useEffect(() => {
    turnstileTokenRef.current = "";
  }, [resolvedTheme]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
          totpCode: formData.get("totpCode"),
          turnstileToken: turnstileTokenRef.current,
        }),
      });

      if (res.ok) {
        router.push("/admin");
        return;
      }

      const data = await res.json().catch(() => null);
      setError(data?.error || "登录失败，请稍后重试");
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field>
        <FieldLabel htmlFor="username">用户名</FieldLabel>
        <Input id="username" name="username" type="text" required autoComplete="username" />
      </Field>
      <Field>
        <FieldLabel htmlFor="password">密码</FieldLabel>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </Field>
      {requiresTotp && (
        <Field>
          <FieldLabel htmlFor="totpCode">TOTP 验证码</FieldLabel>
          <Input
            id="totpCode"
            name="totpCode"
            type="text"
            inputMode="numeric"
            pattern="[0-9 ]{6,8}"
            required
            autoComplete="one-time-code"
          />
          <FieldDescription>请输入验证器应用中显示的 6 位动态验证码。</FieldDescription>
        </Field>
      )}
      {turnstileSiteKey && resolvedTheme && (
        <div className="flex justify-center">
          <Turnstile
            key={resolvedTheme}
            siteKey={turnstileSiteKey}
            onSuccess={(token) => {
              turnstileTokenRef.current = token;
            }}
            onError={() => {
              setError("验证码加载失败，请刷新页面重试");
            }}
            options={{
              theme: resolvedTheme,
              size: "normal",
            }}
          />
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
