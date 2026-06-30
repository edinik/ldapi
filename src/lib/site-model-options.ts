export type AvailableSiteModelOption = {
  name: string;
  developer: string | null;
  modelId: string | null;
};

export function filterAvailableSiteModels(
  options: AvailableSiteModelOption[],
  query: string,
  selectedNames: string[],
) {
  const normalizedQuery = query.trim().toLowerCase();
  const selected = new Set(selectedNames.map((name) => name.toLowerCase()));

  return options.filter((option) => {
    if (selected.has(option.name.toLowerCase())) return false;
    if (!normalizedQuery) return true;

    return [option.name, option.developer, option.modelId]
      .filter((value): value is string => typeof value === "string")
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}
