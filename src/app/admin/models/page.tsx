import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { formatCost, formatTokenLimit, getCapabilityLabels, type ModelDisplayItem } from "@/lib/model-display";
import { parseReasoningEffortLevels } from "@/lib/site-model-capabilities";

export default async function AdminModelsPage() {
  await requireAdmin();

  const allModels = await db.select().from(models).orderBy(desc(models.updatedAt), desc(models.id));
  const activeCount = allModels.filter((model) => model.isActive !== false).length;
  const homeCount = allModels.filter((model) => model.isActive !== false && model.showOnHome).length;
  const developerCount = new Set(allModels.map((model) => model.developer).filter(Boolean)).size;

  return (
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container">
        <header className="flex flex-col justify-between gap-6 border-b border-[var(--hairline)] pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link href="/admin" className="ld-link">
                返回站点管理
              </Link>
              <Link href="/" className="ld-link">
                返回公开目录
              </Link>
            </div>
            <h1 className="ld-display mt-4 text-5xl leading-tight text-[var(--ink)]">模型管理</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              维护模型能力、模态、价格、限制和主页展示状态。站点仍可按模型名称关联这些记录。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/models/import" className="ld-button-secondary">
              导入模型
            </Link>
            <Link href="/admin/models/new" className="ld-button-primary">
              添加模型
            </Link>
          </div>
        </header>

        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["全部模型", allModels.length],
            ["启用模型", activeCount],
            ["主页展示", homeCount],
            ["开发者", developerCount],
          ].map(([label, value]) => (
            <div key={label} className="ld-card-light p-5">
              <p className="ld-display text-3xl text-[var(--ink)]">{value}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
            </div>
          ))}
        </section>

        <section className="ld-card-light overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-[var(--hairline)] p-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">模型资料</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{homeCount} 个启用模型会出现在主页速览。</p>
            </div>
          </div>

          {allModels.length === 0 ? (
            <div className="p-10 text-center">
              <p className="ld-display text-3xl text-[var(--ink)]">暂无模型</p>
              <p className="mt-3 text-sm text-[var(--muted)]">点击添加模型开始录入第一条资料。</p>
              <Link href="/admin/models/new" className="ld-button-primary mt-6">
                添加模型
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ld-table min-w-[980px]">
                <thead>
                  <tr>
                    <th>模型</th>
                    <th>状态</th>
                    <th>类型</th>
                    <th>能力</th>
                    <th>限制</th>
                    <th>价格</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allModels.map((model) => {
                    const capabilityLabels = getCapabilityLabels({
                      ...model,
                      reasoningEffortLevels: parseReasoningEffortLevels(model.reasoningEffortLevels),
                    } as ModelDisplayItem);

                    return (
                      <tr key={model.id}>
                        <td>
                          <p className="font-semibold text-[var(--ink)]">{model.name}</p>
                          <p className="mt-1 max-w-xs truncate text-xs text-[var(--muted-soft)]">
                            {[model.developer, model.modelId].filter(Boolean).join(" / ") || "未填写开发者或模型 ID"}
                          </p>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            <span className={model.isActive !== false ? "ld-badge ld-badge-success" : "ld-badge ld-badge-danger"}>
                              {model.isActive !== false ? "启用" : "停用"}
                            </span>
                            {model.showOnHome && <span className="ld-badge ld-badge-coral">主页</span>}
                          </div>
                        </td>
                        <td>{model.type || "未填写"}</td>
                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            {capabilityLabels.length > 0 ? (
                              capabilityLabels.map((label) => (
                                <span key={label} className="ld-badge ld-badge-dark">
                                  {label}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-[var(--muted)]">未标注</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <p className="text-sm text-[var(--body)]">上下文：{formatTokenLimit(model.contextWindow)}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">输出：{formatTokenLimit(model.maxOutputTokens)}</p>
                        </td>
                        <td>
                          <p className="text-sm text-[var(--body)]">输入：{formatCost(model.inputCostPerMTokens)}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">输出：{formatCost(model.outputCostPerMTokens)}</p>
                        </td>
                        <td>
                          <Link href={`/admin/models/${model.id}/edit`} className="ld-link">
                            编辑
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
