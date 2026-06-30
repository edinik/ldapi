"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { lobeIconOptions } from "@/lib/developer-icons";
import { parseReasoningEffortLevels, reasoningEffortLevels } from "@/lib/site-model-capabilities";

type ModelFormData = Record<string, unknown>;

type CheckboxField = {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
};

type TextFieldProps = {
  name: string;
  label: string;
  type?: string;
  step?: string;
  required?: boolean;
  defaultValue?: unknown;
  placeholder?: string;
  helper?: string;
};

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

interface ModelFormProps {
  initialData?: ModelFormData;
  onSubmit: (data: ModelFormData) => void;
  saving: boolean;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="ld-card-light p-5">
      <legend className="px-1 text-lg font-semibold text-[var(--ink)]">{title}</legend>
      {description && <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </fieldset>
  );
}

function getStringValue(value: unknown) {
  if (value == null) return "";
  return String(value);
}

function TextField({
  name,
  label,
  type = "text",
  step,
  required = false,
  defaultValue,
  placeholder,
  helper,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="ld-label">
        {label}
        {required && <span className="text-[var(--primary)]"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={getStringValue(defaultValue)}
        placeholder={placeholder}
        className="ld-input mt-2"
      />
      {helper && <p className="ld-helper mt-2">{helper}</p>}
    </div>
  );
}

function DeveloperCombobox({ defaultValue }: { defaultValue?: unknown }) {
  const initialValue = getStringValue(defaultValue);
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const options = useMemo(() => {
    const merged = initialValue && !developerOptions.includes(initialValue) ? [initialValue, ...developerOptions] : developerOptions;
    const query = value.trim().toLowerCase();
    if (!query) return merged;
    return merged.filter((option) => option.toLowerCase().includes(query));
  }, [initialValue, value]);

  return (
    <div className="relative">
      <label htmlFor="developer" className="ld-label">
        开发者
      </label>
      <input
        id="developer"
        name="developer"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder="输入或选择开发者"
        className="ld-input mt-2"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="developer-options"
      />
      {open && (
        <div
          id="developer-options"
          className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] p-1 shadow-[var(--shadow-soft)]"
          role="listbox"
        >
          {options.length > 0 ? (
            options.map((option) => (
              <button
                key={option}
                type="button"
                className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[var(--body-strong)] hover:bg-[var(--surface-card)]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setValue(option);
                  setOpen(false);
                }}
                role="option"
                aria-selected={option === value}
              >
                {option}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-[var(--muted)]">没有匹配项，可直接保存为新开发者。</p>
          )}
        </div>
      )}
    </div>
  );
}

function IconCombobox({ defaultValue }: { defaultValue?: unknown }) {
  const initialValue = getStringValue(defaultValue);
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const matchedOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return lobeIconOptions;
    return lobeIconOptions.filter(
      (option) => option.label.includes(query) || option.value.toLowerCase().includes(query),
    );
  }, [value]);
  const options = matchedOptions.slice(0, maxVisibleIconOptions);

  return (
    <div className="relative">
      <label htmlFor="icon" className="ld-label">
        图标
      </label>
      <div className="mt-2 flex gap-2">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.62)]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-7 object-contain" />
          ) : (
            <span className="text-xs font-semibold text-[var(--muted)]">自动</span>
          )}
        </span>
        <input
          id="icon"
          name="icon"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder="留空自动匹配开发者，或选择/输入图标地址"
          className="ld-input"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="icon-options"
        />
      </div>
      {open && (
        <div
          id="icon-options"
          className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] p-1 shadow-[var(--shadow-soft)]"
          role="listbox"
        >
          <button
            type="button"
            className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-[var(--body-strong)] hover:bg-[var(--surface-card)]"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setValue("");
              setOpen(false);
            }}
            role="option"
            aria-selected={!value}
          >
            <span className="grid size-7 place-items-center rounded-md bg-[rgba(250,249,245,0.62)] text-[0.625rem] text-[var(--muted)]">
              自动
            </span>
            自动匹配开发者
          </button>
          <div className="px-3 py-2 text-xs font-semibold text-[var(--muted)]">
            显示 {options.length} / {matchedOptions.length} 个 lobe-icons 图标，输入关键词可继续缩小范围。
          </div>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-[var(--body-strong)] hover:bg-[var(--surface-card)]"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setValue(option.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={option.value === value}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={option.value} alt="" className="size-7 object-contain" />
              <span>{option.label}</span>
            </button>
          ))}
          {options.length === 0 && <p className="px-3 py-2 text-sm text-[var(--muted)]">没有匹配项，可直接输入图标 URL 或本地路径。</p>}
        </div>
      )}
      <p className="ld-helper mt-2">留空时主页会按开发者自动匹配 lobe-icons 图标。</p>
    </div>
  );
}

function CheckboxGroup({ fields, data }: { fields: CheckboxField[]; data: ModelFormData }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <label
          key={field.name}
          className="flex gap-3 rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.64)] p-3"
        >
          <input
            name={field.name}
            type="checkbox"
            defaultChecked={field.defaultChecked ?? !!data[field.name]}
            className="mt-1 size-4 accent-[var(--primary)]"
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--ink)]">{field.label}</span>
            {field.description && <span className="ld-helper mt-1 block">{field.description}</span>}
          </span>
        </label>
      ))}
    </div>
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
    <div className="rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.64)] p-3">
      <p className="text-sm font-semibold text-[var(--ink)]">推理强度</p>
      <p className="ld-helper mt-1">为空表示支持推理但不可设置强度。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {reasoningEffortLevels.map((level) => (
          <label key={level} className="flex min-h-9 items-center gap-2 rounded-full border border-[var(--hairline)] bg-[rgba(250,249,245,0.7)] px-3 text-xs font-semibold text-[var(--body-strong)]">
            <input name={name} type="checkbox" value={level} defaultChecked={selected.includes(level)} className="size-3.5 accent-[var(--primary)]" />
            {level}
          </label>
        ))}
      </div>
    </div>
  );
}

function getBoolean(form: FormData, name: string) {
  return form.get(name) === "on";
}

function getValue(form: FormData, name: string) {
  return form.get(name) || null;
}

function getAllValues(form: FormData, name: string) {
  return form.getAll(name).map(String);
}

export default function ModelForm({ initialData, onSubmit, saving }: ModelFormProps) {
  const d = initialData || {};
  const isNew = !initialData;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    onSubmit({
      developer: getValue(form, "developer"),
      modelId: getValue(form, "modelId"),
      name: getValue(form, "name"),
      icon: getValue(form, "icon"),
      officialUrl: getValue(form, "officialUrl"),
      group: getValue(form, "group"),
      type: getValue(form, "type"),
      notes: getValue(form, "notes"),
      supportsToolCalling: getBoolean(form, "supportsToolCalling"),
      supportsVision: getBoolean(form, "supportsVision"),
      supportsTemperatureControl: getBoolean(form, "supportsTemperatureControl"),
      supportsReasoning: getBoolean(form, "supportsReasoning"),
      reasoningEffortLevels: getAllValues(form, "reasoningEffortLevels"),
      supportsWebSearch: getBoolean(form, "supportsWebSearch"),
      inputText: getBoolean(form, "inputText"),
      inputImage: getBoolean(form, "inputImage"),
      inputAudio: getBoolean(form, "inputAudio"),
      inputVideo: getBoolean(form, "inputVideo"),
      outputText: getBoolean(form, "outputText"),
      outputImage: getBoolean(form, "outputImage"),
      outputAudio: getBoolean(form, "outputAudio"),
      outputVideo: getBoolean(form, "outputVideo"),
      inputCostPerMTokens: getValue(form, "inputCostPerMTokens"),
      outputCostPerMTokens: getValue(form, "outputCostPerMTokens"),
      cacheReadCostPerMTokens: getValue(form, "cacheReadCostPerMTokens"),
      cacheWriteCostPerMTokens: getValue(form, "cacheWriteCostPerMTokens"),
      contextWindow: getValue(form, "contextWindow"),
      maxOutputTokens: getValue(form, "maxOutputTokens"),
      knowledgeCutoff: getValue(form, "knowledgeCutoff"),
      releaseDate: getValue(form, "releaseDate"),
      lastUpdated: getValue(form, "lastUpdated"),
      isActive: getBoolean(form, "isActive"),
      showOnHome: getBoolean(form, "showOnHome"),
    });
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
            <TextField name="type" label="类型" defaultValue={d.type} placeholder="对话" />
            <div>
              <label htmlFor="notes" className="ld-label">
                备注
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={getStringValue(d.notes)}
                className="ld-input mt-2 min-h-28 resize-y"
              />
            </div>
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
              <p className="ld-label">能力</p>
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
                <p className="ld-label">输入模态</p>
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
                <p className="ld-label">输出模态</p>
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
              <TextField name="cacheReadCostPerMTokens" label="缓存读取" type="number" step="any" defaultValue={d.cacheReadCostPerMTokens} />
              <TextField name="cacheWriteCostPerMTokens" label="缓存写入" type="number" step="any" defaultValue={d.cacheWriteCostPerMTokens} />
            </div>
          </Section>

          <Section title="限制">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField name="contextWindow" label="上下文" type="number" defaultValue={d.contextWindow} helper="例如 1000000 会显示为 1M。" />
              <TextField name="maxOutputTokens" label="输出" type="number" defaultValue={d.maxOutputTokens} helper="例如 128000 会显示为 128K。" />
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

      <div className="sticky bottom-4 z-10 rounded-xl border border-[var(--hairline)] bg-[rgba(250,249,245,0.88)] p-3 shadow-[var(--shadow-soft)] backdrop-blur">
        <button type="submit" disabled={saving} className="ld-button-primary w-full">
          {saving ? "保存中..." : "保存模型"}
        </button>
      </div>
    </form>
  );
}
