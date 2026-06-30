import Link from "next/link";
import { createModelImportTemplate } from "@/lib/model-import";
import { requireAdmin } from "@/lib/session";
import ImportModelsClient from "./ImportModelsClient";

export default async function ImportModelsPage() {
  await requireAdmin();

  return (
    <main className="ld-page min-h-screen py-8">
      <div className="ld-container">
        <header className="mb-8 border-b border-[var(--hairline)] pb-6">
          <Link href="/admin/models" className="ld-link text-sm">
            返回模型管理
          </Link>
          <h1 className="ld-display mt-4 text-5xl leading-tight text-[var(--ink)]">导入模型</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            使用 JSON 模板批量导入模型资料。建议先让 AI 根据官网整理内容，再在这里预检和导入。
          </p>
        </header>

        <ImportModelsClient template={createModelImportTemplate()} />
      </div>
    </main>
  );
}
