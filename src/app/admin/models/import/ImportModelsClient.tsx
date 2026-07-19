"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ImportResult = {
  dryRun?: boolean;
  summary?: {
    created: number;
    updated: number;
    skipped: number;
  };
  rows?: Array<{
    name: string;
    modelId: string | null;
    action: "create" | "update" | "skip";
  }>;
  errors?: Array<{
    index: number;
    message: string;
  }>;
};

type GenerationUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
};

type GenerationMetadata = {
  requestedModel: string | null;
  responseModel: string | null;
  usage: GenerationUsage;
};

type GenerationFeedback = {
  status: "success" | "error";
  elapsedSeconds: number;
  message: string;
  metadata: GenerationMetadata | null;
};

const actionLabels = {
  create: "新增",
  update: "更新",
  skip: "跳过",
};

const generateTimeoutMs = 180_000;
const slowGenerationSeconds = 30;
const tokenFormatter = new Intl.NumberFormat("zh-CN");

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseGenerationPayload(value: unknown) {
  const payload = asRecord(value);
  const metadata = asRecord(payload?.metadata);
  const usage = asRecord(metadata?.usage);

  return {
    content: typeof payload?.content === "string" ? payload.content : null,
    error: typeof payload?.error === "string" ? payload.error : null,
    metadata: metadata
      ? {
          requestedModel: nullableString(metadata.requestedModel),
          responseModel: nullableString(metadata.responseModel),
          usage: {
            inputTokens: nullableNumber(usage?.inputTokens),
            outputTokens: nullableNumber(usage?.outputTokens),
            cachedTokens: nullableNumber(usage?.cachedTokens),
            reasoningTokens: nullableNumber(usage?.reasoningTokens),
            totalTokens: nullableNumber(usage?.totalTokens),
          },
        }
      : null,
  };
}

function elapsedSecondsSince(startedAt: number) {
  return Math.max(1, Math.ceil((Date.now() - startedAt) / 1000));
}

function formatTokenCount(value: number | null) {
  return value === null ? "未提供" : tokenFormatter.format(value);
}

function GenerationMetadataDetails({ metadata }: { metadata: GenerationMetadata }) {
  const items = [
    ["请求模型", metadata.requestedModel || "未提供"],
    ["实际模型", metadata.responseModel || "未提供"],
    ["输入 Token", formatTokenCount(metadata.usage.inputTokens)],
    ["输出 Token", formatTokenCount(metadata.usage.outputTokens)],
    ["缓存 Token", formatTokenCount(metadata.usage.cachedTokens)],
    ["思考 Token", formatTokenCount(metadata.usage.reasoningTokens)],
    ["总 Token", formatTokenCount(metadata.usage.totalTokens)],
  ];

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md border border-border/70 bg-muted/40 px-3 py-2">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 break-all font-mono text-xs font-semibold text-foreground">{value}</div>
        </div>
      ))}
    </div>
  );
}

export default function ImportModelsClient({ template }: { template: string }) {
  const router = useRouter();
  const [content, setContent] = useState(template);
  const [upsert, setUpsert] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateQuery, setGenerateQuery] = useState("");
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState(0);
  const [generationFeedback, setGenerationFeedback] = useState<GenerationFeedback | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const generateAbortController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!generating || generationStartedAt === null) return;

    const updateElapsed = () => {
      setGenerationElapsedSeconds(Math.floor((Date.now() - generationStartedAt) / 1000));
    };
    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [generating, generationStartedAt]);

  useEffect(() => {
    return () => generateAbortController.current?.abort();
  }, []);

  async function submitImport(dryRun: boolean) {
    setLoading(true);
    setImportSuccess(false);
    const res = await fetch("/api/models/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, dryRun, upsert }),
    });
    const data = (await res.json()) as ImportResult;
    setResult(data);
    setLoading(false);

    if (res.ok && !dryRun) {
      setImportSuccess(true);
      router.refresh();
    }
  }

  async function generateImportContent() {
    const query = generateQuery.trim();
    if (!query) {
      setGenerationFeedback({
        status: "error",
        elapsedSeconds: 0,
        message: "请输入模型或厂商名称",
        metadata: null,
      });
      return;
    }

    const startedAt = Date.now();
    const controller = new AbortController();
    let timedOut = false;
    setGenerating(true);
    setGenerationStartedAt(startedAt);
    setGenerationElapsedSeconds(0);
    setGenerationFeedback(null);
    setImportSuccess(false);
    generateAbortController.current = controller;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, generateTimeoutMs);

    try {
      const res = await fetch("/api/models/import/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
      const responseText = await res.text();
      let rawPayload: unknown;
      try {
        rawPayload = JSON.parse(responseText);
      } catch {
        setGenerationFeedback({
          status: "error",
          elapsedSeconds: elapsedSecondsSince(startedAt),
          message: res.ok ? "AI 服务返回了无法解析的响应" : `AI 生成失败：HTTP ${res.status}`,
          metadata: null,
        });
        return;
      }

      const data = parseGenerationPayload(rawPayload);

      if (!res.ok || !data.content) {
        setGenerationFeedback({
          status: "error",
          elapsedSeconds: elapsedSecondsSince(startedAt),
          message: data.error || (res.ok ? "AI 生成失败：响应中缺少生成内容" : `AI 生成失败：HTTP ${res.status}`),
          metadata: data.metadata,
        });
        return;
      }

      setContent(data.content);
      setResult(null);
      setGenerationFeedback({
        status: "success",
        elapsedSeconds: elapsedSecondsSince(startedAt),
        message: "已生成并通过导入内容校验。",
        metadata: data.metadata,
      });
    } catch (error) {
      const message = timedOut
        ? "AI 生成超时（超过 180 秒），请稍后重试"
        : error instanceof Error && error.message
          ? `AI 请求失败：${error.message}`
          : "AI 请求失败，请检查网络后重试";

      setGenerationFeedback({
        status: "error",
        elapsedSeconds: elapsedSecondsSince(startedAt),
        message,
        metadata: null,
      });
    } finally {
      window.clearTimeout(timeoutId);
      if (generateAbortController.current === controller) {
        generateAbortController.current = null;
      }
      setGenerationElapsedSeconds(elapsedSecondsSince(startedAt));
      setGenerationStartedAt(null);
      setGenerating(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
      <Card>
        <CardHeader className="flex flex-col justify-between gap-3 border-b md:flex-row md:items-center">
          <div>
            <CardTitle>导入内容</CardTitle>
            <CardDescription className="mt-1">粘贴 AI 按模板整理出的 JSON，先预检再导入。</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setContent(template)}>
            恢复模板
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[34rem] resize-y font-mono text-xs leading-5"
            spellCheck={false}
          />

          <Field orientation="horizontal" className="items-start rounded-lg border border-border bg-muted/40 p-3">
            <Checkbox
              checked={upsert}
              onCheckedChange={(checked) => setUpsert(checked === true)}
              id="upsert-models"
            />
            <FieldContent>
              <FieldLabel htmlFor="upsert-models" className="font-semibold">
                已有模型自动更新
              </FieldLabel>
              <FieldDescription>按模型 ID 优先匹配，其次按名称匹配。关闭后已有模型会跳过。</FieldDescription>
            </FieldContent>
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={loading} variant="outline" onClick={() => submitImport(true)}>
              {loading ? "处理中..." : "预检"}
            </Button>
            <Button type="button" disabled={loading} onClick={() => submitImport(false)}>
              确认导入
            </Button>
          </div>
        </CardContent>
      </Card>

      <aside className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>AI 整理提示词</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <Field>
                <FieldLabel htmlFor="model-generate-query">模型或厂商</FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="model-generate-query"
                    value={generateQuery}
                    onChange={(event) => setGenerateQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void generateImportContent();
                      }
                    }}
                    placeholder="例如 OpenAI GPT-4.1、DeepSeek、Claude"
                    disabled={generating}
                  />
                  <Button type="button" className="shrink-0" disabled={generating} onClick={() => void generateImportContent()}>
                    {generating && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
                    {generating ? "AI 生成中" : "AI 生成"}
                  </Button>
                </div>
              </Field>
            </div>
            {generating && (
              <Alert role="status" aria-live="polite" aria-atomic="true">
                <LoaderCircle className="animate-spin" />
                <AlertTitle>正在生成模型资料</AlertTitle>
                <AlertDescription>
                  <span aria-hidden="true">已耗时 {generationElapsedSeconds} 秒。</span>
                  {generationElapsedSeconds >= slowGenerationSeconds && " 生成时间较长，AI 仍在整理官方资料，请耐心等待。"}
                </AlertDescription>
              </Alert>
            )}
            {!generating && generationFeedback && (
              <Alert
                variant={generationFeedback.status === "error" ? "destructive" : "default"}
                role={generationFeedback.status === "error" ? "alert" : "status"}
                aria-live={generationFeedback.status === "error" ? "assertive" : "polite"}
              >
                <AlertTitle>{generationFeedback.status === "success" ? "生成成功" : "生成失败"}</AlertTitle>
                <AlertDescription>
                  <div>
                    {generationFeedback.message} 共耗时 {generationFeedback.elapsedSeconds} 秒。
                  </div>
                  {generationFeedback.metadata && <GenerationMetadataDetails metadata={generationFeedback.metadata} />}
                </AlertDescription>
              </Alert>
            )}
            <div className="rounded-lg bg-muted/60 p-4 font-mono text-xs leading-6 text-muted-foreground">
              请访问模型官网和官方文档，整理模型信息为右侧 JSON 模板格式。字段缺失时填 null 或 false；价格统一使用美元 / M tokens；日期使用 YYYY-MM-DD；不要输出 Markdown，只输出 JSON。
            </div>
          </CardContent>
        </Card>

        {importSuccess && (
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="font-semibold text-foreground">导入成功</p>
            <p className="mt-1 text-sm text-muted-foreground">
              共新增 {result?.summary?.created ?? 0} 个模型，更新 {result?.summary?.updated ?? 0} 个模型，跳过{" "}
              {result?.summary?.skipped ?? 0} 个模型。
            </p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>预检结果</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <p className="text-sm leading-6 text-muted-foreground">点击预检后会显示将新增、更新或跳过的模型。</p>
            ) : result.errors && result.errors.length > 0 ? (
              <div className="space-y-2">
                {result.errors.map((error) => (
                  <p key={`${error.index}-${error.message}`} className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    第 {error.index + 1} 条：{error.message}
                  </p>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["新增", result.summary?.created ?? 0],
                    ["更新", result.summary?.updated ?? 0],
                    ["跳过", result.summary?.skipped ?? 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border bg-muted/40 p-3">
                      <p className="text-2xl font-semibold text-foreground">{value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                  {result.rows?.map((row) => (
                    <div
                      key={`${row.name}-${row.modelId}`}
                      className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{row.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{row.modelId || "未填写模型 ID"}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {actionLabels[row.action]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
