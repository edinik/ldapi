import {
  reasoningEffortLevels,
  type ReasoningEffortLevel,
} from "@/lib/site-model-capabilities";

export type AiSettingsInput = {
  baseUrl?: unknown;
  apiKey?: unknown;
  model?: unknown;
  reasoningEffort?: unknown;
};

export type StoredAiSettings = {
  baseUrl: string | null;
  apiKey: string | null;
  model: string | null;
  reasoningEffort: ReasoningEffortLevel | null;
};

export type ParsedAiSettings = {
  baseUrl: string | null;
  apiKey: string | null;
  model: string | null;
  reasoningEffort: ReasoningEffortLevel | null;
};

export type AiConnectionInput = {
  baseUrl?: unknown;
  apiKey?: unknown;
};

export type OpenAiCompatibleConnectionResult =
  | {
      ok: true;
      connection: {
        baseUrl: string;
        apiKey: string;
      };
    }
  | {
      ok: false;
      error: string;
    };

export type OpenAiCompatibleConfigResult =
  | {
      ok: true;
      config: {
        baseUrl: string;
        apiKey: string;
        model: string;
        reasoningEffort: ReasoningEffortLevel | null;
      };
    }
  | {
      ok: false;
      error: string;
    };

function trimmedString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBaseUrl(value: string | null | undefined) {
  return (value || "https://api.openai.com/v1").replace(/\/+$/, "");
}

function requiredValue(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function parseReasoningEffort(value: unknown): ReasoningEffortLevel | null {
  const parsed = trimmedString(value);
  return parsed && reasoningEffortLevels.includes(parsed as ReasoningEffortLevel)
    ? (parsed as ReasoningEffortLevel)
    : null;
}

function resolveConnectionValues(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  stored?: StoredAiSettings | null,
  input?: AiConnectionInput,
) {
  return {
    baseUrl: normalizeBaseUrl(requiredValue(trimmedString(input?.baseUrl), stored?.baseUrl, env.AI_BASE_URL)),
    apiKey: requiredValue(trimmedString(input?.apiKey), stored?.apiKey, env.AI_API_KEY),
  };
}

export function maskSecret(value: string | null | undefined) {
  if (!value) return "";
  if (value.length < 12) return "已配置";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function parseAiSettingsPayload(input: AiSettingsInput): ParsedAiSettings {
  const baseUrl = trimmedString(input.baseUrl);
  return {
    baseUrl: baseUrl ? normalizeBaseUrl(baseUrl) : null,
    apiKey: trimmedString(input.apiKey),
    model: trimmedString(input.model),
    reasoningEffort: parseReasoningEffort(input.reasoningEffort),
  };
}

export function resolveOpenAiCompatibleConnection(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  stored?: StoredAiSettings | null,
  input?: AiConnectionInput,
): OpenAiCompatibleConnectionResult {
  const connection = resolveConnectionValues(env, stored, input);
  if (!connection.apiKey) {
    return { ok: false, error: "缺少 AI 配置：AI_API_KEY" };
  }

  return {
    ok: true,
    connection: {
      baseUrl: connection.baseUrl,
      apiKey: connection.apiKey,
    },
  };
}

export function resolveOpenAiCompatibleConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  stored?: StoredAiSettings | null,
): OpenAiCompatibleConfigResult {
  const { baseUrl, apiKey } = resolveConnectionValues(env, stored);
  const model = requiredValue(stored?.model, env.AI_MODEL);
  const reasoningEffort = parseReasoningEffort(stored?.reasoningEffort);
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
      baseUrl,
      apiKey,
      model,
      reasoningEffort,
    },
  };
}
