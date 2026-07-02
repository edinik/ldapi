import { db } from "@/db";
import { sites } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function AdminPage() {
  await requireAdmin();

  const allSites = await db.query.sites.findMany({
    with: { siteModels: { with: { model: true } } },
    orderBy: [desc(sites.createdAt)],
  });

  const activeCount = allSites.filter((site) => site.isActive).length;
  const inactiveCount = allSites.length - activeCount;
  const checkInCount = allSites.filter((site) => site.hasCheckIn).length;
  const modelCount = allSites.reduce((count, site) => count + site.siteModels.length, 0);

  return (
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container">
        <header className="flex flex-col justify-between gap-6 border-b border-[var(--hairline)] pb-8 lg:flex-row lg:items-end">
          <div>
            <Link href="/" className="ld-link text-sm">
              返回公开目录
            </Link>
            <h1 className="ld-display mt-4 text-5xl leading-tight text-[var(--ink)]">站点管理</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              管理 LinuxDo AI 公益站记录，维护入口、模型、签到和限制说明。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/resources" className="ld-button-secondary">
              资源管理
            </Link>
            <Link href="/admin/models" className="ld-button-secondary">
              模型管理
            </Link>
            <Link href="/admin/security" className="ld-button-secondary">
              安全设置
            </Link>
            <Link href="/admin/sites/new" className="ld-button-primary">
              添加站点
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="ld-button-secondary">
                退出
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["全部站点", allSites.length],
            ["活跃站点", activeCount],
            ["下线站点", inactiveCount],
            ["模型关联", modelCount],
          ].map(([label, value]) => (
            <div key={label} className="ld-card-light p-5">
              <p className="ld-display text-3xl text-[var(--ink)]">{value}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
            </div>
          ))}
        </section>

        <section className="ld-card-light overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-[var(--hairline)] p-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">目录数据</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{checkInCount} 个站点记录了签到能力。</p>
            </div>
          </div>

          {allSites.length === 0 ? (
            <div className="p-10 text-center">
              <p className="ld-display text-3xl text-[var(--ink)]">暂无站点</p>
              <p className="mt-3 text-sm text-[var(--muted)]">点击添加站点开始录入第一条记录。</p>
              <Link href="/admin/sites/new" className="ld-button-primary mt-6">
                添加站点
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ld-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>站点名称</th>
                    <th>状态</th>
                    <th>签到</th>
                    <th>模型数</th>
                    <th>能力</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allSites.map((site) => (
                    <tr key={site.id}>
                      <td>
                        <a href={site.url} target="_blank" rel="noopener noreferrer" className="ld-link">
                          {site.name}
                        </a>
                        <p className="mt-1 max-w-xs truncate text-xs text-[var(--muted-soft)]">{site.url}</p>
                      </td>
                      <td>
                        <span className={site.isActive ? "ld-badge ld-badge-success" : "ld-badge ld-badge-danger"}>
                          {site.isActive ? "活跃" : "下线"}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-[var(--body)]">
                          {site.hasCheckIn ? (site.autoCheckIn ? "自动" : "手动") : "无"}
                        </span>
                      </td>
                      <td>{site.siteModels.length}</td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {site.supportsClaudeCode && <span className="ld-badge ld-badge-dark">Claude Code</span>}
                          {site.supportsCodex && <span className="ld-badge ld-badge-dark">Codex</span>}
                          {site.hasRateLimit && <span className="ld-badge ld-badge-warning">限速</span>}
                        </div>
                      </td>
                      <td>
                        <Link href={`/admin/sites/${site.id}/edit`} className="ld-link">
                          编辑
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
