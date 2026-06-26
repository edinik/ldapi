import { db } from "@/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const capabilityLabels = [
  { key: "hasCheckIn", label: "签到", tone: "success" },
  { key: "autoCheckIn", label: "自动签到", tone: "success" },
  { key: "supportsClaudeCode", label: "Claude Code", tone: "dark" },
  { key: "supportsCodex", label: "Codex", tone: "dark" },
  { key: "supportsImmersiveTranslation", label: "沉浸式翻译", tone: "warning" },
  { key: "hasRateLimit", label: "限速", tone: "warning" },
  { key: "hasActivityRequirement", label: "活跃要求", tone: "danger" },
] as const;

function badgeClass(tone: string) {
  if (tone === "success") return "ld-badge ld-badge-success";
  if (tone === "warning") return "ld-badge ld-badge-warning";
  if (tone === "danger") return "ld-badge ld-badge-danger";
  if (tone === "dark") return "ld-badge ld-badge-dark";
  return "ld-badge";
}

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

  const siteList = allSites.map((site) => ({
    ...site,
    models: site.siteModels.map((sm) => sm.model.name),
  }));

  const uniqueModelCount = new Set(siteList.flatMap((site) => site.models)).size;
  const claudeCodeCount = siteList.filter((site) => site.supportsClaudeCode).length;
  const codexCount = siteList.filter((site) => site.supportsCodex).length;
  const checkInCount = siteList.filter((site) => site.hasCheckIn).length;

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
                <div key={label} className="rounded-lg bg-[var(--surface-dark-elevated)] p-4">
                  <p className="ld-display text-3xl text-[var(--on-dark)]">{value}</p>
                  <p className="mt-1 text-xs text-[var(--on-dark-soft)]">{label}</p>
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

          {siteList.length === 0 ? (
            <div className="ld-card-light p-10 text-center">
              <p className="ld-display text-3xl text-[var(--ink)]">暂无站点数据</p>
              <p className="mt-3 text-[var(--muted)]">登录后台后可以添加第一条公益站记录。</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {siteList.map((site) => {
                const links: { label: string; url: string }[] = [
                  { label: "站长主页", url: site.adminProfileUrl || "" },
                  { label: "讨论帖", url: site.discussionUrl || "" },
                  { label: "签到站", url: site.checkInUrl || "" },
                  { label: "福利站", url: site.welfareUrl || "" },
                  { label: "状态监控", url: site.statusUrl || "" },
                ].filter((link) => link.url.length > 0);

                return (
                  <article key={site.id} className="ld-card flex min-h-full flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-[var(--ink)]">
                          <a href={site.url} target="_blank" rel="noopener noreferrer" className="ld-link">
                            {site.name}
                          </a>
                        </h3>
                        <p className="mt-1 text-xs text-[var(--muted-soft)] break-all">{site.url}</p>
                      </div>
                      <a href={site.url} target="_blank" rel="noopener noreferrer" className="ld-button-secondary shrink-0 px-3 py-2 text-xs">
                        访问
                      </a>
                    </div>

                    {site.description && (
                      <p className="mt-4 text-sm leading-6 text-[var(--body)]">{site.description}</p>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      {capabilityLabels.map(({ key, label, tone }) => {
                        if (!site[key]) return null;
                        return (
                          <span key={key} className={badgeClass(tone)}>
                            {label}
                          </span>
                        );
                      })}
                    </div>

                    {site.models.length > 0 && (
                      <div className="mt-5">
                        <p className="text-xs font-semibold text-[var(--muted)]">支持模型</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {site.models.map((model) => (
                            <span key={model} className="ld-badge bg-[rgba(250,249,245,0.7)]">
                              {model}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(site.rateLimitInfo || site.activityRequirementInfo) && (
                      <div className="mt-5 space-y-2 rounded-lg bg-[rgba(250,249,245,0.58)] p-3 text-xs leading-5 text-[var(--muted)]">
                        {site.rateLimitInfo && <p>限速：{site.rateLimitInfo}</p>}
                        {site.activityRequirementInfo && <p>活跃要求：{site.activityRequirementInfo}</p>}
                      </div>
                    )}

                    {links.length > 0 && (
                      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--hairline-soft)] pt-5 text-sm">
                        {links.map((link) => (
                          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="ld-link">
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
