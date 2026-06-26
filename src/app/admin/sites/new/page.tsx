"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteForm from "@/components/SiteForm";

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">添加站点</h1>
        <SiteForm onSubmit={handleSubmit} saving={saving} />
      </div>
    </div>
  );
}
