"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteForm from "@/components/SiteForm";

interface Props {
  site: Record<string, unknown> & { id: number; modelNames: string[] };
}

export default function EditSiteClient({ site }: Props) {
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
    <div>
      <SiteForm initialData={site} onSubmit={handleSubmit} saving={saving} />
      <button
        onClick={handleDelete}
        className="mt-4 text-red-600 hover:text-red-800 text-sm"
      >
        删除此站点
      </button>
    </div>
  );
}
