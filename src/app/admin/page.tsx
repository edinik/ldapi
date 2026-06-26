import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function AdminPage() {
  await requireAdmin();

  const allSites = await db.query.sites.findMany({
    with: { siteModels: { with: { model: true } } },
    orderBy: [desc(sites.createdAt)],
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">站点管理</h1>
          <div className="space-x-3">
            <Link href="/admin/sites/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              添加站点
            </Link>
            <form action="/api/auth/logout" method="POST" className="inline">
              <button type="submit" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                退出
              </button>
            </form>
          </div>
        </div>

        {allSites.length === 0 ? (
          <p className="text-gray-500 text-center py-12">暂无站点，点击"添加站点"开始录入</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-3">站点名称</th>
                  <th className="text-left px-4 py-3">状态</th>
                  <th className="text-left px-4 py-3">签到</th>
                  <th className="text-left px-4 py-3">模型数</th>
                  <th className="text-left px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allSites.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a href={site.url} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                        {site.name}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${site.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {site.isActive ? "活跃" : "下线"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {site.hasCheckIn ? (site.autoCheckIn ? "自动" : "手动") : "无"}
                    </td>
                    <td className="px-4 py-3">{site.siteModels.length}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/sites/${site.id}/edit`} className="text-blue-600 hover:underline">
                        编辑
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
