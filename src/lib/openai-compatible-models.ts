export type OpenAiCompatibleModelListResult =
  | { ok: true; models: string[] }
  | { ok: false; error: string };

type ListModelsInput = {
  baseUrl: string;
  apiKey: string;
  fetcher?: typeof fetch;
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function parseOpenAiCompatibleModelList(value: unknown): OpenAiCompatibleModelListResult {
  const data = asRecord(value)?.data;
  if (!Array.isArray(data)) {
    return { ok: false, error: "模型列表响应格式不兼容" };
  }

  const models = Array.from(
    new Set(
      data.flatMap((item) => {
        const id = asRecord(item)?.id;
        return typeof id === "string" && id.trim() ? [id.trim()] : [];
      }),
    ),
  ).sort((left, right) => left.localeCompare(right, "en"));

  return { ok: true, models };
}

export async function listOpenAiCompatibleModels({
  baseUrl,
  apiKey,
  fetcher = fetch,
}: ListModelsInput): Promise<OpenAiCompatibleModelListResult> {
  let response: Response;
  try {
    response = await fetcher(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { ok: false, error: "模型列表拉取失败，请检查服务地址和网络后重试" };
  }

  if (!response.ok) {
    return { ok: false, error: `模型列表拉取失败：HTTP ${response.status}` };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: "模型列表返回的不是有效 JSON" };
  }

  return parseOpenAiCompatibleModelList(payload);
}
