import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";
import { createModelImportTemplate, parseModelImportInput } from "@/lib/model-import";
import { requireAuth } from "@/lib/session";

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

  const summary = { created: 0, updated: 0, skipped: 0 };
  const rows = [];

  for (const item of parsed.items) {
    const existing = await db.query.models.findFirst({
      where: item.modelId ? or(eq(models.modelId, item.modelId), eq(models.name, item.name)) : eq(models.name, item.name),
    });

    const action = existing ? (upsert ? "update" : "skip") : "create";
    rows.push({ name: item.name, modelId: item.modelId, action });

    if (existing) {
      if (!upsert) {
        summary.skipped += 1;
        continue;
      }

      summary.updated += 1;
      if (!dryRun) {
        await db
          .update(models)
          .set({ ...item, updatedAt: new Date() })
          .where(eq(models.id, existing.id));
      }
      continue;
    }

    summary.created += 1;
    if (!dryRun) {
      await db.insert(models).values(item);
    }
  }

  return NextResponse.json({ dryRun, summary, rows });
}
