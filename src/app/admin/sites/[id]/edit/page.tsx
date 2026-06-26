import { db } from "@/db";
import { sites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { notFound } from "next/navigation";
import EditSiteClient from "./EditSiteClient";

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">编辑站点: {site.name}</h1>
        <EditSiteClient site={siteData} />
      </div>
    </div>
  );
}
