"use client";

import { useMemo, useState } from "react";
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
};

function badgeClass(tone: string) {
  if (tone === "success") return "ld-badge ld-badge-success";
  if (tone === "warning") return "ld-badge ld-badge-warning";
  if (tone === "danger") return "ld-badge ld-badge-danger";
  if (tone === "dark") return "ld-badge ld-badge-dark";
  return "ld-badge";
}

function toggleCapability(selected: CapabilityKey[], capability: CapabilityKey) {
  if (selected.includes(capability)) {
    return selected.filter((item) => item !== capability);
  }

  return [...selected, capability];
}

export function SiteDirectory({ sites }: { sites: SiteDirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<CapabilityKey[]>([]);
  const [selectedModel, setSelectedModel] = useState("");

  const modelOptions = useMemo(
    () => Array.from(new Set(sites.flatMap((site) => site.models))).sort((a, b) => a.localeCompare(b)),
    [sites],
  );

  const filteredSites = useMemo(
    () => filterSites(sites, { query, capabilities: selectedCapabilities, model: selectedModel }) as SiteDirectoryItem[],
    [query, selectedCapabilities, selectedModel, sites],
  );

  const hasFilters = query.trim().length > 0 || selectedCapabilities.length > 0 || selectedModel.length > 0;

  function clearFilters() {
    setQuery("");
    setSelectedCapabilities([]);
    setSelectedModel("");
  }

  if (sites.length === 0) {
    return (
      <div className="ld-card-light p-10 text-center">
        <p className="ld-display text-3xl text-[var(--ink)]">暂无站点数据</p>
        <p className="mt-3 text-[var(--muted)]">登录后台后可以添加第一条公益站记录。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="ld-filter-panel">
        <div className="grid gap-3 lg:grid-cols-[1fr_16rem]">
          <label className="block">
            <span className="ld-filter-label">搜索</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="ld-input mt-2"
              placeholder="搜索站点、模型、URL..."
            />
          </label>

          <label className="block">
            <span className="ld-filter-label">模型</span>
            <select value={selectedModel} onChange={(event) => setSelectedModel(event.target.value)} className="ld-input mt-2">
              <option value="">全部模型</option>
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <p className="ld-filter-label">能力筛选</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {capabilityLabels.map(({ key, label }) => {
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
            匹配 <span className="font-semibold text-[var(--ink)]">{filteredSites.length}</span> / {sites.length} 个站点
          </p>
          {hasFilters && (
            <button type="button" className="ld-button-secondary min-h-0 px-3 py-2 text-xs" onClick={clearFilters}>
              清除筛选
            </button>
          )}
        </div>
      </div>

      {filteredSites.length === 0 ? (
        <div className="ld-card-light p-10 text-center">
          <p className="ld-display text-3xl text-[var(--ink)]">没有找到匹配站点</p>
          <p className="mt-3 text-[var(--muted)]">调整关键词、模型或能力筛选后再试。</p>
          <button type="button" className="ld-button-primary mt-6" onClick={clearFilters}>
            清除筛选
          </button>
        </div>
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
              <article key={site.id} className="ld-card flex min-h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--ink)]">
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="ld-link">
                        {site.name}
                      </a>
                    </h3>
                    <p className="mt-1 break-all text-xs text-[var(--muted-soft)]">{site.url}</p>
                  </div>
                  <a href={site.url} target="_blank" rel="noopener noreferrer" className="ld-button-secondary shrink-0 px-3 py-2 text-xs">
                    访问
                  </a>
                </div>

                {site.description && <p className="mt-4 text-sm leading-6 text-[var(--body)]">{site.description}</p>}

                <div className="mt-5 flex flex-wrap gap-2">
                  {capabilityLabels.map(({ key, label, tone }) => {
                    if (!site[key]) return null;
                    return (
                      <span key={key} className={badgeClass(tone)}>
                        {label}
                      </span>
                    );
                  })}
                </div>

                {site.models.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-[var(--muted)]">支持模型</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {site.models.map((model) => (
                        <span key={model} className="ld-badge bg-[rgba(250,249,245,0.7)]">
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(site.rateLimitInfo || site.activityRequirementInfo) && (
                  <div className="mt-5 space-y-2 rounded-lg bg-[rgba(250,249,245,0.58)] p-3 text-xs leading-5 text-[var(--muted)]">
                    {site.rateLimitInfo && <p>限速：{site.rateLimitInfo}</p>}
                    {site.activityRequirementInfo && <p>活跃要求：{site.activityRequirementInfo}</p>}
                  </div>
                )}

                {links.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--hairline-soft)] pt-5 text-sm">
                    {links.map((link) => (
                      <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="ld-link">
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
