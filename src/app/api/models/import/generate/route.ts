import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resolveOpenAiCompatibleConfig } from "@/lib/ai-settings";
import { getStoredAiSettings } from "@/lib/ai-settings-store";
import { createModelImportTemplate } from "@/lib/model-import";
import { generateModelImportContent } from "@/lib/model-import-ai";
import { requireAuth } from "@/lib/session";

type GenerateRequestBody = {
  query?: unknown;
};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = (await req.json()) as GenerateRequestBody;
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "请输入模型或厂商名称" }, { status: 400 });
  }

  const storedSettings = await getStoredAiSettings(db);
  const config = resolveOpenAiCompatibleConfig(process.env, storedSettings);
  if (!config.ok) {
    return NextResponse.json({ error: config.error }, { status: 500 });
  }

  const result = await generateModelImportContent({
    query,
    template: createModelImportTemplate(),
    today: todayString(),
    config: config.config,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, metadata: result.metadata }, { status: 502 });
  }

  return NextResponse.json({ content: result.content, metadata: result.metadata });
}
