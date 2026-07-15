import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import EditModelClient from "./EditModelClient";

export default async function EditModelPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const modelId = parseInt(id);

  const model = await db.query.models.findFirst({
    where: eq(models.id, modelId),
  });

  if (!model) notFound();

  const modelData = {
    ...model,
    createdAt: undefined,
    updatedAt: undefined,
  };

  return (
    <main className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-[min(100%-2rem,1200px)]">
        <header className="mb-8 border-b border-border pb-6">
          <Link href="/admin/models" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            返回模型管理
          </Link>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">编辑模型</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            正在维护 {model.name} 的模型资料和展示信息。
          </p>
        </header>
        <EditModelClient model={modelData} />
      </div>
    </main>
  );
}
