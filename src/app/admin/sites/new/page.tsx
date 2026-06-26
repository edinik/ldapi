"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteForm from "@/components/SiteForm";
import Link from "next/link";

export default function NewSitePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/admin");
    }
    setSaving(false);
  }

  return (
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container max-w-4xl">
        <header className="mb-8 border-b border-[var(--hairline)] pb-6">
          <Link href="/admin" className="ld-link text-sm">
            返回站点管理
          </Link>
          <h1 className="ld-display mt-4 text-5xl leading-tight text-[var(--ink)]">添加站点</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            录入新的 AI 公益站入口、模型支持、签到方式和使用限制，公开目录会实时读取活跃站点。
          </p>
        </header>
        <SiteForm onSubmit={handleSubmit} saving={saving} />
      </div>
    </main>
  );
}
