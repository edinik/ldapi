export const themeStorageKey = "ldapi-theme";

export type Theme = "light" | "dark";

export function parseThemePreference(value: unknown): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}

export function resolveTheme(preference: Theme | null, systemPrefersDark: boolean): Theme {
  return preference ?? (systemPrefersDark ? "dark" : "light");
}

export function getNextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
