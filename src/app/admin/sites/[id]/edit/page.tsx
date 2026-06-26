import { db } from "@/db";
import { sites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { notFound } from "next/navigation";
import EditSiteClient from "./EditSiteClient";
import Link from "next/link";

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const siteId = parseInt(id);

  const site = await db.query.sites.findFirst({
    where: eq(sites.id, siteId),
    with: { siteModels: { with: { model: true } } },
  });

  if (!site) notFound();

  const siteData = {
    ...site,
    modelNames: site.siteModels.map((sm) => sm.model.name),
  };

  return (
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container max-w-4xl">
        <header className="mb-8 border-b border-[var(--hairline)] pb-6">
          <Link href="/admin" className="ld-link text-sm">
            返回站点管理
          </Link>
          <h1 className="ld-display mt-4 text-5xl leading-tight text-[var(--ink)]">编辑站点</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            正在维护 {site.name} 的目录信息。保存后公开目录会使用最新数据。
          </p>
        </header>
        <EditSiteClient site={siteData} />
      </div>
    </main>
  );
}
