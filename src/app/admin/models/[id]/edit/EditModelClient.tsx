"use client";

import { useRouter } from "next/navigation";
import ModelForm from "@/components/ModelForm";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestJson } from "@/lib/admin/json-mutation";
import { useJsonMutation } from "@/lib/admin/use-json-mutation";

interface Props {
  model: Record<string, unknown> & { id: number; name: string };
}

export default function EditModelClient({ model }: Props) {
  const router = useRouter();
  const { pending: saving, mutate } = useJsonMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    const res = await mutate(`/api/models/${model.id}`, "PUT", data);

    if (res.ok) {
      router.push("/admin/models");
    }
  }

  async function handleDisable() {
    await requestJson(`/api/models/${model.id}`, { method: "DELETE" });
    router.push("/admin/models");
  }

  async function handleDelete() {
    await requestJson(`/api/models/${model.id}?hard=true`, { method: "DELETE" });
    router.push("/admin/models");
  }

  return (
    <div className="space-y-5">
      <ModelForm initialData={model} onSubmit={handleSubmit} saving={saving} />
      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>停用模型</CardTitle>
            <CardDescription className="mt-1">停用后模型不再作为有效模型展示，但保留已有站点关联。</CardDescription>
          </div>
          <ConfirmAction
            triggerLabel="停用此模型"
            title="停用模型"
            description="确定要停用此模型吗？它不会从站点关联中硬删除。"
            confirmLabel="停用"
            onConfirm={handleDisable}
          />
        </CardHeader>
      </Card>
      <Card className="border-destructive/40">
        <CardHeader className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle className="text-destructive">删除模型</CardTitle>
            <CardDescription className="mt-1">永久删除此模型及其所有站点关联，此操作不可恢复。</CardDescription>
          </div>
          <ConfirmAction
            triggerLabel="永久删除"
            title="永久删除模型"
            description="确定要永久删除此模型吗？此操作不可恢复，关联的站点配置也将被移除。"
            confirmLabel="永久删除"
            onConfirm={handleDelete}
          />
        </CardHeader>
      </Card>
    </div>
  );
}
