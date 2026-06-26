"use client";

import { useState } from "react";

interface SiteFormProps {
  initialData?: Record<string, unknown> & { modelNames?: string[] };
  onSubmit: (data: Record<string, unknown>) => void;
  saving: boolean;
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

export default function SiteForm({ initialData, onSubmit, saving }: SiteFormProps) {
  const [modelInput, setModelInput] = useState("");
  const [modelNames, setModelNames] = useState<string[]>(initialData?.modelNames || []);

  function addModel() {
    const name = modelInput.trim();
    if (name && !modelNames.includes(name)) {
      setModelNames([...modelNames, name]);
    }
    setModelInput("");
  }

  function removeModel(name: string) {
    setModelNames(modelNames.filter((m) => m !== name));
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
      modelNames,
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

      <Section title="支持的模型" description="输入模型名称后按回车或点击添加，保存时会同步模型列表。">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addModel();
              }
            }}
            placeholder="输入模型名称，回车添加"
            className="ld-input flex-1"
          />
          <button type="button" onClick={addModel} className="ld-button-secondary">
            添加
          </button>
        </div>
        {modelNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {modelNames.map((name) => (
              <span key={name} className="ld-badge bg-[rgba(250,249,245,0.72)]">
                {name}
                <button
                  type="button"
                  onClick={() => removeModel(name)}
                  className="ml-2 rounded-full text-[var(--primary-active)] hover:text-[var(--error)]"
                  aria-label={`移除模型 ${name}`}
                >
                  ×
                </button>
              </span>
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
