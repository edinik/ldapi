"use client";

import { useMemo, useState } from "react";
import {
  filterModels,
  formatCost,
  formatTokenLimit,
  getCapabilityLabels,
  getInputModalityLabels,
  getOutputModalityLabels,
  type ModelCapabilityKey,
  type ModelDisplayItem,
} from "@/lib/model-display";
import { FilterSelect } from "@/components/FilterSelect";
import { getDeveloperIconPath } from "@/lib/developer-icons";

const capabilityFilters: { key: ModelCapabilityKey; label: string }[] = [
  { key: "supportsToolCalling", label: "工具调用" },
  { key: "supportsVision", label: "视觉" },
  { key: "supportsTemperatureControl", label: "温度" },
  { key: "supportsReasoning", label: "推理" },
  { key: "supportsWebSearch", label: "联网" },
];

function toggleCapability(selected: ModelCapabilityKey[], capability: ModelCapabilityKey) {
  if (selected.includes(capability)) {
    return selected.filter((item) => item !== capability);
  }

  return [...selected, capability];
}

function isImageIcon(icon: string | null) {
  if (!icon) return false;
  return /^(https?:\/\/|\/)/.test(icon.trim());
}

function getDeveloperIconText(model: ModelDisplayItem) {
  const source = model.developer?.trim() || model.icon?.trim() || model.name.trim();
  return source.slice(0, 1).toUpperCase() || "?";
}

function DeveloperIcon({ model }: { model: ModelDisplayItem }) {
  const customIcon = model.icon?.trim() || null;
  const icon = isImageIcon(customIcon) ? customIcon : getDeveloperIconPath(model.developer);

  return (
    <span className="grid size-9 shrink-0 place-items-center text-sm font-black text-[var(--ink)]">
      {isImageIcon(icon) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon || ""} alt="" className="size-8 object-contain" />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-lg bg-[rgba(250,249,245,0.46)]"
        >
          {getDeveloperIconText(model)}
        </span>
      )}
    </span>
  );
}

function ModelTitle({ model }: { model: ModelDisplayItem }) {
  const titleClassName = "mt-1 text-xl font-semibold leading-tight text-[var(--ink)]";

  if (!model.officialUrl) {
    return <h3 className={titleClassName}>{model.name}</h3>;
  }

  return (
    <h3 className={titleClassName}>
      <a
        href={model.officialUrl}
        target="_blank"
        rel="noreferrer"
        className="underline-offset-4 transition hover:text-[var(--primary)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        title="打开官网/价格页"
      >
        {model.name}
      </a>
    </h3>
  );
}

type SortOption = "releaseDate-desc" | "releaseDate-asc" | "name-asc";

const sortOptions = [
  { value: "releaseDate-desc", label: "发布日期（最新）" },
  { value: "releaseDate-asc", label: "发布日期（最早）" },
  { value: "name-asc", label: "名称 A-Z" },
];

function sortModels(items: ModelDisplayItem[], sort: SortOption) {
  return [...items].sort((a, b) => {
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    const dateA = a.releaseDate || "";
    const dateB = b.releaseDate || "";
    if (sort === "releaseDate-desc") return dateB.localeCompare(dateA);
    return dateA.localeCompare(dateB);
  });
}

export function ModelOverview({ models }: { models: ModelDisplayItem[] }) {
  const [query, setQuery] = useState("");
  const [developer, setDeveloper] = useState("");
  const [sort, setSort] = useState<SortOption>("releaseDate-desc");
  const [selectedCapabilities, setSelectedCapabilities] = useState<ModelCapabilityKey[]>([]);

  const developerOptions = useMemo(
    () =>
      Array.from(new Set(models.map((model) => model.developer).filter((value): value is string => !!value))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [models],
  );
  const developerFilterOptions = useMemo(
    () => [{ value: "", label: "全部开发者" }, ...developerOptions.map((option) => ({ value: option, label: option }))],
    [developerOptions],
  );

  const filteredModels = useMemo(
    () => sortModels(filterModels(models, { query, developer, capabilities: selectedCapabilities }), sort),
    [developer, models, query, selectedCapabilities, sort],
  );

  const hasFilters = query.trim().length > 0 || developer.length > 0 || selectedCapabilities.length > 0;

  function clearFilters() {
    setQuery("");
    setDeveloper("");
    setSelectedCapabilities([]);
  }

  if (models.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="ld-filter-panel">
        <div className="grid gap-3 lg:grid-cols-[1fr_14rem_14rem]">
          <label className="block">
            <span className="ld-filter-label">搜索</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="ld-input mt-2"
              placeholder="搜索模型、开发者、模型 ID..."
            />
          </label>

          <FilterSelect label="开发者" value={developer} options={developerFilterOptions} onChange={setDeveloper} />
          <FilterSelect label="排序" value={sort} options={sortOptions} onChange={(v) => setSort(v as SortOption)} />
        </div>

        <div className="mt-4">
          <p className="ld-filter-label">能力筛选</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {capabilityFilters.map(({ key, label }) => {
              const active = selectedCapabilities.includes(key);

              return (
                <button
                  key={key}
                  type="button"
                  className={active ? "ld-filter-chip ld-filter-chip-active" : "ld-filter-chip"}
                  aria-pressed={active}
                  onClick={() => setSelectedCapabilities((current) => toggleCapability(current, key))}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline-soft)] pt-4">
          <p className="text-sm text-[var(--muted)]">
            匹配 <span className="font-semibold text-[var(--ink)]">{filteredModels.length}</span> / {models.length} 个模型
          </p>
          {hasFilters && (
            <button type="button" className="ld-button-secondary min-h-0 px-3 py-2 text-xs" onClick={clearFilters}>
              清除筛选
            </button>
          )}
        </div>
      </div>

      {filteredModels.length === 0 ? (
        <div className="ld-card-light p-10 text-center">
          <p className="ld-display text-3xl text-[var(--ink)]">没有找到匹配模型</p>
          <p className="mt-3 text-[var(--muted)]">调整关键词、开发者或能力筛选后再试。</p>
          <button type="button" className="ld-button-primary mt-6" onClick={clearFilters}>
            清除筛选
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredModels.map((model) => {
            const capabilities = getCapabilityLabels(model);
            const inputModalities = getInputModalityLabels(model);
            const outputModalities = getOutputModalityLabels(model);

            return (
              <article key={model.id} className="ld-card flex min-h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <DeveloperIcon model={model} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--muted)]">{model.developer || "未知开发者"}</p>
                      <ModelTitle model={model} />
                      <p className="mt-1 break-all text-xs text-[var(--muted-soft)]">{model.modelId || model.group || "未填写模型 ID"}</p>
                    </div>
                  </div>
                  {model.type && <span className="ld-badge shrink-0">{model.type}</span>}
                </div>

                {capabilities.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {capabilities.map((capability) => (
                      <span key={capability} className="ld-badge ld-badge-dark">
                        {capability}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 grid gap-3 rounded-lg bg-[rgba(250,249,245,0.58)] p-3 text-xs leading-5 text-[var(--muted)]">
                  <p>
                    <span className="font-semibold text-[var(--body-strong)]">输入：</span>
                    {inputModalities.length > 0 ? inputModalities.join(" / ") : "未标注"}
                  </p>
                  <p>
                    <span className="font-semibold text-[var(--body-strong)]">输出：</span>
                    {outputModalities.length > 0 ? outputModalities.join(" / ") : "未标注"}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 border-t border-[var(--hairline-soft)] pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)]">上下文</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{formatTokenLimit(model.contextWindow)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)]">最大输出</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{formatTokenLimit(model.maxOutputTokens)}</p>
                  </div>
                  {model.releaseDate && (
                    <div>
                      <p className="text-xs font-semibold text-[var(--muted)]">发布日期</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{model.releaseDate}</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-2 text-xs leading-5 text-[var(--muted)]">
                  <p>
                    <span className="font-semibold text-[var(--body-strong)]">输入价格：</span>
                    {formatCost(model.inputCostPerMTokens)}
                  </p>
                  <p>
                    <span className="font-semibold text-[var(--body-strong)]">输出价格：</span>
                    {formatCost(model.outputCostPerMTokens)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
