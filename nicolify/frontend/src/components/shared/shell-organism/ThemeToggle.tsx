// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-1
"use client";

/**
 * ThemeToggle — nicolify-r0-shell T-1
 *
 * Toggle button for light/dark theme. Consumes next-themes ThemeProvider
 * (mounted in app/providers.tsx with attribute="data-theme").
 *
 * Port from vitalia/frontend/src/components/shared/shell-organism/ThemeToggle.tsx
 * re-themed: storageKey "nicolify-theme", spanish neutro aria-label (tuteo).
 *
 * Named export (no default export) per FSD-Lite enforce.
 * No wrapper useTheme hook — direct import per D5 ratificada.
 * Spanish neutro LatAm: tuteo, sin voseo (.claude/rules/spanish-text.md).
 */
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";

/**
 * ThemeToggle — botón para alternar entre tema claro y oscuro.
 * Accesible: aria-label en español neutro + aria-pressed.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const handleToggle = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Cambiar tema (actual: ${isDark ? "oscuro" : "claro"})`}
      aria-pressed={isDark}
      onClick={handleToggle}
      data-testid="theme-toggle"
    >
      {isDark ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
