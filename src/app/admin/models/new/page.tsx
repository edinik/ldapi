"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModelForm from "@/components/ModelForm";

export default function NewModelPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin/models");
    }

    setSaving(false);
  }

  return (
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container">
        <header className="mb-8 border-b border-[var(--hairline)] pb-6">
          <Link href="/admin/models" className="ld-link text-sm">
            返回模型管理
          </Link>
          <h1 className="ld-display mt-4 text-5xl leading-tight text-[var(--ink)]">添加模型</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            录入模型能力、模态、价格、上下文限制和主页展示信息。
          </p>
        </header>
        <ModelForm onSubmit={handleSubmit} saving={saving} />
      </div>
    </main>
  );
}
