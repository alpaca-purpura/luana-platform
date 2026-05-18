import type { Config } from "tailwindcss";

/**
 * Vitalia — Tailwind CSS config
 * SSoT: vitalia/docs/architecture/design-system.md § 5
 * Tokens consumed via CSS vars in app/globals.css (hsl(var(--vitalia-X)))
 * ADR: vitalia/docs/architecture/ADR-vitalia-001-shared-vs-fork.md
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./widget/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Brand core (4+1 colores oficiales brandbook 2026-05-17) ──────── */
        "vitalia-cian":        "hsl(var(--vitalia-cian))",
        "vitalia-purpura":     "hsl(var(--vitalia-purpura))",
        "vitalia-amarillo":    "hsl(var(--vitalia-amarillo))",
        "vitalia-azul-marino": "hsl(var(--vitalia-azul-marino))",
        "vitalia-verde-lima":  "hsl(var(--vitalia-verde-lima))",

        /* ── Neutrales (app shell) ───────────────────────────────────────── */
        "vitalia-bg":           "hsl(var(--vitalia-bg))",
        "vitalia-surface":      "hsl(var(--vitalia-surface))",
        "vitalia-surface-alt":  "hsl(var(--vitalia-surface-alt))",
        "vitalia-muted":        "hsl(var(--vitalia-muted))",
        "vitalia-text":         "hsl(var(--vitalia-text))",
        "vitalia-text-muted":   "hsl(var(--vitalia-text-muted))",
        "vitalia-text-faint":   "hsl(var(--vitalia-text-faint))",
        "vitalia-border":       "hsl(var(--vitalia-border))",
        "vitalia-border-soft":  "hsl(var(--vitalia-border-soft))",

        /* ── Semantic (status médico) ─────────────────────────────────────── */
        "vitalia-success":  "hsl(var(--vitalia-success))",
        "vitalia-warning":  "hsl(var(--vitalia-warning))",
        "vitalia-danger":   "hsl(var(--vitalia-danger))",
        "vitalia-info":     "hsl(var(--vitalia-info))",
      },

      backgroundImage: {
        /* ── Gradients (consume CSS vars defined in globals.css) ─────────── */
        "vitalia-gradient-mariposa": "var(--vitalia-gradient-mariposa)",
        "vitalia-gradient-agent":    "var(--vitalia-gradient-agent)",
        "vitalia-gradient-app-cta":  "var(--vitalia-gradient-app-cta)",
      },

      fontFamily: {
        /* ── Typography stack (3 fuentes — design-system.md § 2) ─────────── */
        display: ["var(--font-general-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        body:    ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      borderRadius: {
        /* ── Shape tokens (design-system.md § 3) ─────────────────────────── */
        DEFAULT: "var(--radius)",
        lg:      "var(--radius-lg)",
        bubble:  "var(--radius-bubble)",
        pill:    "var(--radius-pill)",
      },
    },
  },
  plugins: [],
};

export default config;
