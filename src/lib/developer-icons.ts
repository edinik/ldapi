import { lobeIconSlugs } from "@/lib/lobe-icon-slugs";

export function getLobeIconUrl(slug: string) {
  return `https://unpkg.com/@lobehub/icons-static-svg@latest/icons/${slug}.svg`;
}

export const developerIconPaths: Record<string, string> = {
  alibaba: getLobeIconUrl("alibaba"),
  anthropic: getLobeIconUrl("anthropic"),
  bytedance: getLobeIconUrl("bytedance"),
  deepseek: getLobeIconUrl("deepseek"),
  google: getLobeIconUrl("google"),
  kwaipilot: getLobeIconUrl("kwaipilot"),
  longcat: getLobeIconUrl("longcat"),
  meta: getLobeIconUrl("meta"),
  minimax: getLobeIconUrl("minimax"),
  mistral: getLobeIconUrl("mistral"),
  moonshot: getLobeIconUrl("moonshot"),
  nvidia: getLobeIconUrl("nvidia"),
  openai: getLobeIconUrl("openai"),
  stepfun: getLobeIconUrl("stepfun"),
  xai: getLobeIconUrl("xai"),
  xiaomi: getLobeIconUrl("xiaomimimo"),
  zai: getLobeIconUrl("zai"),
};

export const developerIconOptions = Object.entries(developerIconPaths).map(([developer, path]) => ({
  developer,
  label: developer,
  value: path,
}));

export const lobeIconOptions = lobeIconSlugs.map((slug) => ({
  developer: slug,
  label: slug,
  value: getLobeIconUrl(slug),
}));

export function normalizeDeveloperName(developer: string | null | undefined) {
  return developer?.trim().toLowerCase().replace(/\s+/g, "") || "";
}

export function getDeveloperIconPath(developer: string | null | undefined) {
  return developerIconPaths[normalizeDeveloperName(developer)] || null;
}
