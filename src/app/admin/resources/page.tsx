import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { parseStoredResourceTags } from "@/lib/resource-payload";

function resourceTypeLabel(type: string) {
  return type === "tool" ? "工具项目" : "LinuxDo 教程";
}

function getPrimaryLink(resource: typeof resources.$inferSelect) {
  return resource.linuxdoUrl || resource.officialUrl || resource.githubUrl || resource.demoUrl;
}

export default async function AdminResourcesPage() {
  await requireAdmin();

  const allResources = await db.select().from(resources).orderBy(desc(resources.updatedAt), desc(resources.id));
  const activeCount = allResources.filter((resource) => resource.isActive !== false).length;
  const toolCount = allResources.filter((resource) => resource.type === "tool").length;
  const tutorialCount = allResources.filter((resource) => resource.type === "tutorial").length;

  return (
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container">
        <header className="flex flex-col justify-between gap-6 border-b border-[var(--hairline)] pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link href="/admin" className="ld-link">
                返回站点管理
              </Link>
              <Link href="/" className="ld-link">
                返回公开目录
              </Link>
            </div>
            <h1 className="ld-display mt-4 text-5xl leading-tight text-[var(--ink)]">资源管理</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              维护好用工具、开源项目、演示站和 LinuxDo 高质量教程帖。
            </p>
          </div>
          <Link href="/admin/resources/new" className="ld-button-primary">
            添加资源
          </Link>
        </header>

        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["全部资源", allResources.length],
            ["公开展示", activeCount],
            ["工具项目", toolCount],
            ["教程帖", tutorialCount],
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
              <h2 className="text-lg font-semibold text-[var(--ink)]">资源资料</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{activeCount} 条资源会出现在首页资源 tab。</p>
            </div>
          </div>

          {allResources.length === 0 ? (
            <div className="p-10 text-center">
              <p className="ld-display text-3xl text-[var(--ink)]">暂无资源</p>
              <p className="mt-3 text-sm text-[var(--muted)]">点击添加资源开始录入工具项目或教程帖。</p>
              <Link href="/admin/resources/new" className="ld-button-primary mt-6">
                添加资源
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ld-table min-w-[920px]">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>类型</th>
                    <th>标签</th>
                    <th>状态</th>
                    <th>主要链接</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allResources.map((resource) => {
                    const tags = parseStoredResourceTags(resource.tags);
                    const primaryLink = getPrimaryLink(resource);

                    return (
                      <tr key={resource.id}>
                        <td>
                          <p className="font-semibold text-[var(--ink)]">{resource.title}</p>
                          <p className="mt-1 max-w-xs truncate text-xs text-[var(--muted-soft)]">
                            {resource.description || resource.recommendation || "未填写简介"}
                          </p>
                        </td>
                        <td>
                          <span className={resource.type === "tool" ? "ld-badge ld-badge-dark" : "ld-badge ld-badge-coral"}>
                            {resourceTypeLabel(resource.type)}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            {tags.length > 0 ? (
                              tags.map((tag) => (
                                <span key={tag} className="ld-badge">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-[var(--muted)]">未标注</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={resource.isActive !== false ? "ld-badge ld-badge-success" : "ld-badge ld-badge-danger"}>
                            {resource.isActive !== false ? "公开" : "隐藏"}
                          </span>
                        </td>
                        <td>
                          {primaryLink ? (
                            <a href={primaryLink} target="_blank" rel="noopener noreferrer" className="ld-link">
                              打开链接
                            </a>
                          ) : (
                            <span className="text-sm text-[var(--muted)]">未填写</span>
                          )}
                        </td>
                        <td>
                          <Link href={`/admin/resources/${resource.id}/edit`} className="ld-link">
                            编辑
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
