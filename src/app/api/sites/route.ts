import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requireAuth } from "@/lib/session";
import { getSiteModelPayloads } from "@/lib/site-model-payload";
import { createSite, type SiteWrite } from "@/server/admin/sites";

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
  const { modelNames, siteModels: siteModelPayloads, ...siteData } = body;
  const modelsToSync = getSiteModelPayloads({ modelNames, siteModels: siteModelPayloads });

  const newSite = await createSite(db, siteData as SiteWrite, modelsToSync);

  return NextResponse.json(newSite, { status: 201 });
}
