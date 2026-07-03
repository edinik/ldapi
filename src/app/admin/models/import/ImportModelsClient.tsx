"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <section className="ld-card-light p-5">
        <div className="flex flex-col justify-between gap-3 border-b border-[var(--hairline-soft)] pb-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">导入内容</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">粘贴 AI 按模板整理出的 JSON，先预检再导入。</p>
          </div>
          <button type="button" className="ld-button-secondary min-h-0 px-3 py-2 text-xs" onClick={() => setContent(template)}>
            恢复模板
          </button>
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="ld-input mt-4 min-h-[34rem] resize-y font-mono text-xs leading-5"
          spellCheck={false}
        />

        <label className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.64)] p-3">
          <input type="checkbox" checked={upsert} onChange={(event) => setUpsert(event.target.checked)} className="mt-1 size-4 accent-[var(--primary)]" />
          <span>
            <span className="block text-sm font-semibold text-[var(--ink)]">已有模型自动更新</span>
            <span className="ld-helper mt-1 block">按模型 ID 优先匹配，其次按名称匹配。关闭后已有模型会跳过。</span>
          </span>
        </label>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={loading} className="ld-button-secondary" onClick={() => submitImport(true)}>
            {loading ? "处理中..." : "预检"}
          </button>
          <button type="button" disabled={loading} className="ld-button-primary" onClick={() => submitImport(false)}>
            确认导入
          </button>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="ld-card-light p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">AI 整理提示词</h2>
          <div className="mt-4 rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.64)] p-3">
            <label htmlFor="model-generate-query" className="ld-label">
              模型或厂商
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
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
                className="ld-input"
                disabled={generating}
              />
              <button
                type="button"
                className="ld-button-primary shrink-0"
                disabled={generating}
                onClick={() => void generateImportContent()}
              >
                {generating ? "生成中..." : "AI 生成"}
              </button>
            </div>
            {generateError && <p className="mt-2 text-sm text-[var(--error)]">{generateError}</p>}
          </div>
          <div className="mt-4 rounded-lg bg-[rgba(250,249,245,0.72)] p-4 font-mono text-xs leading-6 text-[var(--body)]">
            请访问模型官网和官方文档，整理模型信息为右侧 JSON 模板格式。字段缺失时填 null 或 false；价格统一使用美元 / M tokens；日期使用 YYYY-MM-DD；不要输出 Markdown，只输出 JSON。
          </div>
        </section>

        {importSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-green-700">导入成功</p>
            <p className="mt-1 text-sm text-green-600">
              共新增 {result?.summary?.created ?? 0} 个模型，更新 {result?.summary?.updated ?? 0} 个模型，跳过 {result?.summary?.skipped ?? 0} 个模型。
            </p>
          </div>
        )}

        <section className="ld-card-light p-5">
          <h2 className="text-lg font-semibold text-[var(--ink)]">预检结果</h2>
          {!result ? (
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">点击预检后会显示将新增、更新或跳过的模型。</p>
          ) : result.errors && result.errors.length > 0 ? (
            <div className="mt-3 space-y-2">
              {result.errors.map((error) => (
                <p key={`${error.index}-${error.message}`} className="rounded-lg bg-[rgba(198,69,69,0.08)] p-3 text-sm text-[var(--error)]">
                  第 {error.index + 1} 条：{error.message}
                </p>
              ))}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["新增", result.summary?.created ?? 0],
                  ["更新", result.summary?.updated ?? 0],
                  ["跳过", result.summary?.skipped ?? 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.64)] p-3">
                    <p className="text-2xl font-semibold text-[var(--ink)]">{value}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
                  </div>
                ))}
              </div>
              <div className="max-h-96 overflow-y-auto rounded-lg border border-[var(--hairline)]">
                {result.rows?.map((row) => (
                  <div key={`${row.name}-${row.modelId}`} className="flex items-center justify-between gap-3 border-b border-[var(--hairline-soft)] px-3 py-2 last:border-b-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">{row.name}</p>
                      <p className="truncate text-xs text-[var(--muted)]">{row.modelId || "未填写模型 ID"}</p>
                    </div>
                    <span className="ld-badge shrink-0">{actionLabels[row.action]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
