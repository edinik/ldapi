"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModelForm from "@/components/ModelForm";

interface Props {
  model: Record<string, unknown> & { id: number; name: string };
}

export default function EditModelClient({ model }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch(`/api/models/${model.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin/models");
    }

    setSaving(false);
  }

  async function handleDisable() {
    if (!confirm("确定要停用此模型吗？它不会从站点关联中硬删除。")) return;
    await fetch(`/api/models/${model.id}`, { method: "DELETE" });
    router.push("/admin/models");
  }

  async function handleDelete() {
    if (!confirm("确定要永久删除此模型吗？此操作不可恢复，关联的站点配置也将被移除。")) return;
    await fetch(`/api/models/${model.id}?hard=true`, { method: "DELETE" });
    router.push("/admin/models");
  }

  return (
    <div className="space-y-5">
      <ModelForm initialData={model} onSubmit={handleSubmit} saving={saving} />
      <div className="ld-card-light flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
        <div>
          <p className="font-semibold text-[var(--ink)]">停用模型</p>
          <p className="mt-1 text-sm text-[var(--muted)]">停用后模型不再作为有效模型展示，但保留已有站点关联。</p>
        </div>
        <button onClick={handleDisable} className="ld-button-danger">
          停用此模型
        </button>
      </div>
      <div className="ld-card-light flex flex-col justify-between gap-4 border border-red-300 p-5 md:flex-row md:items-center">
        <div>
          <p className="font-semibold text-red-600">删除模型</p>
          <p className="mt-1 text-sm text-[var(--muted)]">永久删除此模型及其所有站点关联，此操作不可恢复。</p>
        </div>
        <button onClick={handleDelete} className="ld-button-danger">
          永久删除
        </button>
      </div>
    </div>
  );
}
