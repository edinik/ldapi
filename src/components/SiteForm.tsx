"use client";

import { useState } from "react";
import { filterAvailableSiteModels, type AvailableSiteModelOption } from "@/lib/site-model-options";
import { parseReasoningEffortLevels, reasoningEffortLevels, type ReasoningEffortLevel } from "@/lib/site-model-capabilities";

type SiteModelFormItem = {
  name: string;
  supportsToolCallingOverride: boolean | null;
  supportsVisionOverride: boolean | null;
  supportsTemperatureControlOverride: boolean | null;
  supportsReasoningOverride: boolean | null;
  reasoningEffortLevelsOverride: ReasoningEffortLevel[] | null;
  supportsWebSearchOverride: boolean | null;
  rating: string | null;
};

const ratingOptions = ["夯", "顶级", "人上人", "NPC", "拉"];

interface SiteFormProps {
  initialData?: Record<string, unknown> & { modelNames?: string[]; siteModels?: unknown[] };
  onSubmit: (data: Record<string, unknown>) => void;
  saving: boolean;
  availableModels?: AvailableSiteModelOption[];
}

type CheckboxField = {
  name: string;
  label: string;
  description?: string;
};

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

function TextField({
  name,
  label,
  type = "text",
  required = false,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
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
        required={required}
        defaultValue={defaultValue || ""}
        placeholder={placeholder}
        className="ld-input mt-2"
      />
    </div>
  );
}

function CheckboxGroup({ fields, data }: { fields: CheckboxField[]; data: Record<string, unknown> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {fields.map((field) => (
        <label
          key={field.name}
          className="flex gap-3 rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.64)] p-3"
        >
          <input
            name={field.name}
            type="checkbox"
            defaultChecked={!!data[field.name]}
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

function normalizeOverride(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  return null;
}

function getInitialSiteModels(initialData?: SiteFormProps["initialData"]): SiteModelFormItem[] {
  if (Array.isArray(initialData?.siteModels)) {
    return initialData.siteModels
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const model = record.model as Record<string, unknown> | undefined;
        const name = typeof model?.name === "string" ? model.name : typeof record.name === "string" ? record.name : "";
        if (!name) return null;

        return {
          name,
          supportsToolCallingOverride: normalizeOverride(record.supportsToolCallingOverride),
          supportsVisionOverride: normalizeOverride(record.supportsVisionOverride),
          supportsTemperatureControlOverride: normalizeOverride(record.supportsTemperatureControlOverride),
          supportsReasoningOverride: normalizeOverride(record.supportsReasoningOverride),
          reasoningEffortLevelsOverride: Array.isArray(record.reasoningEffortLevelsOverride)
            ? parseReasoningEffortLevels(record.reasoningEffortLevelsOverride.map(String))
            : typeof record.reasoningEffortLevelsOverride === "string"
              ? parseReasoningEffortLevels(record.reasoningEffortLevelsOverride)
              : null,
          supportsWebSearchOverride: normalizeOverride(record.supportsWebSearchOverride),
          rating: typeof record.rating === "string" ? record.rating || null : null,
        };
      })
      .filter((item): item is SiteModelFormItem => item !== null);
  }

  return (initialData?.modelNames || []).map((name) => ({
    name,
    supportsToolCallingOverride: null,
    supportsVisionOverride: null,
    supportsTemperatureControlOverride: null,
    supportsReasoningOverride: null,
    reasoningEffortLevelsOverride: null,
    supportsWebSearchOverride: null,
    rating: null,
  }));
}

function overrideToSelectValue(value: boolean | null) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "inherit";
}

function selectValueToOverride(value: string): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function MiniSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className="relative block">
      <span className="ld-filter-label">{label}</span>
      <button
        type="button"
        className="ld-input mt-2 flex w-full items-center justify-between text-left text-sm font-semibold"
        onClick={() => setOpen((c) => !c)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected.label}</span>
        <span className="ml-2 text-[var(--muted)]">⌄</span>
      </button>
      {open && (
        <div
          className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] p-1 shadow-[var(--shadow-soft)]"
          role="listbox"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value || "__empty"}
                type="button"
                className={
                  active
                    ? "flex min-h-9 w-full items-center rounded-md bg-[var(--surface-card)] px-3 text-left text-sm font-semibold text-[var(--ink)]"
                    : "flex min-h-9 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-[var(--body-strong)] hover:bg-[var(--surface-card)]"
                }
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(option.value); setOpen(false); }}
                role="option"
                aria-selected={active}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const capabilityOverrideOptions = [
  { value: "inherit", label: "继承模型默认" },
  { value: "true", label: "本站支持" },
  { value: "false", label: "本站不支持" },
];

function CapabilityOverrideSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <MiniSelect
      label={label}
      value={overrideToSelectValue(value)}
      options={capabilityOverrideOptions}
      onChange={(v) => onChange(selectValueToOverride(v))}
    />
  );
}

function ReasoningEffortOverride({
  value,
  onChange,
}: {
  value: ReasoningEffortLevel[] | null;
  onChange: (value: ReasoningEffortLevel[] | null) => void;
}) {
  const enabled = value !== null;
  const selected = value ?? [];

  function toggle(level: ReasoningEffortLevel) {
    if (!enabled) return;
    if (selected.includes(level)) {
      onChange(selected.filter((item) => item !== level));
    } else {
      onChange([...selected, level]);
    }
  }

  return (
    <div className="rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.58)] p-3">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onChange(event.target.checked ? [] : null)}
          className="mt-1 size-4 accent-[var(--primary)]"
        />
        <span>
          <span className="block text-sm font-semibold text-[var(--ink)]">覆盖推理强度</span>
          <span className="ld-helper mt-1 block">不勾选时继承模型默认；勾选但不选强度表示本站不可调强度。</span>
        </span>
      </label>
      {enabled && (
        <div className="mt-3 flex flex-wrap gap-2">
          {reasoningEffortLevels.map((level) => (
            <button
              key={level}
              type="button"
              className={selected.includes(level) ? "ld-filter-chip ld-filter-chip-active" : "ld-filter-chip"}
              onClick={() => toggle(level)}
              aria-pressed={selected.includes(level)}
            >
              {level}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SiteForm({ initialData, onSubmit, saving, availableModels = [] }: SiteFormProps) {
  const [modelInput, setModelInput] = useState("");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [siteModelItems, setSiteModelItems] = useState<SiteModelFormItem[]>(() => getInitialSiteModels(initialData));
  const modelOptions = filterAvailableSiteModels(
    availableModels,
    modelInput,
    siteModelItems.map((item) => item.name),
  ).slice(0, 12);

  function addModel(modelName = modelInput) {
    const name = modelName.trim();
    if (name && !siteModelItems.some((item) => item.name === name)) {
      setSiteModelItems([
        ...siteModelItems,
        {
          name,
          supportsToolCallingOverride: null,
          supportsVisionOverride: null,
          supportsTemperatureControlOverride: null,
          supportsReasoningOverride: null,
          reasoningEffortLevelsOverride: null,
          supportsWebSearchOverride: null,
          rating: null,
        },
      ]);
    }
    setModelInput("");
    setModelDropdownOpen(false);
  }

  function removeModel(name: string) {
    setSiteModelItems(siteModelItems.filter((item) => item.name !== name));
  }

  function updateModelOverride<K extends keyof Omit<SiteModelFormItem, "name">>(name: string, key: K, value: SiteModelFormItem[K]) {
    setSiteModelItems((current) => current.map((item) => (item.name === name ? { ...item, [key]: value } : item)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const data: Record<string, unknown> = {
      name: form.get("name"),
      url: form.get("url"),
      description: form.get("description") || null,
      adminProfileUrl: form.get("adminProfileUrl") || null,
      discussionUrl: form.get("discussionUrl") || null,
      hasCheckIn: form.get("hasCheckIn") === "on",
      autoCheckIn: form.get("autoCheckIn") === "on",
      checkInUrl: form.get("checkInUrl") || null,
      supportsClaudeCode: form.get("supportsClaudeCode") === "on",
      supportsCodex: form.get("supportsCodex") === "on",
      supportsImmersiveTranslation: form.get("supportsImmersiveTranslation") === "on",
      welfareUrl: form.get("welfareUrl") || null,
      statusUrl: form.get("statusUrl") || null,
      hasRateLimit: form.get("hasRateLimit") === "on",
      rateLimitInfo: form.get("rateLimitInfo") || null,
      hasActivityRequirement: form.get("hasActivityRequirement") === "on",
      activityRequirementInfo: form.get("activityRequirementInfo") || null,
      isActive: form.get("isActive") === "on",
      siteModels: siteModelItems,
    };

    onSubmit(data);
  }

  const d = initialData || {};

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section title="基本信息" description="公开目录卡片中的核心名称、入口和简介。">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="name" label="站点名称" required defaultValue={d.name as string} />
          <TextField name="url" label="站点地址" type="url" required defaultValue={d.url as string} />
        </div>
        <div>
          <label htmlFor="description" className="ld-label">
            描述
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={(d.description as string) || ""}
            className="ld-input mt-2 min-h-24 resize-y"
          />
        </div>
      </Section>

      <Section title="LinuxDo 相关" description="用于追溯站长主页、讨论主贴和社区来源。">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            name="adminProfileUrl"
            label="站长主页"
            type="url"
            defaultValue={d.adminProfileUrl as string}
            placeholder="https://linux.do/u/username"
          />
          <TextField
            name="discussionUrl"
            label="讨论主贴"
            type="url"
            defaultValue={d.discussionUrl as string}
            placeholder="https://linux.do/t/topic/..."
          />
        </div>
      </Section>

      <Section title="签到" description="记录站点是否需要签到，以及是否支持自动签到。">
        <CheckboxGroup
          data={d}
          fields={[
            { name: "hasCheckIn", label: "有签到", description: "公开卡片会显示签到能力。" },
            { name: "autoCheckIn", label: "支持自动签到", description: "用于区分手动和自动签到站点。" },
          ]}
        />
        <TextField name="checkInUrl" label="签到站地址" type="url" defaultValue={d.checkInUrl as string} />
      </Section>

      <Section title="功能支持" description="标注站点可用于哪些 AI 工具或使用场景。">
        <CheckboxGroup
          data={d}
          fields={[
            { name: "supportsClaudeCode", label: "Claude Code" },
            { name: "supportsCodex", label: "Codex" },
            { name: "supportsImmersiveTranslation", label: "沉浸式翻译" },
          ]}
        />
      </Section>

      <Section title="支持的模型" description="搜索并选择已录入模型；也可以输入新模型名称后添加。">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              value={modelInput}
              onChange={(e) => {
                setModelInput(e.target.value);
                setModelDropdownOpen(true);
              }}
              onFocus={() => setModelDropdownOpen(true)}
              onBlur={() => window.setTimeout(() => setModelDropdownOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addModel();
                }
              }}
              placeholder="搜索模型名称、开发者或模型 ID"
              className="ld-input flex-1"
              role="combobox"
              aria-expanded={modelDropdownOpen}
              aria-controls="site-model-options"
              autoComplete="off"
            />
            {modelDropdownOpen && (modelInput.trim() || modelOptions.length > 0) && (
              <div
                id="site-model-options"
                className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] p-1 shadow-[var(--shadow-soft)]"
                role="listbox"
              >
                {modelOptions.length > 0 ? (
                  modelOptions.map((model) => (
                    <button
                      key={model.name}
                      type="button"
                      className="flex min-h-12 w-full flex-col items-start justify-center rounded-md px-3 text-left hover:bg-[var(--surface-card)]"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addModel(model.name)}
                      role="option"
                      aria-selected="false"
                    >
                      <span className="text-sm font-semibold text-[var(--body-strong)]">{model.name}</span>
                      <span className="mt-0.5 text-xs text-[var(--muted)]">
                        {[model.developer, model.modelId].filter(Boolean).join(" / ") || "未填写开发者或模型 ID"}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-[var(--muted)]">没有匹配模型，可直接添加为新模型名称。</p>
                )}
              </div>
            )}
          </div>
          <button type="button" onClick={() => addModel()} className="ld-button-secondary">
            添加
          </button>
        </div>
        {siteModelItems.length > 0 && (
          <div className="grid gap-3">
            {siteModelItems.map((item) => (
              <div key={item.name} className="rounded-lg border border-[var(--hairline)] bg-[rgba(250,249,245,0.64)] p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{item.name}</p>
                    <p className="ld-helper mt-1">按站点覆盖模型能力；未设置时继承模型管理中的默认能力。</p>
                  </div>
                  <button type="button" onClick={() => removeModel(item.name)} className="ld-button-danger min-h-0 px-3 py-2 text-xs">
                    移除
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <CapabilityOverrideSelect
                    label="工具调用"
                    value={item.supportsToolCallingOverride}
                    onChange={(value) => updateModelOverride(item.name, "supportsToolCallingOverride", value)}
                  />
                  <CapabilityOverrideSelect
                    label="视觉"
                    value={item.supportsVisionOverride}
                    onChange={(value) => updateModelOverride(item.name, "supportsVisionOverride", value)}
                  />
                  <CapabilityOverrideSelect
                    label="温度"
                    value={item.supportsTemperatureControlOverride}
                    onChange={(value) => updateModelOverride(item.name, "supportsTemperatureControlOverride", value)}
                  />
                  <CapabilityOverrideSelect
                    label="推理"
                    value={item.supportsReasoningOverride}
                    onChange={(value) => updateModelOverride(item.name, "supportsReasoningOverride", value)}
                  />
                  <CapabilityOverrideSelect
                    label="联网"
                    value={item.supportsWebSearchOverride}
                    onChange={(value) => updateModelOverride(item.name, "supportsWebSearchOverride", value)}
                  />
                  <MiniSelect
                    label="评分"
                    value={item.rating || ""}
                    options={[
                      { value: "", label: "未评分" },
                      { value: "夯", label: "夯" },
                      { value: "顶级", label: "顶级" },
                      { value: "人上人", label: "人上人" },
                      { value: "NPC", label: "NPC" },
                      { value: "拉", label: "拉" },
                    ]}
                    onChange={(v) => updateModelOverride(item.name, "rating", v || null)}
                  />
                </div>
                <div className="mt-3">
                  <ReasoningEffortOverride
                    value={item.reasoningEffortLevelsOverride}
                    onChange={(value) => updateModelOverride(item.name, "reasoningEffortLevelsOverride", value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="附属站点" description="补充福利站、状态监控站等相关入口。">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="welfareUrl" label="福利站" type="url" defaultValue={d.welfareUrl as string} />
          <TextField name="statusUrl" label="状态监控站" type="url" defaultValue={d.statusUrl as string} />
        </div>
      </Section>

      <Section title="限制说明" description="把限速和活跃度规则写在卡片上，减少误用。">
        <CheckboxGroup
          data={d}
          fields={[
            { name: "hasRateLimit", label: "有限速", description: "站点存在频率、额度或并发限制。" },
            { name: "hasActivityRequirement", label: "有活跃度要求", description: "站点对账号活跃度有要求。" },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            name="rateLimitInfo"
            label="限速说明"
            defaultValue={d.rateLimitInfo as string}
            placeholder="如：每分钟 3 次请求"
          />
          <TextField
            name="activityRequirementInfo"
            label="活跃度说明"
            defaultValue={d.activityRequirementInfo as string}
            placeholder="如：30 天不活跃删号"
          />
        </div>
      </Section>

      <Section title="发布状态">
        <CheckboxGroup
          data={{ ...d, isActive: d.isActive !== false }}
          fields={[{ name: "isActive", label: "站点活跃", description: "只有活跃站点会出现在公开目录中。" }]}
        />
      </Section>

      <div className="sticky bottom-4 z-10 rounded-xl border border-[var(--hairline)] bg-[rgba(250,249,245,0.88)] p-3 shadow-[var(--shadow-soft)] backdrop-blur">
        <button type="submit" disabled={saving} className="ld-button-primary w-full">
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
