"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseStoredResourceTags, type ResourceType } from "@/lib/resource-payload";
import {
  mergeResourceAiSuggestion,
  parseResourceAiSuggestion,
} from "@/lib/resource-ai-contract";
import { buildResourceFormPayload } from "@/lib/admin/forms/resource-form-payload";
import { FormSection as Section } from "@/components/forms/FormSection";
import { FormTextField as TextField } from "@/components/forms/FormTextField";
import { FormCheckboxGroup } from "@/components/forms/FormCheckboxGroup";
import { FormSubmitBar } from "@/components/forms/FormSubmitBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { LoaderCircle, PlusIcon, SparklesIcon, XIcon } from "lucide-react";

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

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getFormField(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement ? field : null;
}

function parseAiResponse(value: unknown) {
  const payload = asRecord(value);
  const error = typeof payload?.error === "string" ? payload.error : null;
  const suggestion = parseResourceAiSuggestion(payload?.suggestion);

  return suggestion.ok
    ? ({ ok: true, suggestion: suggestion.value } as const)
    : ({ ok: false, error: error || suggestion.error } as const);
}

type AiFeedback = {
  status: "success" | "error";
  message: string;
};

const generateTimeoutMs = 180_000;

export default function ResourceForm({ initialData, tagOptions, onSubmit, saving }: ResourceFormProps) {
  const d = initialData || {};
  const initialType = d.type === "tutorial" ? "tutorial" : "tool";
  const [type, setType] = useState<ResourceType>(initialType);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    parseStoredResourceTags(getStringValue(d.tags) || null),
  );
  const [generating, setGenerating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null);
  const [aiCandidateTags, setAiCandidateTags] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const generationAbortController = useRef<AbortController | null>(null);
  const generationRequestId = useRef(0);
  const selectedTagsRef = useRef(selectedTags);
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
  const visibleAiCandidateTags = useMemo(() => {
    const selectedKeys = new Set(selectedTags.map((tag) => tag.toLowerCase()));
    return aiCandidateTags.filter((tag) => !selectedKeys.has(tag.toLowerCase()));
  }, [aiCandidateTags, selectedTags]);

  useEffect(() => {
    selectedTagsRef.current = selectedTags;
  }, [selectedTags]);

  useEffect(() => {
    return () => {
      generationRequestId.current += 1;
      generationAbortController.current?.abort();
    };
  }, []);

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

  function changeType(next: ResourceType) {
    if (next !== "tool") {
      generationRequestId.current += 1;
      generationAbortController.current?.abort();
      generationAbortController.current = null;
      setGenerating(false);
      setAiFeedback(null);
      setAiCandidateTags([]);
    }
    setType(next);
  }

  function addAiCandidateTag(tag: string) {
    addTag(tag);
    setAiCandidateTags((current) => current.filter((item) => item.toLowerCase() !== tag.toLowerCase()));
  }

  async function generateResourceContent() {
    const form = formRef.current;
    if (!form) return;

    const title = getFormField(form, "title")?.value.trim() || "";
    if (!title) {
      setAiFeedback({ status: "error", message: "请先填写资源标题" });
      getFormField(form, "title")?.focus();
      return;
    }

    generationAbortController.current?.abort();
    const controller = new AbortController();
    const requestId = generationRequestId.current + 1;
    generationRequestId.current = requestId;
    generationAbortController.current = controller;
    setGenerating(true);
    setAiFeedback(null);
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, generateTimeoutMs);

    try {
      const response = await fetch("/api/resources/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          githubUrl: getFormField(form, "githubUrl")?.value || null,
          officialUrl: getFormField(form, "officialUrl")?.value || null,
          existingTags: Array.from(new Set([...tagOptions, ...selectedTagsRef.current])),
        }),
        signal: controller.signal,
      });
      const responseText = await response.text();
      let payload: unknown;
      try {
        payload = JSON.parse(responseText);
      } catch {
        if (generationRequestId.current !== requestId) return;
        setAiFeedback({
          status: "error",
          message: response.ok ? "AI 服务返回了无法解析的响应" : `AI 生成失败：HTTP ${response.status}`,
        });
        return;
      }

      const result = parseAiResponse(payload);
      if (generationRequestId.current !== requestId) return;
      if (!response.ok || !result.ok) {
        setAiFeedback({
          status: "error",
          message: result.ok ? `AI 生成失败：HTTP ${response.status}` : result.error,
        });
        return;
      }

      const currentForm = formRef.current;
      if (!currentForm || type !== "tool") return;
      const merged = mergeResourceAiSuggestion(
        {
          description: getFormField(currentForm, "description")?.value || "",
          githubUrl: getFormField(currentForm, "githubUrl")?.value || "",
          officialUrl: getFormField(currentForm, "officialUrl")?.value || "",
          demoUrl: getFormField(currentForm, "demoUrl")?.value || "",
          selectedTags: selectedTagsRef.current,
        },
        result.suggestion,
      );

      for (const fieldName of merged.filledFields) {
        const field = getFormField(currentForm, fieldName);
        if (field) field.value = merged.values[fieldName];
      }
      setAiCandidateTags(merged.candidateTags);

      const filledCount = merged.filledFields.length;
      const candidateCount = merged.candidateTags.length;
      setAiFeedback({
        status: "success",
        message:
          filledCount > 0 || candidateCount > 0
            ? `已填充 ${filledCount} 个空字段，并找到 ${candidateCount} 个候选标签。请检查后再保存。`
            : "AI 已完成查询，但当前字段已有内容或没有找到可确认的新资料。",
      });
    } catch (error) {
      if (generationRequestId.current !== requestId) return;
      const message = timedOut
        ? "AI 生成超时（超过 180 秒），请稍后重试"
        : error instanceof Error && error.name === "AbortError"
          ? "AI 生成已取消"
          : "AI 请求失败，请检查网络后重试";
      setAiFeedback({ status: "error", message });
    } finally {
      window.clearTimeout(timeoutId);
      if (generationRequestId.current === requestId) {
        generationAbortController.current = null;
        setGenerating(false);
      }
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    onSubmit(buildResourceFormPayload(form, { type, tags: selectedTags }));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <Section title="基础信息" description="用于公开资源卡片和后台列表的核心资料。">
        <div>
          <p className="text-sm font-medium text-foreground">类型</p>
          <ToggleGroup
            value={[type]}
            onValueChange={(values) => {
              const next = values[values.length - 1] as ResourceType | undefined;
              if (next === "tool" || next === "tutorial") changeType(next);
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
        {isNew && type === "tool" && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-foreground">AI 生成内容</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  根据标题整理简介和候选标签；如果下方已填写 GitHub 或官网，会优先查询这些来源。
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                disabled={generating}
                onClick={() => void generateResourceContent()}
              >
                {generating ? (
                  <LoaderCircle data-icon="inline-start" className="animate-spin" />
                ) : (
                  <SparklesIcon data-icon="inline-start" />
                )}
                {generating ? "正在查询..." : "AI 生成内容"}
              </Button>
            </div>
            {generating && (
              <Alert role="status" aria-live="polite">
                <LoaderCircle className="animate-spin" />
                <AlertTitle>正在研究项目资料</AlertTitle>
                <AlertDescription>AI 正在核对项目来源，完成后只会填充当前空字段。</AlertDescription>
              </Alert>
            )}
            {!generating && aiFeedback && (
              <Alert
                variant={aiFeedback.status === "error" ? "destructive" : "default"}
                role={aiFeedback.status === "error" ? "alert" : "status"}
                aria-live={aiFeedback.status === "error" ? "assertive" : "polite"}
              >
                <AlertTitle>{aiFeedback.status === "success" ? "生成完成" : "生成失败"}</AlertTitle>
                <AlertDescription>{aiFeedback.message}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
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

        {visibleAiCandidateTags.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-sm font-semibold text-foreground">AI 候选标签</p>
            <p className="mt-1 text-xs text-muted-foreground">点击后才会加入资源标签。</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleAiCandidateTags.map((tag) => (
                <Button key={tag} type="button" variant="outline" size="sm" onClick={() => addAiCandidateTag(tag)}>
                  <PlusIcon data-icon="inline-start" />
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

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
