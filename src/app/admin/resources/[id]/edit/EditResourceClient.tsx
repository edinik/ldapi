"use client";

import { useRouter } from "next/navigation";
import ResourceForm from "@/components/ResourceForm";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestJson } from "@/lib/admin/json-mutation";
import { useJsonMutation } from "@/lib/admin/use-json-mutation";

interface Props {
  resource: Record<string, unknown> & { id: number };
  tagOptions: string[];
}

export default function EditResourceClient({ resource, tagOptions }: Props) {
  const router = useRouter();
  const { pending: saving, mutate } = useJsonMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    const res = await mutate(`/api/resources/${resource.id}`, "PUT", data);

    if (res.ok) {
      router.push("/admin/resources");
    }
  }

  async function handleDelete() {
    await requestJson(`/api/resources/${resource.id}`, { method: "DELETE" });
    router.push("/admin/resources");
  }

  return (
    <div className="space-y-5">
      <ResourceForm initialData={resource} onSubmit={handleSubmit} saving={saving} tagOptions={tagOptions} />
      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>危险操作</CardTitle>
            <CardDescription className="mt-1">删除后该资源会从后台和公开目录中移除。</CardDescription>
          </div>
          <ConfirmAction
            triggerLabel="删除此资源"
            title="删除资源"
            description="确定要删除此资源吗？"
            confirmLabel="删除"
            onConfirm={handleDelete}
          />
        </CardHeader>
      </Card>
    </div>
  );
}
