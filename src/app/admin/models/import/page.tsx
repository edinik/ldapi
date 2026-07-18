import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createModelImportTemplate } from "@/lib/model-import";
import { requireAdmin } from "@/lib/session";
import ImportModelsClient from "./ImportModelsClient";

export default async function ImportModelsPage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-[min(100%-2rem,1200px)]">
        <header className="mb-8 flex items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <Link href="/admin/models" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              返回模型管理
            </Link>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">导入模型</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              使用 JSON 模板批量导入模型资料。建议先让 AI 根据官网整理内容，再在这里预检和导入。
            </p>
          </div>
          <ThemeToggle />
        </header>

        <ImportModelsClient template={createModelImportTemplate()} />
      </div>
    </main>
  );
}
