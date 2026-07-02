"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ResourceForm from "@/components/ResourceForm";

interface Props {
  resource: Record<string, unknown> & { id: number };
  tagOptions: string[];
}

export default function EditResourceClient({ resource, tagOptions }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/resources/${resource.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin/resources");
    }

    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("确定要删除此资源吗？")) return;
    await fetch(`/api/resources/${resource.id}`, { method: "DELETE" });
    router.push("/admin/resources");
  }

  return (
    <div className="space-y-5">
      <ResourceForm initialData={resource} onSubmit={handleSubmit} saving={saving} tagOptions={tagOptions} />
      <div className="ld-card-light flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
        <div>
          <p className="font-semibold text-[var(--ink)]">危险操作</p>
          <p className="mt-1 text-sm text-[var(--muted)]">删除后该资源会从后台和公开目录中移除。</p>
        </div>
        <button type="button" onClick={handleDelete} className="ld-button-danger">
          删除此资源
        </button>
      </div>
    </div>
  );
}
