import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resolveOpenAiCompatibleConfig } from "@/lib/ai-settings";
import { getStoredAiSettings } from "@/lib/ai-settings-store";
import { generateResourceAiSuggestion } from "@/lib/resource-ai";
import { parseResourceAiRequest } from "@/lib/resource-ai-contract";
import { requireAuth } from "@/lib/session";

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求内容不是有效 JSON" }, { status: 400 });
  }

  const request = parseResourceAiRequest(body);
  if (!request.ok) {
    return NextResponse.json({ error: request.error }, { status: 400 });
  }

  const storedSettings = await getStoredAiSettings(db);
  const config = resolveOpenAiCompatibleConfig(process.env, storedSettings);
  if (!config.ok) {
    return NextResponse.json({ error: config.error }, { status: 500 });
  }

  const result = await generateResourceAiSuggestion({
    request: request.value,
    config: config.config,
    signal: req.signal,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ suggestion: result.suggestion });
}
