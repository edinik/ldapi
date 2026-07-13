"use client";

import { useRouter } from "next/navigation";
import ResourceForm from "@/components/ResourceForm";
import { useJsonMutation } from "@/lib/admin/use-json-mutation";

export default function NewResourceClient({ tagOptions }: { tagOptions: string[] }) {
  const router = useRouter();
  const { pending: saving, mutate } = useJsonMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    const res = await mutate("/api/resources", "POST", data);

    if (res.ok) {
      router.push("/admin/resources");
    }
  }

  return <ResourceForm onSubmit={handleSubmit} saving={saving} tagOptions={tagOptions} />;
}
