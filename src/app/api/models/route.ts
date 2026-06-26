import { NextResponse } from "next/server";
import { db } from "@/db";
import { models } from "@/db/schema";

export async function GET() {
  const allModels = await db.select().from(models).orderBy(models.name);
  return NextResponse.json(allModels);
}
