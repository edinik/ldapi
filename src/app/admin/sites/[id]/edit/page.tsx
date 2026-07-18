import { db } from "@/db";
import { sites } from "@/db/schema";
import { ThemeToggle } from "@/components/ThemeToggle";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { notFound } from "next/navigation";
import EditSiteClient from "./EditSiteClient";
import Link from "next/link";
import { parseReasoningEffortLevels } from "@/lib/site-model-capabilities";

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const siteId = parseInt(id);

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
    with: { siteModels: { with: { model: true } } },
  });

  if (!site) notFound();
  const availableModels = await db.query.models.findMany({
    where: (models, { ne }) => ne(models.isActive, false),
    columns: { name: true, developer: true, modelId: true },
    orderBy: (models, { asc }) => [asc(models.developer), asc(models.name)],
  });

  const siteData = {
    ...site,
    modelNames: site.siteModels.map((sm) => sm.model.name),
    siteModels: site.siteModels.map((sm) => ({
      name: sm.model.name,
      supportsToolCallingOverride: sm.supportsToolCallingOverride,
      supportsVisionOverride: sm.supportsVisionOverride,
      supportsTemperatureControlOverride: sm.supportsTemperatureControlOverride,
      supportsReasoningOverride: sm.supportsReasoningOverride,
      reasoningEffortLevelsOverride:
        sm.reasoningEffortLevelsOverride == null
          ? null
          : parseReasoningEffortLevels(sm.reasoningEffortLevelsOverride),
      supportsWebSearchOverride: sm.supportsWebSearchOverride,
    })),
  };

  return (
    <main className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-[min(100%-2rem,56rem)]">
        <header className="mb-8 flex items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <Link href="/admin" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              返回站点管理
            </Link>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">编辑站点</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              正在维护 {site.name} 的目录信息。保存后公开目录会使用最新数据。
            </p>
          </div>
          <ThemeToggle />
        </header>
        <EditSiteClient site={siteData} availableModels={availableModels} />
      </div>
    </main>
  );
}
