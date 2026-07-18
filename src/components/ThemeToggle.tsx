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
      <Moon aria-hidden="true" className="dark:hidden" />
      <Sun aria-hidden="true" className="hidden dark:block" />
    </Button>
  );
}
