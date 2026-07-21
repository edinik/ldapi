"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function ResourceLinks({ resource }: { resource: DirectoryResource }) {
  const links = [
    { label: "GitHub", url: resource.githubUrl },
    { label: "官网", url: resource.officialUrl },
    { label: "演示站", url: resource.demoUrl },
    { label: resource.type === "tutorial" ? "阅读原帖" : "LinuxDo", url: resource.linuxdoUrl },
  ].filter((link): link is { label: string; url: string } => !!link.url);

  if (links.length === 0) return null;

  return (
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
  );
}

function ResourceCard({ resource }: { resource: DirectoryResource }) {
  return (
    <Card className="flex min-h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <div className="mb-2">
            <Badge variant={resource.type === "tool" ? "default" : "secondary"}>
              {resource.type === "tool" ? "工具项目" : "教程"}
            </Badge>
          </div>
          <CardTitle className="text-xl">{resource.title}</CardTitle>
        </div>
        {resource.linuxdoUrl && (
          <Button
            variant="outline"
            size="sm"
            render={<a href={resource.linuxdoUrl} target="_blank" rel="noopener noreferrer" />}
          >
            {resource.type === "tutorial" ? "阅读" : "讨论"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        {resource.description && <p className="text-sm leading-6 text-muted-foreground">{resource.description}</p>}

        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {resource.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {resource.recommendation && (
          <div className="rounded-lg bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">
            <p className="text-xs font-semibold text-muted-foreground">推荐理由</p>
            <p className="mt-1 text-foreground">{resource.recommendation}</p>
          </div>
        )}

        <ResourceLinks resource={resource} />
      </CardContent>
    </Card>
  );
}

function ResourceSection({ title, resources }: { title: string; resources: DirectoryResource[] }) {
  if (resources.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{resources.length} 条匹配资源</p>
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
  const [tagMultiple, setTagMultiple] = useState(true);
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
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle className="text-3xl font-semibold tracking-tight">暂无资源数据</EmptyTitle>
          <EmptyDescription>登录后台后可以添加工具项目或 LinuxDo 教程帖。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 p-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-foreground">搜索</span>
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、标签、链接、推荐理由..."
            />
          </label>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">类型</p>
            <ToggleGroup
              value={[selectedType]}
              onValueChange={(values) => {
                const next = values[values.length - 1] as ResourceTypeFilter | undefined;
                if (next) setSelectedType(next);
              }}
              variant="outline"
              spacing={2}
              className="flex flex-wrap"
            >
              {typeFilters.map((filter) => (
                <ToggleGroupItem key={filter.value} value={filter.value} className="rounded-full px-3">
                  {filter.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {tagOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">标签</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground"
                  onClick={() => {
                    setTagMultiple((value) => !value);
                    // 切到单选时只保留首个已选标签
                    setSelectedTags((current) => current.slice(0, 1));
                  }}
                  aria-label={tagMultiple ? "切换为单选" : "切换为多选"}
                  title={tagMultiple ? "切换为单选" : "切换为多选"}
                >
                  {tagMultiple ? "多选" : "单选"}
                </Button>
              </div>
              <ToggleGroup
                multiple={tagMultiple}
                value={selectedTags}
                onValueChange={(values) => {
                  // 单选模式下只取最后一次点击的标签
                  setSelectedTags(tagMultiple ? values : values.slice(-1));
                }}
                variant="outline"
                spacing={2}
                className="flex flex-wrap"
              >
                {tagOptions.map((tag) => (
                  <ToggleGroupItem key={tag} value={tag} className="rounded-full px-3">
                    {tag}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              匹配 <span className="font-semibold text-foreground">{filteredResources.length}</span> / {resources.length} 条资源
            </p>
            {hasFilters && (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredResources.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle className="text-3xl font-semibold tracking-tight">没有找到匹配资源</EmptyTitle>
            <EmptyDescription>调整关键词、类型或标签筛选后再试。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={clearFilters}>
              清除筛选
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-10">
          {selectedType !== "tutorial" && <ResourceSection title="工具项目" resources={toolResources} />}
          {selectedType !== "tool" && <ResourceSection title="LinuxDo 教程" resources={tutorialResources} />}
        </div>
      )}
    </div>
  );
}
