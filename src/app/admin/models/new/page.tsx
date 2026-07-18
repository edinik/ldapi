"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import ModelForm from "@/components/ModelForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useJsonMutation } from "@/lib/admin/use-json-mutation";

export default function NewModelPage() {
  const router = useRouter();
  const { pending: saving, mutate } = useJsonMutation();

  async function handleSubmit(data: Record<string, unknown>) {
    const res = await mutate("/api/models", "POST", data);

    if (res.ok) {
      router.push("/admin/models");
    }
  }

  return (
    <main className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-[min(100%-2rem,1200px)]">
        <header className="mb-8 flex items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <Link href="/admin/models" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              返回模型管理
            </Link>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">添加模型</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              录入模型能力、模态、价格、上下文限制和主页展示信息。
            </p>
          </div>
          <ThemeToggle />
        </header>
        <ModelForm onSubmit={handleSubmit} saving={saving} />
      </div>
    </main>
  );
}
