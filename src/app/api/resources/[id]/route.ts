import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requireAuth } from "@/lib/session";
import { parseResourcePayload } from "@/lib/resource-payload";
import { deleteResource, updateResource } from "@/server/admin/resources";

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

  await updateResource(db, resourceId, resourceData);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const resourceId = parseInt(id);

  await deleteResource(db, resourceId);
  return NextResponse.json({ success: true });
}
