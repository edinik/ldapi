"use client";

import { useRouter } from "next/navigation";
import SiteForm from "@/components/SiteForm";
import type { AvailableSiteModelOption } from "@/lib/site-model-options";
import { useJsonMutation } from "@/lib/admin/use-json-mutation";

export default function NewSiteClient({ availableModels }: { availableModels: AvailableSiteModelOption[] }) {
  const router = useRouter();
  const { pending: saving, mutate } = useJsonMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    const res = await mutate("/api/sites", "POST", data);
    if (res.ok) {
      router.push("/admin");
    }
  }

  return <SiteForm onSubmit={handleSubmit} saving={saving} availableModels={availableModels} />;
}
