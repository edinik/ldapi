"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getNextTheme,
  parseThemePreference,
  resolveTheme,
  themeStorageKey,
  type Theme,
} from "@/lib/theme";

interface ThemeContextValue {
  resolvedTheme: Theme | null;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme | null {
  try {
    return parseThemePreference(window.localStorage.getItem(themeStorageKey));
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [resolvedTheme, setResolvedTheme] = useState<Theme | null>(null);

  const syncTheme = useCallback((theme: Theme) => {
    applyTheme(theme);
    setResolvedTheme(theme);
  }, []);

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const resolveAndSyncTheme = () => {
      syncTheme(resolveTheme(readStoredTheme(), mediaQuery.matches));
    };

    const handleSystemThemeChange = () => {
      if (readStoredTheme() === null) {
        resolveAndSyncTheme();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === themeStorageKey || event.key === null) {
        resolveAndSyncTheme();
      }
    };

    resolveAndSyncTheme();
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [syncTheme]);

  const toggleTheme = useCallback(() => {
    const currentTheme =
      resolvedTheme ?? (document.documentElement.classList.contains("dark") ? "dark" : "light");
    const nextTheme = getNextTheme(currentTheme);

    try {
      window.localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // The current page can still switch themes when storage is unavailable.
    }

    syncTheme(nextTheme);
  }, [resolvedTheme, syncTheme]);

  const contextValue = useMemo(
    () => ({ resolvedTheme, toggleTheme }),
    [resolvedTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
