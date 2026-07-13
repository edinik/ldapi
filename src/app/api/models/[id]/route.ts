import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requireAuth } from "@/lib/session";
import { parseModelPayload } from "@/lib/model-payload";
import { deleteModel, disableModel, updateModel } from "@/server/admin/models";

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

  await updateModel(db, modelId, modelData);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const modelId = parseInt(id);
  const hard = req.nextUrl.searchParams.get("hard") === "true";

  if (hard) {
    await deleteModel(db, modelId);
  } else {
    await disableModel(db, modelId);
  }

  return NextResponse.json({ success: true });
}
