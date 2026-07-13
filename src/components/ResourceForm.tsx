"use client";

import { useMemo, useState } from "react";
import { parseStoredResourceTags, type ResourceType } from "@/lib/resource-payload";
import { buildResourceFormPayload } from "@/lib/admin/forms/resource-form-payload";
import { FormSection as Section } from "@/components/forms/FormSection";
import { FormTextField as TextField } from "@/components/forms/FormTextField";
import { FormCheckboxGroup } from "@/components/forms/FormCheckboxGroup";
import { FormSubmitBar } from "@/components/forms/FormSubmitBar";

type ResourceFormData = Record<string, unknown>;

interface ResourceFormProps {
  initialData?: ResourceFormData;
  tagOptions: string[];
  onSubmit: (data: ResourceFormData) => void;
  saving: boolean;
}

function getStringValue(value: unknown) {
  if (value == null) return "";
  return String(value);
}

function getBooleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function normalizeTag(value: string) {
  return value.trim();
}

export default function ResourceForm({ initialData, tagOptions, onSubmit, saving }: ResourceFormProps) {
  const d = initialData || {};
  const initialType = d.type === "tutorial" ? "tutorial" : "tool";
  const [type, setType] = useState<ResourceType>(initialType);
  const [tagInput, setTagInput] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(() => parseStoredResourceTags(getStringValue(d.tags) || null));
  const isNew = !initialData;

  const suggestions = useMemo(() => {
    const selectedKeys = new Set(selectedTags.map((tag) => tag.toLowerCase()));
    const query = tagInput.trim().toLowerCase();

    return tagOptions
      .filter((tag) => !selectedKeys.has(tag.toLowerCase()))
      .filter((tag) => !query || tag.toLowerCase().includes(query))
      .slice(0, 12);
  }, [selectedTags, tagInput, tagOptions]);

  function addTag(value = tagInput) {
    const tag = normalizeTag(value);
    if (!tag) return;

    setSelectedTags((current) => {
      if (current.some((item) => item.toLowerCase() === tag.toLowerCase())) return current;
      return [...current, tag];
    });
    setTagInput("");
    setTagDropdownOpen(false);
  }

  function removeTag(tag: string) {
    setSelectedTags((current) => current.filter((item) => item !== tag));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    onSubmit(buildResourceFormPayload(form, { type, tags: selectedTags }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section title="基础信息" description="用于公开资源卡片和后台列表的核心资料。">
        <div>
          <p className="ld-label">类型</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {[
              { value: "tool", label: "工具项目", description: "开源项目、网站工具、演示站等。" },
              { value: "tutorial", label: "LinuxDo 教程", description: "高质量教程帖、部署经验和排错记录。" },
            ].map((option) => {
              const active = type === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={active ? "ld-filter-chip ld-filter-chip-active justify-start rounded-lg px-4 py-3 text-left" : "ld-filter-chip justify-start rounded-lg px-4 py-3 text-left"}
                  aria-pressed={active}
                  onClick={() => setType(option.value as ResourceType)}
                >
                  <span>
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs font-normal text-[var(--muted)]">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <TextField name="title" label="标题" required defaultValue={d.title} placeholder="资源名称或教程标题" />
        <div>
          <label htmlFor="description" className="ld-label">
            简介
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={getStringValue(d.description)}
            className="ld-input mt-2 min-h-28 resize-y"
            placeholder="说明这个资源解决什么问题，适合什么场景。"
          />
        </div>
      </Section>

      <Section title="标签" description="可自由输入，也可从已有标签里选择复用。">
        <div className="relative">
          <label htmlFor="tagInput" className="ld-label">
            添加标签
          </label>
          <input
            id="tagInput"
            value={tagInput}
            onChange={(event) => {
              const value = event.target.value;
              if (value.includes(",")) {
                value.split(",").forEach((part) => addTag(part));
              } else {
                setTagInput(value);
                setTagDropdownOpen(true);
              }
            }}
            onFocus={() => setTagDropdownOpen(true)}
            onBlur={() => window.setTimeout(() => setTagDropdownOpen(false), 120)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addTag();
              }
            }}
            className="ld-input mt-2"
            placeholder="输入后按 Enter，或从下拉建议选择"
            autoComplete="off"
            role="combobox"
            aria-expanded={tagDropdownOpen}
            aria-controls="resource-tag-options"
          />

          {tagDropdownOpen && (tagInput.trim() || suggestions.length > 0) && (
            <div
              id="resource-tag-options"
              className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] p-1 shadow-[var(--shadow-soft)]"
              role="listbox"
            >
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[var(--body-strong)] hover:bg-[var(--surface-card)]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addTag(tag)}
                  role="option"
                  aria-selected="false"
                >
                  {tag}
                </button>
              ))}
              {tagInput.trim() && !suggestions.some((tag) => tag.toLowerCase() === tagInput.trim().toLowerCase()) && (
                <button
                  type="button"
                  className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[var(--body-strong)] hover:bg-[var(--surface-card)]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addTag()}
                  role="option"
                  aria-selected="false"
                >
                  新建标签：{tagInput.trim()}
                </button>
              )}
            </div>
          )}
        </div>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button key={tag} type="button" className="ld-filter-chip ld-filter-chip-active" onClick={() => removeTag(tag)}>
                {tag} ×
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title="LinuxDo 链接" description="工具项目可填讨论帖，教程帖可填原帖地址。">
        <TextField name="linuxdoUrl" label="LinuxDo 链接" type="url" defaultValue={d.linuxdoUrl} placeholder="https://linux.do/t/topic/..." />
      </Section>

      <Section title="工具链接" description="工具项目常用入口；教程帖通常可留空。" muted={type !== "tool"}>
        <div className="grid gap-4 md:grid-cols-3">
          <TextField name="githubUrl" label="GitHub" type="url" defaultValue={d.githubUrl} placeholder="https://github.com/..." />
          <TextField name="officialUrl" label="官网" type="url" defaultValue={d.officialUrl} placeholder="https://example.com" />
          <TextField name="demoUrl" label="演示站" type="url" defaultValue={d.demoUrl} placeholder="https://demo.example.com" />
        </div>
      </Section>

      <Section title="教程说明" description="用于解释教程为什么值得收藏；工具项目可留空。" muted={type !== "tutorial"}>
        <div>
          <label htmlFor="recommendation" className="ld-label">
            推荐理由
          </label>
          <textarea
            id="recommendation"
            name="recommendation"
            rows={4}
            defaultValue={getStringValue(d.recommendation)}
            className="ld-input mt-2 min-h-28 resize-y"
            placeholder="例如：步骤完整，评论区有大量排错补充。"
          />
        </div>
      </Section>

      <Section title="发布状态">
        <FormCheckboxGroup
          fields={[
            {
              name: "isActive",
              label: "公开展示",
              description: "只有公开展示的资源会出现在首页资源 tab。",
              defaultChecked: isNew ? true : getBooleanValue(d.isActive, true),
            },
          ]}
          columnsClassName=""
        />
      </Section>

      <FormSubmitBar saving={saving} idleLabel="保存资源" />
    </form>
  );
}
