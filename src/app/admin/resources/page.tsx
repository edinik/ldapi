import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
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
import { parseStoredResourceTags } from "@/lib/resource-payload";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <main className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-[min(100%-2rem,1200px)]">
        <header className="flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link href="/admin" className="font-semibold text-primary underline-offset-4 hover:underline">
                返回站点管理
              </Link>
              <Link href="/" className="font-semibold text-primary underline-offset-4 hover:underline">
                返回公开目录
              </Link>
            </div>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">资源管理</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              维护好用工具、开源项目、演示站和 LinuxDo 高质量教程帖。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ThemeToggle />
            <Button render={<Link href="/admin/resources/new" />}>添加资源</Button>
          </div>
        </header>

        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["全部资源", allResources.length],
            ["公开展示", activeCount],
            ["工具项目", toolCount],
            ["教程帖", tutorialCount],
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
            <CardTitle>资源资料</CardTitle>
            <CardDescription>{activeCount} 条资源会出现在首页资源 tab。</CardDescription>
          </CardHeader>

          {allResources.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyTitle className="text-3xl font-semibold tracking-tight">暂无资源</EmptyTitle>
                <EmptyDescription>点击添加资源开始录入工具项目或教程帖。</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href="/admin/resources/new" />}>添加资源</Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="min-w-0">
              <Table className="min-w-[920px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>标签</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>主要链接</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allResources.map((resource) => {
                    const tags = parseStoredResourceTags(resource.tags);
                    const primaryLink = getPrimaryLink(resource);

                    return (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <p className="font-semibold text-foreground">{resource.title}</p>
                          <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                            {resource.description || resource.recommendation || "未填写简介"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={resource.type === "tool" ? "default" : "secondary"}>
                            {resourceTypeLabel(resource.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {tags.length > 0 ? (
                              tags.map((tag) => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">未标注</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={resource.isActive !== false ? "secondary" : "destructive"}>
                            {resource.isActive !== false ? "公开" : "隐藏"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {primaryLink ? (
                            <a
                              href={primaryLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-primary underline-offset-4 hover:underline"
                            >
                              打开链接
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">未填写</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/resources/${resource.id}/edit`}
                            className="font-semibold text-primary underline-offset-4 hover:underline"
                          >
                            编辑
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
