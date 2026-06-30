import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { parseModelPayload } from "@/lib/model-payload";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const modelId = parseInt(id);
  const body = await req.json();
  const modelData = parseModelPayload(body);

  if (!modelData.name) {
    return NextResponse.json({ error: "模型名称不能为空" }, { status: 400 });
  }

  await db
    .update(models)
    .set({ ...modelData, updatedAt: new Date() })
    .where(eq(models.id, modelId));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const modelId = parseInt(id);

  await db
    .update(models)
    .set({ isActive: false, showOnHome: false, updatedAt: new Date() })
    .where(eq(models.id, modelId));

  return NextResponse.json({ success: true });
}
