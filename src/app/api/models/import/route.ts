import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { createModelImportTemplate, parseModelImportInput } from "@/lib/model-import";
import { requireAuth } from "@/lib/session";
import { importModels } from "@/server/admin/models";

type ImportRequestBody = {
  content?: unknown;
  dryRun?: unknown;
  upsert?: unknown;
};

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  return NextResponse.json({
    template: createModelImportTemplate(),
  });
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = (await req.json()) as ImportRequestBody;
  const content = typeof body.content === "string" ? body.content : "";
  const dryRun = body.dryRun !== false;
  const upsert = body.upsert !== false;
  const parsed = parseModelImportInput(content);

  if (parsed.errors.length > 0) {
    return NextResponse.json({ errors: parsed.errors, summary: { created: 0, updated: 0, skipped: 0 } }, { status: 400 });
  }

  return NextResponse.json(await importModels(db, parsed.items, { dryRun, upsert }));
}
