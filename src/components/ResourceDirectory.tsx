"use client";

import { useMemo, useState } from "react";
import {
  filterResources,
  getResourceTagOptions,
  type DirectoryResource,
  type ResourceTypeFilter,
} from "@/lib/resource-directory-filter";

const typeFilters: { value: ResourceTypeFilter; label: string }[] = [
  { value: "all", label: "全部资源" },
  { value: "tool", label: "工具项目" },
  { value: "tutorial", label: "LinuxDo 教程" },
];

function toggleTag(selected: string[], tag: string) {
  if (selected.includes(tag)) {
    return selected.filter((item) => item !== tag);
  }

  return [...selected, tag];
}

function ResourceLinks({ resource }: { resource: DirectoryResource }) {
  const links = [
    { label: "GitHub", url: resource.githubUrl },
    { label: "官网", url: resource.officialUrl },
    { label: "演示站", url: resource.demoUrl },
    { label: resource.type === "tutorial" ? "阅读原帖" : "LinuxDo", url: resource.linuxdoUrl },
  ].filter((link): link is { label: string; url: string } => !!link.url);

  if (links.length === 0) return null;

  return (
    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--hairline-soft)] pt-5 text-sm">
      {links.map((link) => (
        <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="ld-link">
          {link.label}
        </a>
      ))}
    </div>
  );
}

function ResourceCard({ resource }: { resource: DirectoryResource }) {
  return (
    <article className="ld-card flex min-h-full flex-col p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2">
            <span className={resource.type === "tool" ? "ld-badge ld-badge-dark" : "ld-badge ld-badge-coral"}>
              {resource.type === "tool" ? "工具项目" : "教程"}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-[var(--ink)]">{resource.title}</h3>
        </div>
        {resource.linuxdoUrl && (
          <a href={resource.linuxdoUrl} target="_blank" rel="noopener noreferrer" className="ld-button-secondary shrink-0 px-3 py-2 text-xs">
            {resource.type === "tutorial" ? "阅读" : "讨论"}
          </a>
        )}
      </div>

      {resource.description && <p className="mt-4 text-sm leading-6 text-[var(--body)]">{resource.description}</p>}

      {resource.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {resource.tags.map((tag) => (
            <span key={tag} className="ld-badge">
              {tag}
            </span>
          ))}
        </div>
      )}

      {resource.recommendation && (
        <div className="mt-5 rounded-lg bg-[rgba(250,249,245,0.58)] p-3 text-sm leading-6 text-[var(--body)]">
          <p className="text-xs font-semibold text-[var(--muted)]">推荐理由</p>
          <p className="mt-1">{resource.recommendation}</p>
        </div>
      )}

      <ResourceLinks resource={resource} />
    </article>
  );
}

function ResourceSection({ title, resources }: { title: string; resources: DirectoryResource[] }) {
  if (resources.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--ink)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{resources.length} 条匹配资源</p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </section>
  );
}

export function ResourceDirectory({ resources }: { resources: DirectoryResource[] }) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ResourceTypeFilter>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const tagOptions = useMemo(() => getResourceTagOptions(resources), [resources]);
  const filteredResources = useMemo(
    () => filterResources(resources, { query, type: selectedType, tags: selectedTags }),
    [query, resources, selectedTags, selectedType],
  );
  const toolResources = filteredResources.filter((resource) => resource.type === "tool");
  const tutorialResources = filteredResources.filter((resource) => resource.type === "tutorial");
  const hasFilters = query.trim().length > 0 || selectedType !== "all" || selectedTags.length > 0;

  function clearFilters() {
    setQuery("");
    setSelectedType("all");
    setSelectedTags([]);
  }

  if (resources.length === 0) {
    return (
      <div className="ld-card-light p-10 text-center">
        <p className="ld-display text-3xl text-[var(--ink)]">暂无资源数据</p>
        <p className="mt-3 text-[var(--muted)]">登录后台后可以添加工具项目或 LinuxDo 教程帖。</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="ld-filter-panel">
        <label className="block">
          <span className="ld-filter-label">搜索</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="ld-input mt-2"
            placeholder="搜索标题、标签、链接、推荐理由..."
          />
        </label>

        <div className="mt-4">
          <p className="ld-filter-label">类型</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {typeFilters.map((filter) => {
              const active = selectedType === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  className={active ? "ld-filter-chip ld-filter-chip-active" : "ld-filter-chip"}
                  aria-pressed={active}
                  onClick={() => setSelectedType(filter.value)}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {tagOptions.length > 0 && (
          <div className="mt-4">
            <p className="ld-filter-label">标签</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tagOptions.map((tag) => {
                const active = selectedTags.includes(tag);

                return (
                  <button
                    key={tag}
                    type="button"
                    className={active ? "ld-filter-chip ld-filter-chip-active" : "ld-filter-chip"}
                    aria-pressed={active}
                    onClick={() => setSelectedTags((current) => toggleTag(current, tag))}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--hairline-soft)] pt-4">
          <p className="text-sm text-[var(--muted)]">
            匹配 <span className="font-semibold text-[var(--ink)]">{filteredResources.length}</span> / {resources.length} 条资源
          </p>
          {hasFilters && (
            <button type="button" className="ld-button-secondary min-h-0 px-3 py-2 text-xs" onClick={clearFilters}>
              清除筛选
            </button>
          )}
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="ld-card-light p-10 text-center">
          <p className="ld-display text-3xl text-[var(--ink)]">没有找到匹配资源</p>
          <p className="mt-3 text-[var(--muted)]">调整关键词、类型或标签筛选后再试。</p>
          <button type="button" className="ld-button-primary mt-6" onClick={clearFilters}>
            清除筛选
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {selectedType !== "tutorial" && <ResourceSection title="工具项目" resources={toolResources} />}
          {selectedType !== "tool" && <ResourceSection title="LinuxDo 教程" resources={tutorialResources} />}
        </div>
      )}
    </div>
  );
}
