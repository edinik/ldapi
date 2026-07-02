import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { parseResourcePayload } from "@/lib/resource-payload";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const resourceId = parseInt(id);
  const body = await req.json();
  const resourceData = parseResourcePayload(body);

  if (!resourceData.title) {
    return NextResponse.json({ error: "资源标题不能为空" }, { status: 400 });
  }

  await db
    .update(resources)
    .set({ ...resourceData, updatedAt: new Date() })
    .where(eq(resources.id, resourceId));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const resourceId = parseInt(id);

  await db.delete(resources).where(eq(resources.id, resourceId));
  return NextResponse.json({ success: true });
}
