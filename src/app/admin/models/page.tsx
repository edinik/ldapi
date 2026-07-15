import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { models } from "@/db/schema";
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
import { formatCost, formatTokenLimit, getCapabilityLabels, type ModelDisplayItem } from "@/lib/model-display";
import { parseReasoningEffortLevels } from "@/lib/site-model-capabilities";

export default async function AdminModelsPage() {
  await requireAdmin();

  const allModels = await db.select().from(models).orderBy(desc(models.updatedAt), desc(models.id));
  const activeCount = allModels.filter((model) => model.isActive !== false).length;
  const homeCount = allModels.filter((model) => model.isActive !== false && model.showOnHome).length;
  const developerCount = new Set(allModels.map((model) => model.developer).filter(Boolean)).size;

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
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">模型管理</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              维护模型能力、模态、价格、限制和主页展示状态。站点仍可按模型名称关联这些记录。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" render={<Link href="/admin/models/import" />}>
              导入模型
            </Button>
            <Button render={<Link href="/admin/models/new" />}>添加模型</Button>
          </div>
        </header>

        <section className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["全部模型", allModels.length],
            ["启用模型", activeCount],
            ["主页展示", homeCount],
            ["开发者", developerCount],
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
            <CardTitle>模型资料</CardTitle>
            <CardDescription>{homeCount} 个启用模型会出现在主页速览。</CardDescription>
          </CardHeader>

          {allModels.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyTitle className="text-3xl font-semibold tracking-tight">暂无模型</EmptyTitle>
                <EmptyDescription>点击添加模型开始录入第一条资料。</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button render={<Link href="/admin/models/new" />}>添加模型</Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="min-w-0">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>模型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>能力</TableHead>
                    <TableHead>限制</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allModels.map((model) => {
                    const capabilityLabels = getCapabilityLabels({
                      ...model,
                      reasoningEffortLevels: parseReasoningEffortLevels(model.reasoningEffortLevels),
                    } as ModelDisplayItem);

                    return (
                      <TableRow key={model.id}>
                        <TableCell>
                          <p className="font-semibold text-foreground">{model.name}</p>
                          <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                            {[model.developer, model.modelId].filter(Boolean).join(" / ") || "未填写开发者或模型 ID"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant={model.isActive !== false ? "secondary" : "destructive"}>
                              {model.isActive !== false ? "启用" : "停用"}
                            </Badge>
                            {model.showOnHome && <Badge>主页</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{model.type || "未填写"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {capabilityLabels.length > 0 ? (
                              capabilityLabels.map((label) => (
                                <Badge key={label} variant="default">
                                  {label}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">未标注</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">上下文：{formatTokenLimit(model.contextWindow)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">输出：{formatTokenLimit(model.maxOutputTokens)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-foreground">输入：{formatCost(model.inputCostPerMTokens)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">输出：{formatCost(model.outputCostPerMTokens)}</p>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/models/${model.id}/edit`}
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
