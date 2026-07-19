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

export type ModelImportTokenUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
};

export type ModelImportGenerationMetadata = {
  requestedModel: string;
  responseModel: string | null;
  usage: ModelImportTokenUsage;
};

export type ModelImportGenerationResult =
  | {
      ok: true;
      content: string;
      metadata: ModelImportGenerationMetadata;
    }
  | {
      ok: false;
      error: string;
      metadata?: ModelImportGenerationMetadata;
    };

type ParsedAssistantResponse =
  | {
      ok: true;
      content: string;
      responseModel: string | null;
      usage: ModelImportTokenUsage;
    }
  | {
      ok: false;
      error: string;
      responseModel: string | null;
      usage: ModelImportTokenUsage;
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

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function nonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = nonNegativeNumber(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function emptyTokenUsage(): ModelImportTokenUsage {
  return {
    inputTokens: null,
    outputTokens: null,
    cachedTokens: null,
    reasoningTokens: null,
    totalTokens: null,
  };
}

function normalizeTokenUsage(value: unknown): ModelImportTokenUsage {
  const usage = asRecord(value);
  if (!usage) return emptyTokenUsage();

  const promptDetails = asRecord(usage.prompt_tokens_details);
  const completionDetails = asRecord(usage.completion_tokens_details);
  const cacheReadTokens = nonNegativeNumber(usage.cache_read_input_tokens);
  const cacheCreationTokens = nonNegativeNumber(usage.cache_creation_input_tokens);
  let cachedTokens = firstNumber(promptDetails?.cached_tokens, usage.cached_tokens);

  if (cachedTokens === null && (cacheReadTokens !== null || cacheCreationTokens !== null)) {
    cachedTokens = (cacheReadTokens ?? 0) + (cacheCreationTokens ?? 0);
  }

  return {
    inputTokens: firstNumber(usage.prompt_tokens, usage.input_tokens),
    outputTokens: firstNumber(usage.completion_tokens, usage.output_tokens),
    cachedTokens,
    reasoningTokens: firstNumber(completionDetails?.reasoning_tokens, usage.reasoning_tokens),
    totalTokens: nonNegativeNumber(usage.total_tokens),
  };
}

function getResponseModel(payload: unknown) {
  const model = asRecord(payload)?.model;
  return typeof model === "string" && model.trim() ? model.trim() : null;
}

function getResponseUsage(payload: unknown) {
  const record = asRecord(payload);
  if (!record || !Object.prototype.hasOwnProperty.call(record, "usage")) return null;
  return normalizeTokenUsage(record.usage);
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
    return {
      ok: false as const,
      error: "AI 返回内容不是有效 JSON",
      responseModel: null,
      usage: emptyTokenUsage(),
    };
  }

  const responseModel = getResponseModel(payload);
  const usage = getResponseUsage(payload) ?? emptyTokenUsage();
  const assistantContent = getAssistantContent(payload);
  if (!assistantContent) {
    return { ok: false as const, error: "AI 返回中缺少 message.content", responseModel, usage };
  }

  return { ok: true as const, content: assistantContent, responseModel, usage };
}

function parseSseAssistantContent(text: string): ParsedAssistantResponse {
  let content = "";
  let responseModel: string | null = null;
  let usage = emptyTokenUsage();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) continue;

    const data = line.slice("data:".length).trim();
    if (!data || data === "[DONE]") continue;

    let payload: unknown;
    try {
      payload = JSON.parse(data);
    } catch {
      return {
        ok: false,
        error: "AI 流式返回中包含无效 JSON 数据块",
        responseModel,
        usage,
      };
    }

    responseModel = getResponseModel(payload) ?? responseModel;
    usage = getResponseUsage(payload) ?? usage;

    const deltaContent = getAssistantDeltaContent(payload);
    if (deltaContent) {
      content += deltaContent;
      continue;
    }

    const messageContent = getAssistantContent(payload);
    if (messageContent) content += messageContent;
  }

  if (!content) {
    return { ok: false, error: "AI 流式返回中缺少 assistant 内容", responseModel, usage };
  }

  return { ok: true, content, responseModel, usage };
}

function parseAssistantResponse(text: string, contentType: string | null): ParsedAssistantResponse {
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
}: GenerateInput): Promise<ModelImportGenerationResult> {
  const baseMetadata: ModelImportGenerationMetadata = {
    requestedModel: config.model,
    responseModel: null,
    usage: emptyTokenUsage(),
  };
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
    return {
      ok: false,
      error: `AI 请求失败：HTTP ${response.status}${getErrorSnippet(responseText)}`,
      metadata: baseMetadata,
    };
  }

  const assistantContent = parseAssistantResponse(responseText, response.headers.get("content-type"));
  const metadata: ModelImportGenerationMetadata = {
    requestedModel: config.model,
    responseModel: assistantContent.responseModel,
    usage: assistantContent.usage,
  };
  if (!assistantContent.ok) {
    return { ok: false, error: assistantContent.error, metadata };
  }

  const validation = validateGeneratedImportContent(assistantContent.content);
  if (!validation.ok) {
    return { ok: false, error: validation.error, metadata };
  }

  return { ok: true, content: validation.content, metadata };
}
