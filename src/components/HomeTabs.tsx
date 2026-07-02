"use client";

import { useState } from "react";
import { SiteDirectory, type SiteDirectoryItem } from "@/components/SiteDirectory";
import { ModelOverview } from "@/components/ModelOverview";
import { ResourceDirectory } from "@/components/ResourceDirectory";
import type { ModelDisplayItem } from "@/lib/model-display";
import type { DirectoryResource } from "@/lib/resource-directory-filter";

type Tab = "sites" | "models" | "resources";

export function HomeTabs({
  sites,
  models,
  resources,
}: {
  sites: SiteDirectoryItem[];
  models: ModelDisplayItem[];
  resources: DirectoryResource[];
}) {
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
        <button
          type="button"
          className={tab === "resources"
            ? "border-b-2 border-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"
            : "border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--body)]"
          }
          onClick={() => setTab("resources")}
        >
          资源 ({resources.length})
        </button>
      </div>

      <div className="pt-8">
        {tab === "sites" && <SiteDirectory sites={sites} />}
        {tab === "models" && <ModelOverview models={models} />}
        {tab === "resources" && <ResourceDirectory resources={resources} />}
      </div>
    </div>
  );
}
