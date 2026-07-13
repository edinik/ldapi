import type { SiteDirectoryItem } from "@/components/SiteDirectory";
import type { ModelDisplayItem } from "@/lib/model-display";
import type { DirectoryResource } from "@/lib/resource-directory-filter";

export type HomeDirectoryData = {
  sites: SiteDirectoryItem[];
  models: ModelDisplayItem[];
  resources: DirectoryResource[];
};
