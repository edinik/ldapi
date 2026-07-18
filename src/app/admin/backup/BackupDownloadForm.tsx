"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { backupFilenameHeader } from "@/lib/backup-http";
import { Download, LoaderCircle } from "lucide-react";

export default function BackupDownloadForm({ requiresTotp }: { requiresTotp: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDownloading(true);
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/backup", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: formData.get("password"),
          totpCode: requiresTotp ? formData.get("totpCode") : undefined,
        }),
      });

      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }

      const contents = await response.blob();
      const filename =
        response.headers.get(backupFilenameHeader) ?? "ldapi-backup.sqlite";
      const objectUrl = URL.createObjectURL(contents);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch {
      setError("备份下载失败，请检查网络后重试");
    } finally {
      form.reset();
      setDownloading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Field>
        <FieldLabel htmlFor="backupPassword">当前管理员密码</FieldLabel>
        <Input
          id="backupPassword"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={downloading}
        />
        <FieldDescription>下载前需要重新验证当前登录管理员的身份。</FieldDescription>
      </Field>

      {requiresTotp && (
        <Field>
          <FieldLabel htmlFor="backupTotpCode">TOTP 验证码</FieldLabel>
          <Input
            id="backupTotpCode"
            name="totpCode"
            type="text"
            inputMode="numeric"
            pattern="[0-9 ]{6,8}"
            autoComplete="one-time-code"
            placeholder="请输入 6 位验证码"
            required
            disabled={downloading}
          />
          <FieldDescription>当前账户已启用两步验证。</FieldDescription>
        </Field>
      )}

      <Button type="submit" size="lg" disabled={downloading}>
        {downloading ? (
          <LoaderCircle data-icon="inline-start" className="animate-spin" />
        ) : (
          <Download data-icon="inline-start" />
        )}
        {downloading ? "正在生成备份..." : "验证并下载备份"}
      </Button>
    </form>
  );
}

async function readErrorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : "备份下载失败，请稍后重试";
}
