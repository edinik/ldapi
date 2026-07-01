"use client";

import { useState } from "react";
import { SiteDirectory, type SiteDirectoryItem } from "@/components/SiteDirectory";
import { ModelOverview } from "@/components/ModelOverview";
import type { ModelDisplayItem } from "@/lib/model-display";

type Tab = "sites" | "models";

export function HomeTabs({ sites, models }: { sites: SiteDirectoryItem[]; models: ModelDisplayItem[] }) {
  const [tab, setTab] = useState<Tab>("sites");

  return (
    <div>
      <div className="flex gap-1 border-b border-[var(--hairline)]">
        <button
          type="button"
          className={tab === "sites"
            ? "border-b-2 border-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"
            : "border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--body)]"
          }
          onClick={() => setTab("sites")}
        >
          站点 ({sites.length})
        </button>
        <button
          type="button"
          className={tab === "models"
            ? "border-b-2 border-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"
            : "border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--body)]"
          }
          onClick={() => setTab("models")}
        >
          模型 ({models.length})
        </button>
      </div>

      <div className="pt-8">
        {tab === "sites" ? <SiteDirectory sites={sites} /> : <ModelOverview models={models} />}
      </div>
    </div>
  );
}
