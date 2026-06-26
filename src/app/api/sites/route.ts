import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sites, siteModels, models } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/session";

export async function GET() {
  const allSites = await db.query.sites.findMany({
    with: {
      siteModels: {
        with: { model: true },
      },
    },
    orderBy: (sites, { desc }) => [desc(sites.createdAt)],
  });

  const result = allSites.map((site) => ({
    ...site,
    models: site.siteModels.map((sm) => sm.model.name),
    siteModels: undefined,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();
  const { modelNames, ...siteData } = body;

  const [newSite] = await db.insert(sites).values(siteData).returning();

  if (modelNames && Array.isArray(modelNames) && modelNames.length > 0) {
    for (const name of modelNames) {
      let [model] = await db.select().from(models).where(eq(models.name, name));
      if (!model) {
        [model] = await db.insert(models).values({ name }).returning();
      }
      await db.insert(siteModels).values({ siteId: newSite.id, modelId: model.id });
    }
  }

  return NextResponse.json(newSite, { status: 201 });
}
