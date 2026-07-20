export type ResourceAiRequest = {
  title: string;
  githubUrl: string | null;
  officialUrl: string | null;
  existingTags: string[];
};

export type ResourceAiSuggestion = {
  description: string;
  tags: string[];
  githubUrl: string | null;
  officialUrl: string | null;
  demoUrl: string | null;
};

export type ResourceAiFormValues = {
  description: string;
  githubUrl: string;
  officialUrl: string;
  demoUrl: string;
  selectedTags: string[];
};

export type ResourceAiMergeResult = {
  values: Omit<ResourceAiFormValues, "selectedTags">;
  candidateTags: string[];
  filledFields: Array<"description" | "githubUrl" | "officialUrl" | "demoUrl">;
};

export type ResourceAiParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function normalizedText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function normalizeTags(value: unknown, limit = 50) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of value) {
    const tag = normalizedText(item);
    const key = tag.toLowerCase();
    if (!tag || tag.length > 30 || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= limit) break;
  }
  return tags;
}

function normalizeHttpUrl(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizeGithubUrl(value: unknown) {
  const normalized = normalizeHttpUrl(value);
  if (!normalized) return null;

  const hostname = new URL(normalized).hostname.toLowerCase();
  return hostname === "github.com" || hostname === "www.github.com" ? normalized : null;
}

function parseOptionalInputUrl(value: unknown, label: string): ResourceAiParseResult<string | null> {
  if (value == null || value === "") return { ok: true, value: null };
  const normalized = normalizeHttpUrl(value);
  return normalized
    ? { ok: true, value: normalized }
    : { ok: false, error: `${label}必须是有效的 HTTP(S) 地址` };
}

function parseOptionalGithubInput(value: unknown): ResourceAiParseResult<string | null> {
  if (value == null || value === "") return { ok: true, value: null };
  const normalized = normalizeGithubUrl(value);
  return normalized
    ? { ok: true, value: normalized }
    : { ok: false, error: "GitHub 地址必须是有效的 github.com HTTP(S) 地址" };
}

export function parseResourceAiRequest(value: unknown): ResourceAiParseResult<ResourceAiRequest> {
  const input = asRecord(value);
  if (!input) return { ok: false, error: "请求内容格式不正确" };

  const title = normalizedText(input.title);
  if (!title) return { ok: false, error: "请先填写资源标题" };
  if (title.length > 200) return { ok: false, error: "资源标题不能超过 200 个字符" };

  const githubUrl = parseOptionalGithubInput(input.githubUrl);
  if (!githubUrl.ok) return githubUrl;
  const officialUrl = parseOptionalInputUrl(input.officialUrl, "官网地址");
  if (!officialUrl.ok) return officialUrl;

  return {
    ok: true,
    value: {
      title,
      githubUrl: githubUrl.value,
      officialUrl: officialUrl.value,
      existingTags: normalizeTags(input.existingTags),
    },
  };
}

export function parseResourceAiSuggestion(value: unknown): ResourceAiParseResult<ResourceAiSuggestion> {
  const suggestion = asRecord(value);
  if (!suggestion) return { ok: false, error: "AI 返回的资源信息格式不正确" };

  const description = normalizedText(suggestion.description);
  if (!description) return { ok: false, error: "AI 返回中缺少一句话简介" };
  if (description.length > 240) return { ok: false, error: "AI 返回的简介过长" };

  const tags = normalizeTags(suggestion.tags, 6);
  if (tags.length < 2) return { ok: false, error: "AI 返回中缺少足够的有效标签" };

  return {
    ok: true,
    value: {
      description,
      tags,
      githubUrl: normalizeGithubUrl(suggestion.githubUrl),
      officialUrl: normalizeHttpUrl(suggestion.officialUrl),
      demoUrl: normalizeHttpUrl(suggestion.demoUrl),
    },
  };
}

export function mergeResourceAiSuggestion(
  current: ResourceAiFormValues,
  suggestion: ResourceAiSuggestion,
): ResourceAiMergeResult {
  const fields = ["description", "githubUrl", "officialUrl", "demoUrl"] as const;
  const values = {
    description: current.description,
    githubUrl: current.githubUrl,
    officialUrl: current.officialUrl,
    demoUrl: current.demoUrl,
  };
  const filledFields: ResourceAiMergeResult["filledFields"] = [];

  for (const field of fields) {
    if (current[field].trim() || !suggestion[field]) continue;
    values[field] = suggestion[field];
    filledFields.push(field);
  }

  const selectedKeys = new Set(current.selectedTags.map((tag) => tag.toLowerCase()));
  const candidateTags = suggestion.tags.filter((tag) => !selectedKeys.has(tag.toLowerCase()));

  return { values, candidateTags, filledFields };
}

