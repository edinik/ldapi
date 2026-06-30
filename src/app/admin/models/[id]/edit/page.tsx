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
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container">
        <header className="mb-8 border-b border-[var(--hairline)] pb-6">
          <Link href="/admin/models" className="ld-link text-sm">
            返回模型管理
          </Link>
          <h1 className="ld-display mt-4 text-5xl leading-tight text-[var(--ink)]">编辑模型</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            正在维护 {model.name} 的模型资料和展示信息。
          </p>
        </header>
        <EditModelClient model={modelData} />
      </div>
    </main>
  );
}
