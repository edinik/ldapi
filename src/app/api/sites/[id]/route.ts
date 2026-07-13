import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requireAuth } from "@/lib/session";
import { getSiteModelPayloads } from "@/lib/site-model-payload";
import { deleteSite, updateSite, type SiteWrite } from "@/server/admin/sites";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const siteId = parseInt(id);
  const body = await req.json();
  const { modelNames, siteModels: siteModelPayloads, ...siteData } = body;
  const modelsToSync = getSiteModelPayloads({ modelNames, siteModels: siteModelPayloads });

  await updateSite(
    db,
    siteId,
    siteData as SiteWrite,
    modelsToSync,
    Array.isArray(siteModelPayloads) || Array.isArray(modelNames),
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const siteId = parseInt(id);

  await deleteSite(db, siteId);
  return NextResponse.json({ success: true });
}
