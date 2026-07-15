"use client";

import { useMemo, useState } from "react";
import { FilterSelect } from "@/components/FilterSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { getDeveloperIconPath } from "@/lib/developer-icons";

const capabilityFilters: { key: ModelCapabilityKey; label: string }[] = [
  { key: "supportsToolCalling", label: "工具调用" },
  { key: "supportsVision", label: "视觉" },
  { key: "supportsTemperatureControl", label: "温度" },
  { key: "supportsReasoning", label: "推理" },
  { key: "supportsWebSearch", label: "联网" },
];

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
    <span className="grid size-9 shrink-0 place-items-center text-sm font-black text-foreground">
      {isImageIcon(icon) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon || ""} alt="" className="size-8 object-contain" />
      ) : (
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-muted">
          {getDeveloperIconText(model)}
        </span>
      )}
    </span>
  );
}

function ModelTitle({ model }: { model: ModelDisplayItem }) {
  const titleClassName = "mt-1 text-xl font-semibold leading-tight text-foreground";

  if (!model.officialUrl) {
    return <h3 className={titleClassName}>{model.name}</h3>;
  }

  return (
    <h3 className={titleClassName}>
      <a
        href={model.officialUrl}
        target="_blank"
        rel="noreferrer"
        className="underline-offset-4 transition hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
  const [developer, setDeveloper] = useState("all");
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
    () => [{ value: "all", label: "全部开发者" }, ...developerOptions.map((option) => ({ value: option, label: option }))],
    [developerOptions],
  );

  const filteredModels = useMemo(
    () =>
      sortModels(
        filterModels(models, {
          query,
          developer: developer === "all" ? "" : developer,
          capabilities: selectedCapabilities,
        }),
        sort,
      ),
    [developer, models, query, selectedCapabilities, sort],
  );

  const hasFilters = query.trim().length > 0 || (developer.length > 0 && developer !== "all") || selectedCapabilities.length > 0;

  function clearFilters() {
    setQuery("");
    setDeveloper("all");
    setSelectedCapabilities([]);
  }

  if (models.length === 0) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_14rem_14rem]">
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-foreground">搜索</span>
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索模型、开发者、模型 ID..."
              />
            </label>

            <FilterSelect label="开发者" value={developer} options={developerFilterOptions} onChange={setDeveloper} />
            <FilterSelect label="排序" value={sort} options={sortOptions} onChange={(v) => setSort(v as SortOption)} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">能力筛选</p>
            <ToggleGroup
              multiple
              value={selectedCapabilities}
              onValueChange={(values) => setSelectedCapabilities(values as ModelCapabilityKey[])}
              variant="outline"
              spacing={2}
              className="flex flex-wrap"
            >
              {capabilityFilters.map(({ key, label }) => (
                <ToggleGroupItem key={key} value={key} className="rounded-full px-3">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              匹配 <span className="font-semibold text-foreground">{filteredModels.length}</span> / {models.length} 个模型
            </p>
            {hasFilters && (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredModels.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle className="text-3xl font-semibold tracking-tight">没有找到匹配模型</EmptyTitle>
            <EmptyDescription>调整关键词、开发者或能力筛选后再试。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={clearFilters}>
              清除筛选
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredModels.map((model) => {
            const capabilities = getCapabilityLabels(model);
            const inputModalities = getInputModalityLabels(model);
            const outputModalities = getOutputModalityLabels(model);

            return (
              <Card key={model.id} className="flex min-h-full flex-col">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="flex min-w-0 items-start gap-3">
                    <DeveloperIcon model={model} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground">{model.developer || "未知开发者"}</p>
                      <ModelTitle model={model} />
                      <CardDescription className="mt-1 break-all">
                        {model.modelId || model.group || "未填写模型 ID"}
                      </CardDescription>
                    </div>
                  </div>
                  {model.type && (
                    <Badge variant="secondary" className="shrink-0">
                      {model.type}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5">
                  {capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {capabilities.map((capability) => (
                        <Badge key={capability} variant="default">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">输入：</span>
                      {inputModalities.length > 0 ? inputModalities.join(" / ") : "未标注"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">输出：</span>
                      {outputModalities.length > 0 ? outputModalities.join(" / ") : "未标注"}
                    </p>
                  </div>

                  <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">上下文</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{formatTokenLimit(model.contextWindow)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">最大输出</p>
                      <p className="mt-1 text-lg font-semibold text-foreground">{formatTokenLimit(model.maxOutputTokens)}</p>
                    </div>
                    {model.releaseDate && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">发布日期</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">{model.releaseDate}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2 text-xs leading-5 text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">输入价格：</span>
                      {formatCost(model.inputCostPerMTokens)}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">输出价格：</span>
                      {formatCost(model.outputCostPerMTokens)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
