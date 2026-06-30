import { db } from "@/db";
import { SiteDirectory, type SiteDirectoryItem } from "@/components/SiteDirectory";
import { ModelOverview } from "@/components/ModelOverview";
import { getHomepageModels, type ModelDisplayItem } from "@/lib/model-display";
import { getSiteModelCapabilityLabels, parseReasoningEffortLevels, resolveSiteModelCapabilities } from "@/lib/site-model-capabilities";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allSites = await db.query.sites.findMany({
    where: (sites, { eq }) => eq(sites.isActive, true),
    with: {
      siteModels: {
        with: { model: true },
      },
    },
    orderBy: (sites, { desc }) => [desc(sites.createdAt)],
  });
  const allModels = await db.query.models.findMany({
    orderBy: (models, { asc }) => [asc(models.developer), asc(models.name)],
  });
  const modelList = allModels.map((model) => ({
    ...model,
    reasoningEffortLevels: parseReasoningEffortLevels(model.reasoningEffortLevels),
  })) as ModelDisplayItem[];

  const siteList: SiteDirectoryItem[] = allSites.map((site) => {
    const modelCapabilities = site.siteModels.map((sm) => {
      const capabilities = resolveSiteModelCapabilities(
        { ...sm.model, reasoningEffortLevels: parseReasoningEffortLevels(sm.model.reasoningEffortLevels) },
        { ...sm, reasoningEffortLevelsOverride: sm.reasoningEffortLevelsOverride == null ? null : parseReasoningEffortLevels(sm.reasoningEffortLevelsOverride) },
      );
      const labels = getSiteModelCapabilityLabels(capabilities);

      return { name: sm.model.name, capabilities: labels };
    });

    return {
      id: site.id,
      name: site.name,
      url: site.url,
      description: site.description,
      adminProfileUrl: site.adminProfileUrl,
      discussionUrl: site.discussionUrl,
      hasCheckIn: site.hasCheckIn,
      autoCheckIn: site.autoCheckIn,
      checkInUrl: site.checkInUrl,
      supportsClaudeCode: site.supportsClaudeCode,
      supportsCodex: site.supportsCodex,
      supportsImmersiveTranslation: site.supportsImmersiveTranslation,
      welfareUrl: site.welfareUrl,
      statusUrl: site.statusUrl,
      hasRateLimit: site.hasRateLimit,
      rateLimitInfo: site.rateLimitInfo,
      hasActivityRequirement: site.hasActivityRequirement,
      activityRequirementInfo: site.activityRequirementInfo,
      models: modelCapabilities.map((model) => model.name),
      modelCapabilities,
    };
  });

  const uniqueModelCount = new Set(siteList.flatMap((site) => site.models)).size;
  const claudeCodeCount = siteList.filter((site) => site.supportsClaudeCode).length;
  const codexCount = siteList.filter((site) => site.supportsCodex).length;
  const checkInCount = siteList.filter((site) => site.hasCheckIn).length;
  const homepageModels = getHomepageModels(modelList);

  return (
    <div className="ld-page">
      <header className="border-b border-[var(--hairline)] bg-[rgba(250,249,245,0.86)] backdrop-blur">
        <div className="ld-container flex h-16 items-center justify-between">
          <Link href="/" className="ld-focus-ring flex items-center gap-3 rounded-md">
            <span className="grid size-8 place-items-center rounded-full bg-[var(--ink)] text-sm font-semibold text-[var(--on-dark)]">
              L
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">LDAPI</p>
              <p className="text-xs text-[var(--muted)]">AI 公益站导航</p>
            </div>
          </Link>
          <Link href="/login" className="ld-button-secondary">
            管理入口
          </Link>
        </div>
      </header>

      <main>
        <section className="ld-container grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="flex flex-col justify-center">
            <span className="ld-badge ld-badge-coral mb-5 w-fit">LinuxDo Community Directory</span>
            <h1 className="ld-display max-w-3xl text-5xl leading-[1.05] text-[var(--ink)] md:text-6xl">
              找到可用、可信、清晰标注的 AI 公益站。
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--body)]">
              汇总 LinuxDo 社区中的 AI 公益站信息，记录模型支持、签到方式、限速说明和活跃要求，减少反复翻帖和试错。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#sites" className="ld-button-primary">
                浏览站点
              </a>
              <Link href="/login" className="ld-button-secondary">
                维护数据
              </Link>
            </div>
          </div>

          <aside className="ld-card-dark overflow-hidden p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-semibold text-[var(--on-dark)]">Directory Snapshot</p>
                <p className="text-xs text-[var(--on-dark-soft)]">实时读取当前公开站点</p>
              </div>
              <span className="rounded-full bg-[var(--accent-teal)] px-2.5 py-1 text-xs font-semibold text-[var(--surface-dark)]">
                Live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-6">
              {[
                ["公益站点", siteList.length],
                ["模型条目", uniqueModelCount],
                ["Claude Code", claudeCodeCount],
                ["Codex", codexCount],
              ].map(([label, value]) => (
                <div key={label} className="ld-stat-card">
                  <p className="ld-stat-value">{value}</p>
                  <p className="ld-stat-label">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-[var(--surface-dark-soft)] p-4 font-mono text-sm leading-7 text-[var(--on-dark-soft)]">
              <p>
                <span className="text-[var(--accent-teal)]">check_in</span> = {checkInCount} sites
              </p>
              <p>
                <span className="text-[var(--accent-amber)]">source</span> = linux.do community
              </p>
              <p>
                <span className="text-[var(--primary)]">status</span> = curated manually
              </p>
            </div>
          </aside>
        </section>

        <section className="border-y border-[var(--hairline)] bg-[var(--surface-soft)] py-8">
          <div className="ld-container grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">能力标注</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Claude Code、Codex、沉浸式翻译等支持情况集中展示。</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">使用约束</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">限速、活跃度要求和签到入口不会藏在讨论帖深处。</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">社区维护</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">后台管理保留简单 CRUD，方便持续补充和纠错。</p>
            </div>
          </div>
        </section>

        <section id="sites" className="ld-container py-14 lg:py-20">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="ld-badge mb-4 w-fit">站点目录</p>
              <h2 className="ld-section-title">当前可用站点</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
              每张卡片展示一个站点的主要入口、功能标签、支持模型和相关 LinuxDo 链接。
            </p>
          </div>

          <SiteDirectory sites={siteList} />
        </section>

        {homepageModels.length > 0 && (
          <section className="border-t border-[var(--hairline)] bg-[var(--surface-soft)] py-14 lg:py-20">
            <div className="ld-container">
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="ld-badge mb-4 w-fit">模型速览</p>
                  <h2 className="ld-section-title">已收录模型</h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
                  展示后台标记为主页展示的模型资料，方便快速比较能力、模态、上下文和价格。
                </p>
              </div>
              <ModelOverview models={homepageModels} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
