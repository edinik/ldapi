"use client";

import { useState } from "react";
import { filterAvailableSiteModels, type AvailableSiteModelOption } from "@/lib/site-model-options";
import {
  parseReasoningEffortLevels,
  reasoningEffortLevels,
  type ReasoningEffortLevel,
} from "@/lib/site-model-capabilities";
import {
  normalizeStoredSiteModelPricing,
  pricingModes,
  usagePriceSources,
  type PricingMode,
  type SiteModelPricingSettings,
  type UsagePriceSource,
} from "@/lib/site-model-pricing";
import { buildSiteFormPayload } from "@/lib/admin/forms/site-form-payload";
import { FormSection as Section } from "@/components/forms/FormSection";
import { FormTextField as TextField } from "@/components/forms/FormTextField";
import { FormCheckboxGroup as CheckboxGroup } from "@/components/forms/FormCheckboxGroup";
import { FormSubmitBar } from "@/components/forms/FormSubmitBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type SiteModelFormItem = SiteModelPricingSettings & {
  name: string;
  supportsToolCallingOverride: boolean | null;
  supportsVisionOverride: boolean | null;
  supportsTemperatureControlOverride: boolean | null;
  supportsReasoningOverride: boolean | null;
  reasoningEffortLevelsOverride: ReasoningEffortLevel[] | null;
  supportsWebSearchOverride: boolean | null;
  rating: string | null;
};

interface SiteFormProps {
  initialData?: Record<string, unknown> & { modelNames?: string[]; siteModels?: unknown[] };
  onSubmit: (data: Record<string, unknown>) => void;
  saving: boolean;
  availableModels?: AvailableSiteModelOption[];
}

function normalizeOverride(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  return null;
}

function createSiteModelFormItem(name: string): SiteModelFormItem {
  return {
    name,
    supportsToolCallingOverride: null,
    supportsVisionOverride: null,
    supportsTemperatureControlOverride: null,
    supportsReasoningOverride: null,
    reasoningEffortLevelsOverride: null,
    supportsWebSearchOverride: null,
    rating: null,
    ...normalizeStoredSiteModelPricing({}),
  };
}

function getInitialSiteModels(initialData?: SiteFormProps["initialData"]): SiteModelFormItem[] {
  if (Array.isArray(initialData?.siteModels)) {
    return initialData.siteModels
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const model = record.model as Record<string, unknown> | undefined;
        const name =
          typeof model?.name === "string" ? model.name : typeof record.name === "string" ? record.name : "";
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
          ...normalizeStoredSiteModelPricing({
            pricingMode: typeof record.pricingMode === "string" ? (record.pricingMode as PricingMode) : undefined,
            usagePriceSource:
              typeof record.usagePriceSource === "string"
                ? (record.usagePriceSource as UsagePriceSource)
                : undefined,
            priceMultiplier: typeof record.priceMultiplier === "number" ? record.priceMultiplier : undefined,
            inputCostPerMTokensOverride:
              typeof record.inputCostPerMTokensOverride === "number" ? record.inputCostPerMTokensOverride : null,
            outputCostPerMTokensOverride:
              typeof record.outputCostPerMTokensOverride === "number" ? record.outputCostPerMTokensOverride : null,
            cacheReadCostPerMTokensOverride:
              typeof record.cacheReadCostPerMTokensOverride === "number"
                ? record.cacheReadCostPerMTokensOverride
                : null,
            cacheWriteCostPerMTokensOverride:
              typeof record.cacheWriteCostPerMTokensOverride === "number"
                ? record.cacheWriteCostPerMTokensOverride
                : null,
            perRequestCost: typeof record.perRequestCost === "number" ? record.perRequestCost : null,
            pricingNotes: typeof record.pricingNotes === "string" ? record.pricingNotes : null,
          }),
        };
      })
      .filter((item): item is SiteModelFormItem => item !== null);
  }

  return (initialData?.modelNames || []).map(createSiteModelFormItem);
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
  const selectValue = value || "none";
  return (
    <div className="block space-y-2">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <Select
        value={selectValue}
        onValueChange={(next) => onChange(next === "none" ? "" : (next ?? ""))}
      >
        <SelectTrigger className="w-full text-sm font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value || "none"} value={option.value || "none"}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <Input
        type="number"
        step="any"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === "" ? null : Number(next));
        }}
      />
    </label>
  );
}

const capabilityOverrideOptions = [
  { value: "inherit", label: "继承模型默认" },
  { value: "true", label: "本站支持" },
  { value: "false", label: "本站不支持" },
];

const pricingModeOptions = pricingModes.map((mode) => {
  const labels: Record<PricingMode, string> = {
    inherit: "继承模型默认价",
    usage: "按量计费",
    per_request: "按次计费",
    free: "免费",
    custom: "自定义说明",
  };

  return { value: mode, label: labels[mode] };
});

const usagePriceSourceOptions = usagePriceSources.map((source) => {
  const labels: Record<UsagePriceSource, string> = {
    model_default: "使用模型默认价格",
    manual: "手动填写价格",
  };

  return { value: source, label: labels[source] };
});

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

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <label className="flex items-start gap-3">
        <Checkbox checked={enabled} onCheckedChange={(checked) => onChange(checked === true ? [] : null)} />
        <span>
          <span className="block text-sm font-semibold text-foreground">覆盖推理强度</span>
          <span className="mt-1 block text-sm text-muted-foreground">
            不勾选时继承模型默认；勾选但不选强度表示本站不可调强度。
          </span>
        </span>
      </label>
      {enabled && (
        <ToggleGroup
          multiple
          value={selected}
          onValueChange={(values) => onChange(values as ReasoningEffortLevel[])}
          variant="outline"
          spacing={2}
          className="mt-3 flex flex-wrap"
        >
          {reasoningEffortLevels.map((level) => (
            <ToggleGroupItem key={level} value={level} className="rounded-full px-3">
              {level}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </div>
  );
}

function PricingEditor({
  item,
  onChange,
}: {
  item: SiteModelFormItem;
  onChange: <K extends keyof Omit<SiteModelFormItem, "name">>(key: K, value: SiteModelFormItem[K]) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-sm font-semibold text-foreground">价格</p>
      <p className="mt-1 text-sm text-muted-foreground">公开目录会显示最终输入/输出价或每次价格。</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MiniSelect
          label="计费模式"
          value={item.pricingMode}
          options={pricingModeOptions}
          onChange={(value) => onChange("pricingMode", value as PricingMode)}
        />
        {item.pricingMode === "usage" && (
          <>
            <MiniSelect
              label="价格来源"
              value={item.usagePriceSource}
              options={usagePriceSourceOptions}
              onChange={(value) => onChange("usagePriceSource", value as UsagePriceSource)}
            />
            <NumberInput
              label="倍率"
              value={item.priceMultiplier}
              placeholder="1"
              onChange={(value) => onChange("priceMultiplier", value ?? 1)}
            />
          </>
        )}
        {item.pricingMode === "per_request" && (
          <NumberInput
            label="每次价格"
            value={item.perRequestCost}
            placeholder="0.02"
            onChange={(value) => onChange("perRequestCost", value)}
          />
        )}
      </div>

      {item.pricingMode === "usage" && item.usagePriceSource === "manual" && (
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <NumberInput
            label="输入 $/M tokens"
            value={item.inputCostPerMTokensOverride}
            onChange={(value) => onChange("inputCostPerMTokensOverride", value)}
          />
          <NumberInput
            label="输出 $/M tokens"
            value={item.outputCostPerMTokensOverride}
            onChange={(value) => onChange("outputCostPerMTokensOverride", value)}
          />
          <NumberInput
            label="缓存读 $/M tokens"
            value={item.cacheReadCostPerMTokensOverride}
            onChange={(value) => onChange("cacheReadCostPerMTokensOverride", value)}
          />
          <NumberInput
            label="缓存写 $/M tokens"
            value={item.cacheWriteCostPerMTokensOverride}
            onChange={(value) => onChange("cacheWriteCostPerMTokensOverride", value)}
          />
        </div>
      )}

      {item.pricingMode === "custom" && (
        <label className="mt-3 block space-y-2">
          <span className="text-xs font-semibold text-foreground">价格说明</span>
          <Textarea
            value={item.pricingNotes ?? ""}
            rows={3}
            onChange={(event) => onChange("pricingNotes", event.target.value || null)}
            className="min-h-20"
          />
        </label>
      )}
    </div>
  );
}

export default function SiteForm({ initialData, onSubmit, saving, availableModels = [] }: SiteFormProps) {
  const [modelInput, setModelInput] = useState("");
  const [siteModelItems, setSiteModelItems] = useState<SiteModelFormItem[]>(() => getInitialSiteModels(initialData));
  const modelOptions = filterAvailableSiteModels(
    availableModels,
    modelInput,
    siteModelItems.map((item) => item.name),
  ).slice(0, 12);

  function addModel(modelName = modelInput) {
    const name = modelName.trim();
    if (name && !siteModelItems.some((item) => item.name === name)) {
      setSiteModelItems([...siteModelItems, createSiteModelFormItem(name)]);
    }
    setModelInput("");
  }

  function removeModel(name: string) {
    setSiteModelItems(siteModelItems.filter((item) => item.name !== name));
  }

  function updateModelOverride<K extends keyof Omit<SiteModelFormItem, "name">>(
    name: string,
    key: K,
    value: SiteModelFormItem[K],
  ) {
    setSiteModelItems((current) => current.map((item) => (item.name === name ? { ...item, [key]: value } : item)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    onSubmit(buildSiteFormPayload(form, siteModelItems));
  }

  const d = initialData || {};

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section title="基本信息" description="公开目录卡片中的核心名称、入口和简介。">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField name="name" label="站点名称" required defaultValue={d.name as string} />
          <TextField name="url" label="站点地址" type="url" required defaultValue={d.url as string} />
        </div>
        <Field>
          <FieldLabel htmlFor="description">描述</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={(d.description as string) || ""}
            className="min-h-24"
          />
        </Field>
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
          columnsClassName="md:grid-cols-2"
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
          columnsClassName="md:grid-cols-2"
          fields={[
            { name: "supportsClaudeCode", label: "Claude Code" },
            { name: "supportsCodex", label: "Codex" },
            { name: "supportsImmersiveTranslation", label: "沉浸式翻译" },
          ]}
        />
      </Section>

      <Section title="支持的模型" description="搜索并选择已录入模型；也可以输入新模型名称后添加。">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Combobox<AvailableSiteModelOption>
            items={modelOptions}
            filter={null}
            inputValue={modelInput}
            itemToStringLabel={(model) => model.name}
            onInputValueChange={(next, { reason }) => {
              if (reason !== "item-press") setModelInput(next);
            }}
            onValueChange={(next) => {
              if (next) addModel(next.name);
            }}
          >
            <ComboboxInput
              placeholder="搜索模型名称、开发者或模型 ID"
              autoComplete="off"
              className="flex-1"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.currentTarget.getAttribute("aria-activedescendant")) {
                  event.preventDefault();
                  addModel();
                }
              }}
            />
            <ComboboxContent>
              <ComboboxEmpty>没有匹配模型，可直接添加为新模型名称。</ComboboxEmpty>
              <ComboboxList>
                {(model: AvailableSiteModelOption) => (
                  <ComboboxItem key={model.name} value={model}>
                    <span className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-foreground">{model.name}</span>
                      <span className="mt-0.5 text-xs text-muted-foreground">
                        {[model.developer, model.modelId].filter(Boolean).join(" / ") || "未填写开发者或模型 ID"}
                      </span>
                    </span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <Button type="button" variant="outline" onClick={() => addModel()}>
            添加
          </Button>
        </div>
        {siteModelItems.length > 0 && (
          <div className="grid gap-3">
            {siteModelItems.map((item) => (
              <div key={item.name} className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      按站点覆盖模型能力；未设置时继承模型管理中的默认能力。
                    </p>
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeModel(item.name)}>
                    移除
                  </Button>
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
                <div className="mt-3">
                  <PricingEditor item={item} onChange={(key, value) => updateModelOverride(item.name, key, value)} />
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
          columnsClassName="md:grid-cols-2"
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
          columnsClassName="md:grid-cols-2"
          fields={[{ name: "isActive", label: "站点活跃", description: "只有活跃站点会出现在公开目录中。" }]}
        />
      </Section>

      <FormSubmitBar saving={saving} idleLabel="保存" />
    </form>
  );
}
