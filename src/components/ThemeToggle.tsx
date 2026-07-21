"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const label =
    resolvedTheme === "dark"
      ? "切换至日间模式"
      : resolvedTheme === "light"
        ? "切换至夜间模式"
        : "切换日间或夜间模式";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      aria-pressed={resolvedTheme === null ? undefined : resolvedTheme === "dark"}
      title={label}
      onClick={toggleTheme}
    >
      <span className="relative size-4">
        <Moon
          aria-hidden="true"
          className="absolute inset-0 size-4 transition-all duration-300 ease-in-out motion-reduce:transition-none dark:scale-0 dark:rotate-90 dark:opacity-0"
        />
        <Sun
          aria-hidden="true"
          className="absolute inset-0 size-4 scale-0 -rotate-90 opacity-0 transition-all duration-300 ease-in-out motion-reduce:transition-none dark:scale-100 dark:rotate-0 dark:opacity-100"
        />
      </span>
    </Button>
  );
}
