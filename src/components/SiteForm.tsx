"use client";

import { useState } from "react";

interface SiteFormProps {
  initialData?: Record<string, unknown> & { modelNames?: string[] };
  onSubmit: (data: Record<string, unknown>) => void;
  saving: boolean;
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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
      {/* 基本信息 */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">基本信息</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">站点名称 *</label>
            <input name="name" required defaultValue={(d.name as string) || ""} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">站点地址 *</label>
            <input name="url" type="url" required defaultValue={(d.url as string) || ""} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">描述</label>
          <textarea name="description" rows={2} defaultValue={(d.description as string) || ""} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
        </div>
      </fieldset>

      {/* LinuxDo 相关 */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">LinuxDo 相关</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">站长主页</label>
            <input name="adminProfileUrl" type="url" defaultValue={(d.adminProfileUrl as string) || ""} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" placeholder="https://linux.do/u/username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">讨论主贴</label>
            <input name="discussionUrl" type="url" defaultValue={(d.discussionUrl as string) || ""} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" placeholder="https://linux.do/t/topic/..." />
          </div>
        </div>
      </fieldset>

      {/* 签到 */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">签到</legend>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input name="hasCheckIn" type="checkbox" defaultChecked={!!d.hasCheckIn} />
            <span className="text-sm">有签到</span>
          </label>
          <label className="flex items-center gap-2">
            <input name="autoCheckIn" type="checkbox" defaultChecked={!!d.autoCheckIn} />
            <span className="text-sm">支持自动签到</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">签到站地址</label>
          <input name="checkInUrl" type="url" defaultValue={(d.checkInUrl as string) || ""} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
        </div>
      </fieldset>

      {/* 功能支持 */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">功能支持</legend>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input name="supportsClaudeCode" type="checkbox" defaultChecked={!!d.supportsClaudeCode} />
            <span className="text-sm">Claude Code</span>
          </label>
          <label className="flex items-center gap-2">
            <input name="supportsCodex" type="checkbox" defaultChecked={!!d.supportsCodex} />
            <span className="text-sm">Codex</span>
          </label>
          <label className="flex items-center gap-2">
            <input name="supportsImmersiveTranslation" type="checkbox" defaultChecked={!!d.supportsImmersiveTranslation} />
            <span className="text-sm">沉浸式翻译</span>
          </label>
        </div>
      </fieldset>

      {/* 模型 */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">支持的模型</legend>
        <div className="flex gap-2">
          <input
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addModel(); } }}
            placeholder="输入模型名称，回车添加"
            className="flex-1 rounded border border-gray-300 px-3 py-2"
          />
          <button type="button" onClick={addModel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            添加
          </button>
        </div>
        {modelNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {modelNames.map((name) => (
              <span key={name} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {name}
                <button type="button" onClick={() => removeModel(name)} className="text-blue-600 hover:text-blue-900">&times;</button>
              </span>
            ))}
          </div>
        )}
      </fieldset>

      {/* 附属站点 */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">附属站点</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">福利站</label>
            <input name="welfareUrl" type="url" defaultValue={(d.welfareUrl as string) || ""} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">状态监控站</label>
            <input name="statusUrl" type="url" defaultValue={(d.statusUrl as string) || ""} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" />
          </div>
        </div>
      </fieldset>

      {/* 限速 */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">限速</legend>
        <label className="flex items-center gap-2">
          <input name="hasRateLimit" type="checkbox" defaultChecked={!!d.hasRateLimit} />
          <span className="text-sm">有限速</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-gray-700">限速说明</label>
          <input name="rateLimitInfo" defaultValue={(d.rateLimitInfo as string) || ""} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" placeholder="如：每分钟3次请求" />
        </div>
      </fieldset>

      {/* 活跃度要求 */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">活跃度要求</legend>
        <label className="flex items-center gap-2">
          <input name="hasActivityRequirement" type="checkbox" defaultChecked={!!d.hasActivityRequirement} />
          <span className="text-sm">有活跃度要求</span>
        </label>
        <div>
          <label className="block text-sm font-medium text-gray-700">活跃度说明</label>
          <input name="activityRequirementInfo" defaultValue={(d.activityRequirementInfo as string) || ""} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" placeholder="如：30天不活跃删号" />
        </div>
      </fieldset>

      {/* 状态 */}
      <fieldset>
        <label className="flex items-center gap-2">
          <input name="isActive" type="checkbox" defaultChecked={d.isActive !== false} />
          <span className="text-sm font-medium">站点活跃</span>
        </label>
      </fieldset>

      <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {saving ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
