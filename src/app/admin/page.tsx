import { db } from "@/db";
import { sites } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/session";
import { desc } from "drizzle-orm";
import { DatabaseBackup } from "lucide-react";
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
    <main className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-[min(100%-2rem,1200px)]">
        <header className="flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-end">
          <div>
            <Link href="/" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              返回公开目录
            </Link>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">站点管理</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              管理 LinuxDo AI 公益站记录，维护入口、模型、签到和限制说明。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" render={<Link href="/admin/resources" />}>
              资源管理
            </Button>
            <Button variant="outline" render={<Link href="/admin/models" />}>
              模型管理
            </Button>
            <Button variant="outline" render={<Link href="/admin/security" />}>
              安全设置
            </Button>
            <Button variant="outline" render={<Link href="/admin/backup" />}>
              <DatabaseBackup data-icon="inline-start" />
              数据备份
            </Button>
            <Button render={<Link href="/admin/sites/new" />}>添加站点</Button>
            <form action="/api/auth/logout" method="POST">
              <Button type="submit" variant="outline">
                退出
              </Button>
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
            <Card key={label}>
              <CardContent className="p-5">
                <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="overflow-hidden py-0">
          <CardHeader className="border-b">
            <CardTitle>目录数据</CardTitle>
            <CardDescription>{checkInCount} 个站点记录了签到能力。</CardDescription>
          </CardHeader>

          {allSites.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyTitle className="text-3xl font-semibold tracking-tight">暂无站点</EmptyTitle>
                <EmptyDescription>点击添加站点开始录入第一条记录。</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href="/admin/sites/new" />}>添加站点</Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="min-w-0">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>站点名称</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>签到</TableHead>
                    <TableHead>模型数</TableHead>
                    <TableHead>能力</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          {site.name}
                        </a>
                        <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">{site.url}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={site.isActive ? "secondary" : "destructive"}>
                          {site.isActive ? "活跃" : "下线"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {site.hasCheckIn ? (site.autoCheckIn ? "自动" : "手动") : "无"}
                        </span>
                      </TableCell>
                      <TableCell>{site.siteModels.length}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {site.supportsClaudeCode && <Badge>Claude Code</Badge>}
                          {site.supportsCodex && <Badge>Codex</Badge>}
                          {site.hasRateLimit && <Badge variant="outline">限速</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/sites/${site.id}/edit`}
                          className="font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          编辑
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
