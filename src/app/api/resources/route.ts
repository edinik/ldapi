import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { requireAuth } from "@/lib/session";
import { parseResourcePayload } from "@/lib/resource-payload";
import { createResource } from "@/server/admin/resources";

export async function GET() {
  const allResources = await db.select().from(resources).orderBy(desc(resources.updatedAt), desc(resources.id));
  return NextResponse.json(allResources);
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();
  const resourceData = parseResourcePayload(body);

  if (!resourceData.title) {
    return NextResponse.json({ error: "资源标题不能为空" }, { status: 400 });
  }

  const newResource = await createResource(db, resourceData);
  return NextResponse.json(newResource, { status: 201 });
}
