"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ResourceForm from "@/components/ResourceForm";

export default function NewResourceClient({ tagOptions }: { tagOptions: string[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: Record<string, unknown>) {
    setSaving(true);
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin/resources");
    }

    setSaving(false);
  }

  return <ResourceForm onSubmit={handleSubmit} saving={saving} tagOptions={tagOptions} />;
}
