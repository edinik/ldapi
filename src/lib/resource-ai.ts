import { openAiResearchTools } from "@/lib/openai-compatible-research";
import {
  parseResourceAiSuggestion,
  type ResourceAiParseResult,
  type ResourceAiRequest,
  type ResourceAiSuggestion,
} from "@/lib/resource-ai-contract";
import type { ReasoningEffortLevel } from "@/lib/site-model-capabilities";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

type AiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  reasoningEffort?: ReasoningEffortLevel | null;
};

type GenerateResourceAiInput = {
  request: ResourceAiRequest;
  config: AiConfig;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
};

export type ResourceAiGenerationResult =
  | { ok: true; suggestion: ResourceAiSuggestion }
  | { ok: false; error: string };

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function buildResourceAiPrompt(request: ResourceAiRequest): ChatMessage[] {
  const preferredSources = [
    request.githubUrl ? `GitHub：${request.githubUrl}` : null,
    request.officialUrl ? `官网：${request.officialUrl}` : null,
  ].filter(Boolean);
  const sourceInstruction =
    preferredSources.length > 0
      ? `必须先访问并核对以下用户提供的来源，再用搜索结果交叉验证：\n${preferredSources.join("\n")}`
      : "用户没有提供来源地址，请按标题搜索项目的官方站点、官方 GitHub 和可信演示入口。";
  const existingTags = request.existingTags.length > 0 ? request.existingTags.join("、") : "无";

  return [
    {
      role: "system",
      content:
        "你是工具项目资料研究助手。请使用研究工具核对真实资料，并只输出一个 JSON 对象，不要输出 Markdown、解释或额外文本。" +
        "description 必须是一句简洁中文简介；tags 返回 3 到 6 个短标签并尽量复用已有标签；" +
        "githubUrl、officialUrl、demoUrl 只能填写已确认的 HTTP(S) 地址，无法确认时填 null，禁止猜测链接。",
    },
    {
      role: "user",
      content:
        `请研究工具项目“${request.title}”。\n${sourceInstruction}\n` +
        `系统已有标签：${existingTags}\n\n` +
        "返回结构：\n" +
        '{"description":"一句话中文简介","tags":["标签1","标签2","标签3"],"githubUrl":null,"officialUrl":null,"demoUrl":null}',
    },
  ];
}

function extractJsonObject(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`$/i);
  const content = fenced ? fenced[1].trim() : trimmed;
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  return start >= 0 && end > start ? content.slice(start, end + 1) : content;
}

export function parseResourceAiSuggestionContent(
  value: string,
): ResourceAiParseResult<ResourceAiSuggestion> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonObject(value));
  } catch {
    return { ok: false, error: "AI 返回内容不是有效 JSON" };
  }
  return parseResourceAiSuggestion(parsed);
}

function getAssistantContent(value: unknown) {
  const choices = asRecord(value)?.choices;
  if (!Array.isArray(choices)) return null;
  const message = asRecord(asRecord(choices[0])?.message);
  const content = message?.content;
  return typeof content === "string" ? content : null;
}

function getAssistantDeltaContent(value: unknown) {
  const choices = asRecord(value)?.choices;
  if (!Array.isArray(choices)) return null;
  const delta = asRecord(asRecord(choices[0])?.delta);
  const content = delta?.content;
  return typeof content === "string" ? content : null;
}

function parseAssistantResponse(
  text: string,
  contentType: string | null,
): ResourceAiParseResult<string> {
  if (contentType?.toLowerCase().includes("text/event-stream") || text.trimStart().startsWith("data:")) {
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
        return { ok: false, error: "AI 流式返回中包含无效 JSON 数据块" };
      }
      content += getAssistantDeltaContent(payload) || getAssistantContent(payload) || "";
    }
    return content
      ? { ok: true, value: content }
      : { ok: false, error: "AI 流式返回中缺少生成内容" };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return { ok: false, error: "AI 返回内容不是有效 JSON" };
  }
  const content = getAssistantContent(payload);
  return content
    ? { ok: true, value: content }
    : { ok: false, error: "AI 返回中缺少 message.content" };
}

export async function generateResourceAiSuggestion({
  request,
  config,
  fetcher = fetch,
  signal,
}: GenerateResourceAiInput): Promise<ResourceAiGenerationResult> {
  let response: Response;
  try {
    response = await fetcher(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        ...(config.reasoningEffort ? { reasoning_effort: config.reasoningEffort } : {}),
        tools: openAiResearchTools,
        stream: true,
        stream_options: { include_usage: true },
        messages: buildResourceAiPrompt(request),
        temperature: 0.2,
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: "AI 请求已取消或超时" };
    }
    return { ok: false, error: "AI 请求失败，请检查服务地址和网络后重试" };
  }

  const responseText = await response.text();
  if (!response.ok) return { ok: false, error: `AI 请求失败：HTTP ${response.status}` };

  const assistant = parseAssistantResponse(responseText, response.headers.get("content-type"));
  if (!assistant.ok) return assistant;

  const suggestion = parseResourceAiSuggestionContent(assistant.value);
  return suggestion.ok ? { ok: true, suggestion: suggestion.value } : suggestion;
}

