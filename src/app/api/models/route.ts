import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { models } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { parseModelPayload } from "@/lib/model-payload";

export async function GET() {
  const allModels = await db.select().from(models).orderBy(models.name);
  return NextResponse.json(allModels);
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();
  const modelData = parseModelPayload(body);

  if (!modelData.name) {
    return NextResponse.json({ error: "模型名称不能为空" }, { status: 400 });
  }

  const [newModel] = await db.insert(models).values(modelData).returning();
  return NextResponse.json(newModel, { status: 201 });
}
