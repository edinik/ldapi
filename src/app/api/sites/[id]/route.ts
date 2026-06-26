import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sites, siteModels, models } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const siteId = parseInt(id);
  const body = await req.json();
  const { modelNames, ...siteData } = body;

  await db
    .update(sites)
    .set({ ...siteData, updatedAt: new Date() })
    .where(eq(sites.id, siteId));

  if (modelNames && Array.isArray(modelNames)) {
    await db.delete(siteModels).where(eq(siteModels.siteId, siteId));
    for (const name of modelNames) {
      let [model] = await db.select().from(models).where(eq(models.name, name));
      if (!model) {
        [model] = await db.insert(models).values({ name }).returning();
      }
      await db.insert(siteModels).values({ siteId, modelId: model.id });
    }
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
