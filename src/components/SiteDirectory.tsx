"use client";

import { useMemo, useState } from "react";
import { FilterSelect } from "@/components/FilterSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { type CapabilityKey, type DirectorySite, filterSites } from "@/lib/site-directory-filter";

const capabilityLabels: { key: CapabilityKey; label: string; tone: string }[] = [
  { key: "hasCheckIn", label: "签到", tone: "success" },
  { key: "autoCheckIn", label: "自动签到", tone: "success" },
  { key: "supportsClaudeCode", label: "Claude Code", tone: "dark" },
  { key: "supportsCodex", label: "Codex", tone: "dark" },
  { key: "supportsImmersiveTranslation", label: "沉浸式翻译", tone: "warning" },
  { key: "hasRateLimit", label: "限速", tone: "warning" },
  { key: "hasActivityRequirement", label: "活跃要求", tone: "danger" },
];

export type SiteDirectoryItem = DirectorySite & {
  adminProfileUrl: string | null;
  discussionUrl: string | null;
  checkInUrl: string | null;
  welfareUrl: string | null;
  statusUrl: string | null;
  rateLimitInfo: string | null;
  activityRequirementInfo: string | null;
  modelCapabilities: {
    name: string;
    capabilities: string[];
    rating: string | null;
    pricingLabels: string[];
  }[];
};

function badgeVariant(tone: string): "default" | "secondary" | "destructive" | "outline" {
  if (tone === "success") return "secondary";
  if (tone === "warning") return "outline";
  if (tone === "danger") return "destructive";
  if (tone === "dark") return "default";
  return "secondary";
}

function ratingVariant(rating: string): "default" | "secondary" | "destructive" | "outline" {
  if (rating === "夯") return "secondary";
  if (rating === "顶级") return "default";
  if (rating === "人上人") return "secondary";
  if (rating === "NPC") return "outline";
  if (rating === "拉") return "destructive";
  return "secondary";
}

export function SiteDirectory({ sites }: { sites: SiteDirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<CapabilityKey[]>([]);
  const [capabilityMultiple, setCapabilityMultiple] = useState(true);
  const [selectedModel, setSelectedModel] = useState("all");

  const modelOptions = useMemo(
    () => Array.from(new Set(sites.flatMap((site) => site.models))).sort((a, b) => a.localeCompare(b)),
    [sites],
  );
  const modelFilterOptions = useMemo(
    () => [{ value: "all", label: "全部模型" }, ...modelOptions.map((model) => ({ value: model, label: model }))],
    [modelOptions],
  );

  const filteredSites = useMemo(
    () =>
      filterSites(sites, {
        query,
        capabilities: selectedCapabilities,
        model: selectedModel === "all" ? "" : selectedModel,
      }) as SiteDirectoryItem[],
    [query, selectedCapabilities, selectedModel, sites],
  );

  const hasFilters = query.trim().length > 0 || selectedCapabilities.length > 0 || (selectedModel.length > 0 && selectedModel !== "all");

  function clearFilters() {
    setQuery("");
    setSelectedCapabilities([]);
    setSelectedModel("all");
  }

  if (sites.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle className="text-3xl font-semibold tracking-tight">暂无站点数据</EmptyTitle>
          <EmptyDescription>登录后台后可以添加第一条公益站记录。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_16rem]">
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-foreground">搜索</span>
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索站点、模型、URL..."
              />
            </label>

            <FilterSelect
              label="模型"
              value={selectedModel || "all"}
              options={modelFilterOptions}
              onChange={setSelectedModel}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">能力筛选</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground"
                onClick={() => {
                  setCapabilityMultiple((value) => !value);
                  // 切到单选时只保留首个已选能力
                  setSelectedCapabilities((current) => current.slice(0, 1));
                }}
                aria-label={capabilityMultiple ? "切换为单选" : "切换为多选"}
                title={capabilityMultiple ? "切换为单选" : "切换为多选"}
              >
                {capabilityMultiple ? "多选" : "单选"}
              </Button>
            </div>
            <ToggleGroup
              multiple={capabilityMultiple}
              value={selectedCapabilities}
              onValueChange={(values) => {
                // 单选模式下只取最后一次点击的能力
                setSelectedCapabilities(
                  (capabilityMultiple ? values : values.slice(-1)) as CapabilityKey[],
                );
              }}
              variant="outline"
              spacing={2}
              className="flex flex-wrap"
            >
              {capabilityLabels.map(({ key, label }) => (
                <ToggleGroupItem key={key} value={key} className="rounded-full px-3">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              匹配 <span className="font-semibold text-foreground">{filteredSites.length}</span> / {sites.length} 个站点
            </p>
            {hasFilters && (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredSites.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle className="text-3xl font-semibold tracking-tight">没有找到匹配站点</EmptyTitle>
            <EmptyDescription>调整关键词、模型或能力筛选后再试。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={clearFilters}>
              清除筛选
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredSites.map((site) => {
            const links: { label: string; url: string }[] = [
              { label: "站长主页", url: site.adminProfileUrl || "" },
              { label: "讨论帖", url: site.discussionUrl || "" },
              { label: "签到站", url: site.checkInUrl || "" },
              { label: "福利站", url: site.welfareUrl || "" },
              { label: "状态监控", url: site.statusUrl || "" },
            ].filter((link) => link.url.length > 0);

            return (
              <Card key={site.id} className="flex min-h-full flex-col">
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="text-xl">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        {site.name}
                      </a>
                    </CardTitle>
                    <CardDescription className="mt-1 break-all">{site.url}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" render={<a href={site.url} target="_blank" rel="noopener noreferrer" />}>
                    访问
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5">
                  {site.description && <p className="text-sm leading-6 text-muted-foreground">{site.description}</p>}

                  <div className="flex flex-wrap gap-2">
                    {capabilityLabels.map(({ key, label, tone }) => {
                      if (!site[key]) return null;
                      return (
                        <Badge key={key} variant={badgeVariant(tone)}>
                          {label}
                        </Badge>
                      );
                    })}
                  </div>

                  {site.models.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">支持模型</p>
                      <div className="mt-2 grid gap-2">
                        {site.modelCapabilities.map((model) => (
                          <div key={model.name} className="rounded-lg bg-muted/60 p-3">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{model.name}</p>
                              {model.rating && <Badge variant={ratingVariant(model.rating)}>{model.rating}</Badge>}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {model.capabilities.length === 0 && !model.rating && (
                                <span className="text-xs text-muted-foreground">未标注</span>
                              )}
                              {model.capabilities.map((capability) => (
                                <Badge key={capability} variant="outline">
                                  {capability}
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {model.pricingLabels.map((price) => (
                                <Badge key={price} variant="outline">
                                  {price}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(site.rateLimitInfo || site.activityRequirementInfo) && (
                    <div className="space-y-2 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                      {site.rateLimitInfo && <p>限速：{site.rateLimitInfo}</p>}
                      {site.activityRequirementInfo && <p>活跃要求：{site.activityRequirementInfo}</p>}
                    </div>
                  )}

                  {links.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-5 text-sm">
                      {links.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
