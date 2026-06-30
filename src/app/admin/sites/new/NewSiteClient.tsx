"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteForm from "@/components/SiteForm";
import type { AvailableSiteModelOption } from "@/lib/site-model-options";

export default function NewSiteClient({ availableModels }: { availableModels: AvailableSiteModelOption[] }) {
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

  return <SiteForm onSubmit={handleSubmit} saving={saving} availableModels={availableModels} />;
}
