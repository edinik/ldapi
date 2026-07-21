"use client";

import { SiteDirectory, type SiteDirectoryItem } from "@/components/SiteDirectory";
import { ModelOverview } from "@/components/ModelOverview";
import { ResourceDirectory } from "@/components/ResourceDirectory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  return (
    <Tabs defaultValue={"sites" satisfies Tab}>
      <TabsList variant="line" className="w-full justify-start">
        <TabsTrigger value="sites">站点 ({sites.length})</TabsTrigger>
        <TabsTrigger value="models">模型 ({models.length})</TabsTrigger>
        <TabsTrigger value="resources">资源 ({resources.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="sites" className="motion-tab-panel pt-8">
        <SiteDirectory sites={sites} />
      </TabsContent>
      <TabsContent value="models" className="motion-tab-panel pt-8">
        <ModelOverview models={models} />
      </TabsContent>
      <TabsContent value="resources" className="motion-tab-panel pt-8">
        <ResourceDirectory resources={resources} />
      </TabsContent>
    </Tabs>
  );
}
