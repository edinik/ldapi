export const capabilityKeys = [
  "hasCheckIn",
  "autoCheckIn",
  "supportsClaudeCode",
  "supportsCodex",
  "supportsImmersiveTranslation",
  "hasRateLimit",
  "hasActivityRequirement",
] as const;

export type CapabilityKey = (typeof capabilityKeys)[number];

export type DirectorySite = {
  id: number;
  name: string;
  url: string;
  description: string | null;
  models: string[];
} & Record<CapabilityKey, boolean | null>;

export type SiteDirectoryFilters = {
  query: string;
  capabilities: CapabilityKey[];
  model: string;
};

export function filterSites(sites: DirectorySite[], filters: SiteDirectoryFilters) {
  const query = filters.query.trim().toLowerCase();

  return sites.filter((site) => {
    const matchesQuery =
      query.length === 0 ||
      [site.name, site.url, site.description ?? "", ...site.models].some((value) =>
        value.toLowerCase().includes(query),
      );

    const matchesCapabilities = filters.capabilities.every((capability) => site[capability]);
    const matchesModel = filters.model.length === 0 || site.models.includes(filters.model);

    return matchesQuery && matchesCapabilities && matchesModel;
  });
}
