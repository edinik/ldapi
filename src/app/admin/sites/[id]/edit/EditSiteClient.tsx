"use client";

import { useRouter } from "next/navigation";
import SiteForm from "@/components/SiteForm";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AvailableSiteModelOption } from "@/lib/site-model-options";
import { requestJson } from "@/lib/admin/json-mutation";
import { useJsonMutation } from "@/lib/admin/use-json-mutation";

interface Props {
  site: Record<string, unknown> & { id: number; modelNames: string[] };
  availableModels: AvailableSiteModelOption[];
}

export default function EditSiteClient({ site, availableModels }: Props) {
  const router = useRouter();
  const { pending: saving, mutate } = useJsonMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    const res = await mutate(`/api/sites/${site.id}`, "PUT", data);
    if (res.ok) {
      router.push("/admin");
    }
  }

  async function handleDelete() {
    await requestJson(`/api/sites/${site.id}`, { method: "DELETE" });
    router.push("/admin");
  }

  return (
    <div className="space-y-5">
      <SiteForm initialData={site} onSubmit={handleSubmit} saving={saving} availableModels={availableModels} />
      <Card>
        <CardHeader className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <CardTitle>危险操作</CardTitle>
            <CardDescription className="mt-1">删除后该站点会从后台和公开目录中移除。</CardDescription>
          </div>
          <ConfirmAction
            triggerLabel="删除此站点"
            title="删除站点"
            description="确定要删除此站点吗？"
            confirmLabel="删除"
            onConfirm={handleDelete}
          />
        </CardHeader>
      </Card>
    </div>
  );
}
