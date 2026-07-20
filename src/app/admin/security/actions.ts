"use server";

import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { parseAiSettingsPayload, resolveOpenAiCompatibleConnection } from "@/lib/ai-settings";
import { getStoredAiSettings, saveAiSettings } from "@/lib/ai-settings-store";
import {
  listOpenAiCompatibleModels,
  type OpenAiCompatibleModelListResult,
} from "@/lib/openai-compatible-models";
import { requireAdmin } from "@/lib/session";
import { generateTotpSecret, verifyTotpCode } from "@/lib/totp";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function generateTotpSetup() {
  const session = await requireAdmin();
  const secret = generateTotpSecret();

  await db
    .update(adminUsers)
    .set({ pendingTotpSecret: secret })
    .where(eq(adminUsers.id, session.userId));

  redirect("/admin/security?success=generated");
}

export async function confirmTotpSetup(formData: FormData) {
  const session = await requireAdmin();
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.userId))
    .limit(1);

  if (!user?.pendingTotpSecret) {
    redirect("/admin/security?error=missing-secret");
  }

  if (!verifyTotpCode(user.pendingTotpSecret, formData.get("totpCode"))) {
    redirect("/admin/security?error=invalid-code");
  }

  await db
    .update(adminUsers)
    .set({ totpSecret: user.pendingTotpSecret, pendingTotpSecret: null })
    .where(eq(adminUsers.id, session.userId));

  redirect("/admin/security?success=enabled");
}

export async function disableTotp() {
  const session = await requireAdmin();

  await db
    .update(adminUsers)
    .set({ totpSecret: null, pendingTotpSecret: null })
    .where(eq(adminUsers.id, session.userId));

  redirect("/admin/security?success=disabled");
}

export async function saveAiGenerationSettings(formData: FormData) {
  await requireAdmin();

  await saveAiSettings(db, parseAiSettingsPayload({
    baseUrl: formData.get("baseUrl"),
    apiKey: formData.get("apiKey"),
    model: formData.get("model"),
    reasoningEffort: formData.get("reasoningEffort"),
  }));

  redirect("/admin/security?success=ai-saved");
}

export async function fetchAiGenerationModels(formData: FormData): Promise<OpenAiCompatibleModelListResult> {
  await requireAdmin();

  const storedSettings = await getStoredAiSettings(db);
  const connection = resolveOpenAiCompatibleConnection(process.env, storedSettings, {
    baseUrl: formData.get("baseUrl"),
    apiKey: formData.get("apiKey"),
  });
  if (!connection.ok) return connection;

  return listOpenAiCompatibleModels(connection.connection);
}
