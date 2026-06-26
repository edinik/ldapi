import { db } from "@/db";
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

  const siteList = allSites.map((site) => ({
    ...site,
    models: site.siteModels.map((sm) => sm.model.name),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">AI 公益站导航</h1>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
            管理
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {siteList.length === 0 ? (
          <p className="text-center text-gray-500 py-12">暂无站点数据</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {siteList.map((site) => (
              <div key={site.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-semibold text-gray-900">
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                      {site.name}
                    </a>
                  </h2>
                  {!site.isActive && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">已下线</span>
                  )}
                </div>

                {site.description && (
                  <p className="text-sm text-gray-600 mb-3">{site.description}</p>
                )}

                {/* 标签区 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {site.hasCheckIn && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">签到</span>
                  )}
                  {site.autoCheckIn && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">自动签到</span>
                  )}
                  {site.supportsClaudeCode && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Claude Code</span>
                  )}
                  {site.supportsCodex && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Codex</span>
                  )}
                  {site.supportsImmersiveTranslation && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">沉浸式翻译</span>
                  )}
                  {site.hasRateLimit && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">限速</span>
                  )}
                  {site.hasActivityRequirement && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">活跃要求</span>
                  )}
                </div>

                {/* 模型列表 */}
                {site.models.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">支持模型</p>
                    <div className="flex flex-wrap gap-1">
                      {site.models.map((m) => (
                        <span key={m} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 附加信息 */}
                {(site.rateLimitInfo || site.activityRequirementInfo) && (
                  <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                    {site.rateLimitInfo && <p>限速: {site.rateLimitInfo}</p>}
                    {site.activityRequirementInfo && <p>活跃要求: {site.activityRequirementInfo}</p>}
                  </div>
                )}

                {/* 链接区 */}
                <div className="flex flex-wrap gap-2 text-xs pt-2 border-t border-gray-100">
                  {site.adminProfileUrl && (
                    <a href={site.adminProfileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      站长主页
                    </a>
                  )}
                  {site.discussionUrl && (
                    <a href={site.discussionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      讨论帖
                    </a>
                  )}
                  {site.checkInUrl && (
                    <a href={site.checkInUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      签到站
                    </a>
                  )}
                  {site.welfareUrl && (
                    <a href={site.welfareUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      福利站
                    </a>
                  )}
                  {site.statusUrl && (
                    <a href={site.statusUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      状态监控
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
