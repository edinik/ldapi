import type { ResourceType } from "@/lib/resource-payload";

export type ResourceTypeFilter = ResourceType | "all";

export type DirectoryResource = {
  id: number;
  type: ResourceType;
  title: string;
  description: string | null;
  tags: string[];
  githubUrl: string | null;
  officialUrl: string | null;
  demoUrl: string | null;
  linuxdoUrl: string | null;
  recommendation: string | null;
};

export type ResourceDirectoryFilters = {
  query: string;
  type: ResourceTypeFilter;
  tags: string[];
};

export function filterResources(resources: DirectoryResource[], filters: ResourceDirectoryFilters) {
  const query = filters.query.trim().toLowerCase();

  return resources.filter((resource) => {
    const matchesQuery =
      query.length === 0 ||
      [
        resource.title,
        resource.description ?? "",
        resource.recommendation ?? "",
        resource.githubUrl ?? "",
        resource.officialUrl ?? "",
        resource.demoUrl ?? "",
        resource.linuxdoUrl ?? "",
        ...resource.tags,
      ].some((value) => value.toLowerCase().includes(query));

    const matchesType = filters.type === "all" || resource.type === filters.type;
    const matchesTags = filters.tags.every((tag) => resource.tags.includes(tag));

    return matchesQuery && matchesType && matchesTags;
  });
}

export function getResourceTagOptions(resources: DirectoryResource[]) {
  return Array.from(new Set(resources.flatMap((resource) => resource.tags))).sort((a, b) => {
    const normalizedA = a.toLowerCase();
    const normalizedB = b.toLowerCase();

    if (normalizedA < normalizedB) return -1;
    if (normalizedA > normalizedB) return 1;
    return 0;
  });
}
