import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/session";
import NewSiteClient from "./NewSiteClient";

export default async function NewSitePage() {
  await requireAdmin();
  const availableModels = await db.query.models.findMany({
    where: (models, { ne }) => ne(models.isActive, false),
    columns: { name: true, developer: true, modelId: true },
    orderBy: (models, { asc }) => [asc(models.developer), asc(models.name)],
  });

  return (
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container max-w-4xl">
        <header className="mb-8 border-b border-[var(--hairline)] pb-6">
          <Link href="/admin" className="ld-link text-sm">
            返回站点管理
          </Link>
          <h1 className="ld-display mt-4 text-5xl leading-tight text-[var(--ink)]">添加站点</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            录入新的 AI 公益站入口、模型支持、签到方式和使用限制，公开目录会实时读取活跃站点。
          </p>
        </header>
        <NewSiteClient availableModels={availableModels} />
      </div>
    </main>
  );
}
