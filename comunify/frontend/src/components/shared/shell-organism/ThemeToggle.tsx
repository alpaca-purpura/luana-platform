// cap: comunify-shell-organism
"use client";

/**
 * ThemeToggle — T-shell comunify
 *
 * Toggle button for light/dark theme. Consumes next-themes ThemeProvider
 * (mounted in app/providers.tsx with attribute="data-theme").
 *
 * Port from nicolify/frontend ThemeToggle.tsx re-themed for Comunify.
 * storageKey "comunify-theme", spanish neutro aria-label (tuteo).
 *
 * Named export (no default export) per FSD-Lite enforce.
 * Spanish neutro LatAm: tuteo, sin voseo (.claude/rules/spanish-text.md).
 */
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

import { Button } from "@luana/ui-kit";

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
