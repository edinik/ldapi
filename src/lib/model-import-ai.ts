import { parseModelImportInput } from "@/lib/model-import";

export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type PromptInput = {
  query: string;
  template: string;
  today: string;
};

type ConfigResult =
  | {
      ok: true;
      config: {
        baseUrl: string;
        apiKey: string;
        model: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

type ValidationResult =
  | {
      ok: true;
      content: string;
    }
  | {
      ok: false;
      error: string;
    };

type GenerateInput = {
  query: string;
  template: string;
  today: string;
  config: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };
  fetcher?: typeof fetch;
};

const modelResearchTools = [
  { type: "code_interpreter" },
  { type: "web_search", enable_image_understanding: true },
  { type: "x_search", enable_image_understanding: true },
];

function requiredEnv(env: NodeJS.ProcessEnv | Record<string, string | undefined>, name: string) {
  const value = env[name]?.trim();
  return value ? value : null;
}

function normalizeBaseUrl(value: string | undefined) {
  const baseUrl = value?.trim() || "https://api.openai.com/v1";
  return baseUrl.replace(/\/+$/, "");
}

export function getOpenAiCompatibleConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined>): ConfigResult {
  const apiKey = requiredEnv(env, "AI_API_KEY");
  const model = requiredEnv(env, "AI_MODEL");
  const missing = [
    !apiKey ? "AI_API_KEY" : null,
    !model ? "AI_MODEL" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    return { ok: false, error: `缺少 AI 配置：${missing.join(", ")}` };
  }

  if (!apiKey || !model) {
    return { ok: false, error: "缺少 AI 配置：AI_API_KEY, AI_MODEL" };
  }

  return {
    ok: true,
    config: {
      baseUrl: normalizeBaseUrl(env.AI_BASE_URL),
      apiKey,
      model,
    },
  };
}

export function buildModelImportPrompt({ query, template, today }: PromptInput): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "你是 AI 模型资料整理助手。请基于官方文档、价格页和模型说明整理信息。" +
        "字段缺失时填 null、false 或空字符串；价格统一使用美元 / M tokens；日期使用 YYYY-MM-DD。" +
        "只输出 JSON，不要输出 Markdown、解释或额外文本。",
    },
    {
      role: "user",
      content:
        `今天是 ${today}。请整理“${query.trim()}”相关模型信息，返回必须符合下面 JSON 模板结构。\n\n` +
        `JSON 模板：\n${template}`,
    },
  ];
}

export function extractJsonContent(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1).trim();
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1).trim();
  }

  return trimmed;
}

export function validateGeneratedImportContent(aiContent: string): ValidationResult {
  const content = extractJsonContent(aiContent);
  const parsed = parseModelImportInput(content);
  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    return { ok: false, error: first.index >= 0 ? `第 ${first.index + 1} 条：${first.message}` : first.message };
  }

  if (parsed.items.length === 0) {
    return { ok: false, error: "AI 未返回任何模型记录" };
  }

  return { ok: true, content };
}

function getAssistantContent(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return null;
  const first = choices[0];
  if (!first || typeof first !== "object") return null;
  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== "object") return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : null;
}

function getAssistantDeltaContent(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) return null;
  const first = choices[0];
  if (!first || typeof first !== "object") return null;
  const delta = (first as { delta?: unknown }).delta;
  if (!delta || typeof delta !== "object") return null;
  const content = (delta as { content?: unknown }).content;
  return typeof content === "string" ? content : null;
}

function buildChatCompletionRequestBody({ query, template, today, model }: PromptInput & { model: string }) {
  return {
    model,
    tools: modelResearchTools,
    stream: true,
    messages: buildModelImportPrompt({ query, template, today }),
    temperature: 0.2,
    stream_options: { include_usage: true },
  };
}

function getErrorSnippet(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? `：${normalized.slice(0, 500)}` : "";
}

function parseJsonAssistantContent(text: string) {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return { ok: false as const, error: "AI 返回内容不是有效 JSON" };
  }

  const assistantContent = getAssistantContent(payload);
  if (!assistantContent) {
    return { ok: false as const, error: "AI 返回中缺少 message.content" };
  }

  return { ok: true as const, content: assistantContent };
}

function parseSseAssistantContent(text: string) {
  let content = "";

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) continue;

    const data = line.slice("data:".length).trim();
    if (!data || data === "[DONE]") continue;

    let payload: unknown;
    try {
      payload = JSON.parse(data);
    } catch {
      return { ok: false as const, error: "AI 流式返回中包含无效 JSON 数据块" };
    }

    const deltaContent = getAssistantDeltaContent(payload);
    if (deltaContent) {
      content += deltaContent;
      continue;
    }

    const messageContent = getAssistantContent(payload);
    if (messageContent) content += messageContent;
  }

  if (!content) {
    return { ok: false as const, error: "AI 流式返回中缺少 assistant 内容" };
  }

  return { ok: true as const, content };
}

function parseAssistantResponse(text: string, contentType: string | null) {
  if (contentType?.toLowerCase().includes("text/event-stream") || text.trimStart().startsWith("data:")) {
    return parseSseAssistantContent(text);
  }

  return parseJsonAssistantContent(text);
}

export async function generateModelImportContent({
  query,
  template,
  today,
  config,
  fetcher = fetch,
}: GenerateInput): Promise<ValidationResult> {
  const response = await fetcher(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildChatCompletionRequestBody({ query, template, today, model: config.model })),
  });

  const responseText = await response.text();
  if (!response.ok) {
    return { ok: false, error: `AI 请求失败：HTTP ${response.status}${getErrorSnippet(responseText)}` };
  }

  const assistantContent = parseAssistantResponse(responseText, response.headers.get("content-type"));
  if (!assistantContent.ok) {
    return assistantContent;
  }

  return validateGeneratedImportContent(assistantContent.content);
}
