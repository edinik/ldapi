export const resourceTypes = ["tool", "tutorial"] as const;

export type ResourceType = (typeof resourceTypes)[number];

function nullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function booleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

export function parseResourceTags(value: unknown) {
  const rawTags = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n,]/) : [];
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const rawTag of rawTags) {
    const tag = String(rawTag).trim();
    const key = tag.toLowerCase();

    if (tag.length === 0 || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }

  return tags;
}

export function serializeResourceTags(value: unknown) {
  return JSON.stringify(parseResourceTags(value));
}

export function parseStoredResourceTags(value: string | null) {
  if (!value) return [];

  try {
    return parseResourceTags(JSON.parse(value));
  } catch {
    return [];
  }
}

export function normalizeResourceType(value: unknown): ResourceType {
  return value === "tool" ? "tool" : "tutorial";
}

export function parseResourcePayload(body: Record<string, unknown>) {
  return {
    type: normalizeResourceType(body.type),
    title: requiredString(body.title),
    description: nullableString(body.description),
    tags: serializeResourceTags(body.tags),
    githubUrl: nullableString(body.githubUrl),
    officialUrl: nullableString(body.officialUrl),
    demoUrl: nullableString(body.demoUrl),
    linuxdoUrl: nullableString(body.linuxdoUrl),
    recommendation: nullableString(body.recommendation),
    isActive: booleanValue(body.isActive, true),
  };
}
