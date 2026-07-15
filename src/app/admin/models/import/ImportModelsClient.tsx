"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type GenerateResult = {
  content?: string;
  error?: string;
};

const actionLabels = {
  create: "新增",
  update: "更新",
  skip: "跳过",
};

export default function ImportModelsClient({ template }: { template: string }) {
  const router = useRouter();
  const [content, setContent] = useState(template);
  const [upsert, setUpsert] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateQuery, setGenerateQuery] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

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
      setGenerateError("请输入模型或厂商名称");
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    setImportSuccess(false);
    const res = await fetch("/api/models/import/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = (await res.json()) as GenerateResult;
    setGenerating(false);

    if (!res.ok || !data.content) {
      setGenerateError(data.error || "AI 生成失败");
      return;
    }

    setContent(data.content);
    setResult(null);
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
                    {generating ? "生成中..." : "AI 生成"}
                  </Button>
                </div>
                {generateError && <p className="mt-2 text-sm text-destructive">{generateError}</p>}
              </Field>
            </div>
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
