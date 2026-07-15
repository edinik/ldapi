import { HomeTabs } from "@/components/HomeTabs";
import { Button } from "@/components/ui/button";
import { getHomePageData } from "@/server/directory/get-home-page-data";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const directory = await getHomePageData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-[min(100%-2rem,1200px)] items-center justify-between">
          <Link href="/" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              L
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">LDAPI</p>
              <p className="text-xs text-muted-foreground">AI 公益站导航</p>
            </div>
          </Link>
          <Button variant="outline" render={<Link href="/admin" />}>
            管理入口
          </Button>
        </div>
      </header>

      <main className="mx-auto w-[min(100%-2rem,1200px)] py-10 lg:py-14">
        <HomeTabs sites={directory.sites} models={directory.models} resources={directory.resources} />
      </main>
    </div>
  );
}
