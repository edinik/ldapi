import { HomeTabs } from "@/components/HomeTabs";
import { getHomePageData } from "@/server/directory/get-home-page-data";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const directory = await getHomePageData();

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
          <Link href="/admin" className="ld-button-secondary">
            管理入口
          </Link>
        </div>
      </header>

      <main className="ld-container py-10 lg:py-14">
        <HomeTabs sites={directory.sites} models={directory.models} resources={directory.resources} />
      </main>
    </div>
  );
}
