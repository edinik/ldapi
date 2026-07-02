import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { parseStoredResourceTags } from "@/lib/resource-payload";
import EditResourceClient from "./EditResourceClient";

function getTagOptions(rows: { tags: string }[]) {
  return Array.from(new Set(rows.flatMap((row) => parseStoredResourceTags(row.tags)))).sort((a, b) => {
    const normalizedA = a.toLowerCase();
    const normalizedB = b.toLowerCase();
    if (normalizedA < normalizedB) return -1;
    if (normalizedA > normalizedB) return 1;
    return 0;
  });
}

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const resourceId = parseInt(id);

  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, resourceId),
  });

  if (!resource) notFound();

  const existingResources = await db.select({ tags: resources.tags }).from(resources);
  const tagOptions = getTagOptions(existingResources);

  return (
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container max-w-4xl">
        <header className="mb-8 border-b border-[var(--hairline)] pb-6">
          <Link href="/admin/resources" className="ld-link text-sm">
            返回资源管理
          </Link>
          <h1 className="ld-display mt-4 text-5xl leading-tight text-[var(--ink)]">编辑资源</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            正在维护 {resource.title}。保存后首页资源 tab 会使用最新数据。
          </p>
        </header>
        <EditResourceClient resource={resource} tagOptions={tagOptions} />
      </div>
    </main>
  );
}
