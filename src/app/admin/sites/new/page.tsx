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
    <main className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-[min(100%-2rem,56rem)]">
        <header className="mb-8 border-b border-border pb-6">
          <Link href="/admin" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            返回站点管理
          </Link>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">添加站点</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            录入新的 AI 公益站入口、模型支持、签到方式和使用限制，公开目录会实时读取活跃站点。
          </p>
        </header>
        <NewSiteClient availableModels={availableModels} />
      </div>
    </main>
  );
}
