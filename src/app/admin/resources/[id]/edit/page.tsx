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
    <main className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-[min(100%-2rem,56rem)]">
        <header className="mb-8 border-b border-border pb-6">
          <Link href="/admin/resources" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            返回资源管理
          </Link>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">编辑资源</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            正在维护 {resource.title}。保存后首页资源 tab 会使用最新数据。
          </p>
        </header>
        <EditResourceClient resource={resource} tagOptions={tagOptions} />
      </div>
    </main>
  );
}
