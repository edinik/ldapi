"use client";

import { useMemo, useState } from "react";
import { parseStoredResourceTags, type ResourceType } from "@/lib/resource-payload";
import { buildResourceFormPayload } from "@/lib/admin/forms/resource-form-payload";
import { FormSection as Section } from "@/components/forms/FormSection";
import { FormTextField as TextField } from "@/components/forms/FormTextField";
import { FormCheckboxGroup } from "@/components/forms/FormCheckboxGroup";
import { FormSubmitBar } from "@/components/forms/FormSubmitBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { XIcon } from "lucide-react";

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
  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    parseStoredResourceTags(getStringValue(d.tags) || null),
  );
  const isNew = !initialData;

  const suggestions = useMemo(() => {
    const selectedKeys = new Set(selectedTags.map((tag) => tag.toLowerCase()));
    const query = tagInput.trim().toLowerCase();

    return tagOptions
      .filter((tag) => !selectedKeys.has(tag.toLowerCase()))
      .filter((tag) => !query || tag.toLowerCase().includes(query))
      .slice(0, 12);
  }, [selectedTags, tagInput, tagOptions]);
  const tagComboboxItems = useMemo(() => {
    const items = suggestions.map((tag) => ({ value: tag, label: tag, create: false }));
    const trimmed = tagInput.trim();
    const exactMatch = tagOptions.some((tag) => tag.toLowerCase() === trimmed.toLowerCase());

    if (trimmed && !exactMatch) {
      items.push({ value: trimmed, label: `新建标签：${trimmed}`, create: true });
    }

    return items;
  }, [suggestions, tagInput, tagOptions]);

  function addTag(value = tagInput) {
    const tag = normalizeTag(value);
    if (!tag) return;

    setSelectedTags((current) => {
      if (current.some((item) => item.toLowerCase() === tag.toLowerCase())) return current;
      return [...current, tag];
    });
    setTagInput("");
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
          <p className="text-sm font-medium text-foreground">类型</p>
          <ToggleGroup
            value={[type]}
            onValueChange={(values) => {
              const next = values[values.length - 1] as ResourceType | undefined;
              if (next === "tool" || next === "tutorial") setType(next);
            }}
            className="mt-2 grid gap-3 sm:grid-cols-2"
            spacing={0}
          >
            {[
              { value: "tool", label: "工具项目", description: "开源项目、网站工具、演示站等。" },
              { value: "tutorial", label: "LinuxDo 教程", description: "高质量教程帖、部署经验和排错记录。" },
            ].map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                variant="outline"
                className="h-auto justify-start rounded-lg px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs font-normal text-muted-foreground">{option.description}</span>
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <TextField name="title" label="标题" required defaultValue={d.title} placeholder="资源名称或教程标题" />
        <Field>
          <FieldLabel htmlFor="description">简介</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={getStringValue(d.description)}
            className="min-h-28"
            placeholder="说明这个资源解决什么问题，适合什么场景。"
          />
        </Field>
      </Section>

      <Section title="标签" description="可自由输入，也可从已有标签里选择复用。">
        <Field>
          <FieldLabel htmlFor="tagInput">添加标签</FieldLabel>
          <Combobox<(typeof tagComboboxItems)[number]>
            items={tagComboboxItems}
            filter={null}
            inputValue={tagInput}
            itemToStringLabel={(item) => item.value}
            onInputValueChange={(next, { reason }) => {
              if (reason === "item-press") return;
              if (next.includes(",")) {
                next.split(",").forEach((part) => addTag(part));
                return;
              }
              setTagInput(next);
            }}
            onValueChange={(next) => {
              if (next) addTag(next.value);
            }}
          >
            <ComboboxInput
              id="tagInput"
              placeholder="输入后按 Enter，或从下拉建议选择"
              autoComplete="off"
              className="w-full"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.currentTarget.getAttribute("aria-activedescendant")) {
                  event.preventDefault();
                  addTag();
                }
              }}
            />
            <ComboboxContent>
              <ComboboxEmpty>没有可用标签。</ComboboxEmpty>
              <ComboboxList>
                {(item: (typeof tagComboboxItems)[number]) => (
                  <ComboboxItem key={`${item.create ? "create" : "existing"}:${item.value}`} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-5"
                  onClick={() => removeTag(tag)}
                  aria-label={`移除标签 ${tag}`}
                >
                  <XIcon className="size-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </Section>

      <Section title="LinuxDo 链接" description="工具项目可填讨论帖，教程帖可填原帖地址。">
        <TextField
          name="linuxdoUrl"
          label="LinuxDo 链接"
          type="url"
          defaultValue={d.linuxdoUrl}
          placeholder="https://linux.do/t/topic/..."
        />
      </Section>

      <Section title="工具链接" description="工具项目常用入口；教程帖通常可留空。" muted={type !== "tool"}>
        <div className="grid gap-4 md:grid-cols-3">
          <TextField name="githubUrl" label="GitHub" type="url" defaultValue={d.githubUrl} placeholder="https://github.com/..." />
          <TextField name="officialUrl" label="官网" type="url" defaultValue={d.officialUrl} placeholder="https://example.com" />
          <TextField name="demoUrl" label="演示站" type="url" defaultValue={d.demoUrl} placeholder="https://demo.example.com" />
        </div>
      </Section>

      <Section title="教程说明" description="用于解释教程为什么值得收藏；工具项目可留空。" muted={type !== "tutorial"}>
        <Field>
          <FieldLabel htmlFor="recommendation">推荐理由</FieldLabel>
          <Textarea
            id="recommendation"
            name="recommendation"
            rows={4}
            defaultValue={getStringValue(d.recommendation)}
            className="min-h-28"
            placeholder="例如：步骤完整，评论区有大量排错补充。"
          />
        </Field>
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
