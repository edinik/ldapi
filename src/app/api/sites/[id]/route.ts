import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sites, siteModels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/session";
import { getSiteModelPayloads, syncSiteModels } from "@/lib/site-model-payload";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const siteId = parseInt(id);
  const body = await req.json();
  const { modelNames, siteModels: siteModelPayloads, ...siteData } = body;
  const modelsToSync = getSiteModelPayloads({ modelNames, siteModels: siteModelPayloads });

  await db
    .update(sites)
    .set({ ...siteData, updatedAt: new Date() })
    .where(eq(sites.id, siteId));

  if (Array.isArray(siteModelPayloads) || Array.isArray(modelNames)) {
    await db.delete(siteModels).where(eq(siteModels.siteId, siteId));
    await syncSiteModels(siteId, modelsToSync);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const siteId = parseInt(id);

  await db.delete(sites).where(eq(sites.id, siteId));
  return NextResponse.json({ success: true });
}
