"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteForm from "@/components/SiteForm";
import type { AvailableSiteModelOption } from "@/lib/site-model-options";

interface Props {
  site: Record<string, unknown> & { id: number; modelNames: string[] };
  availableModels: AvailableSiteModelOption[];
}

export default function EditSiteClient({ site, availableModels }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/sites/${site.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/admin");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("确定要删除此站点吗？")) return;
    await fetch(`/api/sites/${site.id}`, { method: "DELETE" });
    router.push("/admin");
  }

  return (
    <div className="space-y-5">
      <SiteForm initialData={site} onSubmit={handleSubmit} saving={saving} availableModels={availableModels} />
      <div className="ld-card-light flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
        <div>
          <p className="font-semibold text-[var(--ink)]">危险操作</p>
          <p className="mt-1 text-sm text-[var(--muted)]">删除后该站点会从后台和公开目录中移除。</p>
        </div>
        <button onClick={handleDelete} className="ld-button-danger">
          删除此站点
        </button>
      </div>
    </div>
  );
}
