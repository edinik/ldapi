"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { lobeIconOptions } from "@/lib/developer-icons";
import { parseReasoningEffortLevels, reasoningEffortLevels } from "@/lib/site-model-capabilities";
import { buildModelFormPayload } from "@/lib/admin/forms/model-form-payload";
import { FormSection as Section } from "@/components/forms/FormSection";
import { FormTextField as TextField } from "@/components/forms/FormTextField";
import { FormCheckboxGroup as CheckboxGroup } from "@/components/forms/FormCheckboxGroup";
import { FormSubmitBar } from "@/components/forms/FormSubmitBar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ModelFormData = Record<string, unknown>;

const developerOptions = [
  "deepseek",
  "alibaba",
  "zai",
  "openai",
  "moonshot",
  "anthropic",
  "google",
  "minimax",
  "kwaipilot",
  "xiaomi",
  "longcat",
  "mistral",
  "nvidia",
  "xai",
  "bytedance",
  "stepfun",
  "meta",
];
const maxVisibleIconOptions = 80;
const typeOptions = ["对话", "嵌入", "重排序", "图像生成", "视频生成", "语音生成"];

interface ModelFormProps {
  initialData?: ModelFormData;
  onSubmit: (data: ModelFormData) => void;
  saving: boolean;
}

function getStringValue(value: unknown) {
  if (value == null) return "";
  return String(value);
}

function DeveloperCombobox({ defaultValue }: { defaultValue?: unknown }) {
  const initialValue = getStringValue(defaultValue);
  const [value, setValue] = useState(initialValue);
  const options = useMemo(() => {
    const merged =
      initialValue && !developerOptions.includes(initialValue)
        ? [initialValue, ...developerOptions]
        : developerOptions;
    const query = value.trim().toLowerCase();
    if (!query) return merged;
    return merged.filter((option) => option.toLowerCase().includes(query));
  }, [initialValue, value]);

  return (
    <Field>
      <FieldLabel htmlFor="developer">开发者</FieldLabel>
      <Combobox<string>
        items={options}
        inputValue={value}
        onInputValueChange={setValue}
        onValueChange={(next) => {
          if (next) setValue(next);
        }}
      >
        <ComboboxInput
          id="developer"
          name="developer"
          placeholder="输入或选择开发者"
          autoComplete="off"
          className="w-full"
        />
        <ComboboxContent>
          <ComboboxEmpty>没有匹配项，可直接保存为新开发者。</ComboboxEmpty>
          <ComboboxList>
            {(option: string) => (
              <ComboboxItem key={option} value={option}>
                {option}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}

function IconCombobox({ defaultValue }: { defaultValue?: unknown }) {
  const initialValue = getStringValue(defaultValue);
  const [value, setValue] = useState(initialValue);
  const matchedOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return lobeIconOptions;
    return lobeIconOptions.filter(
      (option) => option.label.includes(query) || option.value.toLowerCase().includes(query),
    );
  }, [value]);
  const options = matchedOptions.slice(0, maxVisibleIconOptions);
  const displayedOptions = [{ label: "自动匹配开发者", value: "" }, ...options];

  return (
    <Field>
      <FieldLabel htmlFor="icon">图标</FieldLabel>
      <div className="flex gap-2">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-muted/50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-7 object-contain" />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">自动</span>
          )}
        </span>
        <Combobox<(typeof displayedOptions)[number]>
          items={displayedOptions}
          filter={null}
          inputValue={value}
          itemToStringLabel={(option) => option.value}
          onInputValueChange={setValue}
          onValueChange={(next) => {
            if (next) setValue(next.value);
          }}
        >
          <ComboboxInput
            id="icon"
            name="icon"
            placeholder="留空自动匹配开发者，或选择/输入图标地址"
            autoComplete="off"
            className="flex-1"
          />
          <ComboboxContent>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
              显示 {options.length} / {matchedOptions.length} 个 lobe-icons 图标，输入关键词可继续缩小范围。
            </div>
            <ComboboxList>
              {(option: (typeof displayedOptions)[number]) => (
                <ComboboxItem key={option.value || "__auto"} value={option}>
                  <span className="flex items-center gap-3">
                    {option.value ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={option.value} alt="" className="size-7 object-contain" />
                    ) : (
                      <span className="grid size-7 place-items-center rounded-md bg-muted text-[0.625rem] text-muted-foreground">
                        自动
                      </span>
                    )}
                    <span>{option.label}</span>
                  </span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <FieldDescription>留空时主页会按开发者自动匹配 lobe-icons 图标。</FieldDescription>
    </Field>
  );
}

function TypeSelect({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue || "none");

  return (
    <Field>
      <FieldLabel>类型</FieldLabel>
      <input type="hidden" name="type" value={value === "none" ? "" : value} />
      <Select value={value} onValueChange={(next) => setValue(next ?? "none")}>
        <SelectTrigger className="w-full font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">未选择</SelectItem>
          {typeOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function ReasoningEffortCheckboxes({
  defaultValue,
  name = "reasoningEffortLevels",
}: {
  defaultValue?: unknown;
  name?: string;
}) {
  const selected = parseReasoningEffortLevels(defaultValue as string | string[] | null | undefined);

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-sm font-semibold text-foreground">推理强度</p>
      <p className="mt-1 text-sm text-muted-foreground">为空表示支持推理但不可设置强度。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {reasoningEffortLevels.map((level) => (
          <label
            key={level}
            className="flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground"
          >
            <Checkbox name={name} value={level} defaultChecked={selected.includes(level)} />
            {level}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ModelForm({ initialData, onSubmit, saving }: ModelFormProps) {
  const d = initialData || {};
  const isNew = !initialData;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    onSubmit(buildModelFormPayload(form));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-5">
          <Section title="基础信息" description="用于后台识别和公开卡片展示的核心资料。">
            <DeveloperCombobox defaultValue={d.developer} />
            <TextField name="modelId" label="模型 ID" defaultValue={d.modelId} placeholder="claude-opus-4-8" />
            <TextField name="name" label="名称" required defaultValue={d.name} placeholder="Claude Opus 4.8" />
            <IconCombobox defaultValue={d.icon} />
            <TextField
              name="officialUrl"
              label="官网/价格页"
              type="url"
              defaultValue={d.officialUrl}
              placeholder="https://docs.example.com/models"
              helper="主页点击模型名称会打开这个链接。"
            />
            <TextField name="group" label="分组" defaultValue={d.group} placeholder="claude-opus" />
            <TypeSelect defaultValue={getStringValue(d.type)} />
            <Field>
              <FieldLabel htmlFor="notes">备注</FieldLabel>
              <Textarea id="notes" name="notes" rows={4} defaultValue={getStringValue(d.notes)} className="min-h-28" />
            </Field>
          </Section>

          <Section title="展示控制">
            <CheckboxGroup
              data={d}
              fields={[
                {
                  name: "isActive",
                  label: "启用",
                  description: "停用后不再作为有效模型展示。",
                  defaultChecked: isNew ? true : d.isActive !== false,
                },
                {
                  name: "showOnHome",
                  label: "主页展示",
                  description: "启用且勾选后出现在主页模型速览。",
                },
              ]}
            />
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="模型卡片" description="能力、模态、成本和限制会用于主页速览。">
            <div>
              <p className="text-sm font-medium text-foreground">能力</p>
              <div className="mt-2">
                <CheckboxGroup
                  data={d}
                  fields={[
                    { name: "supportsToolCalling", label: "工具调用" },
                    { name: "supportsVision", label: "视觉" },
                    { name: "supportsTemperatureControl", label: "温度" },
                    { name: "supportsReasoning", label: "推理支持" },
                    { name: "supportsWebSearch", label: "联网" },
                  ]}
                />
              </div>
            </div>

            <ReasoningEffortCheckboxes defaultValue={d.reasoningEffortLevels} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-foreground">输入模态</p>
                <div className="mt-2">
                  <CheckboxGroup
                    data={d}
                    fields={[
                      { name: "inputText", label: "文本", defaultChecked: isNew ? true : !!d.inputText },
                      { name: "inputImage", label: "图像" },
                      { name: "inputAudio", label: "音频" },
                      { name: "inputVideo", label: "视频" },
                    ]}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">输出模态</p>
                <div className="mt-2">
                  <CheckboxGroup
                    data={d}
                    fields={[
                      { name: "outputText", label: "文本", defaultChecked: isNew ? true : !!d.outputText },
                      { name: "outputImage", label: "图像" },
                      { name: "outputAudio", label: "音频" },
                      { name: "outputVideo", label: "视频" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section title="成本 ($/M tokens)" description="价格仅用于展示，实际计费以渠道模型价格为准。">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField name="inputCostPerMTokens" label="输入" type="number" step="any" defaultValue={d.inputCostPerMTokens} />
              <TextField name="outputCostPerMTokens" label="输出" type="number" step="any" defaultValue={d.outputCostPerMTokens} />
              <TextField
                name="cacheReadCostPerMTokens"
                label="缓存读取"
                type="number"
                step="any"
                defaultValue={d.cacheReadCostPerMTokens}
              />
              <TextField
                name="cacheWriteCostPerMTokens"
                label="缓存写入"
                type="number"
                step="any"
                defaultValue={d.cacheWriteCostPerMTokens}
              />
            </div>
          </Section>

          <Section title="限制">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                name="contextWindow"
                label="上下文"
                type="number"
                defaultValue={d.contextWindow}
                helper="例如 1000000 会显示为 1M。"
              />
              <TextField
                name="maxOutputTokens"
                label="输出"
                type="number"
                defaultValue={d.maxOutputTokens}
                helper="例如 128000 会显示为 128K。"
              />
            </div>
          </Section>

          <Section title="日期">
            <div className="grid gap-4 md:grid-cols-3">
              <TextField name="knowledgeCutoff" label="知识截止" type="date" defaultValue={d.knowledgeCutoff} />
              <TextField name="releaseDate" label="发布日期" type="date" defaultValue={d.releaseDate} />
              <TextField name="lastUpdated" label="最后更新" type="date" defaultValue={d.lastUpdated} />
            </div>
          </Section>
        </div>
      </div>

      <FormSubmitBar saving={saving} idleLabel="保存模型" />
    </form>
  );
}
