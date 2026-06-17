import type { Config } from "tailwindcss";

/**
 * Tailwind CSS config for @luana/comunify-web.
 * Full Comunify brand palette wired (T-1 design-system-cement).
 * CSS vars live in globals.css :root — consumed here via hsl(var(--x)).
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./widget/src/**/*.{js,ts,jsx,tsx}",
    // ★ CRITICAL: scan kit organism/shell so rounded-full, bg-agent-*, ring-agent-*,
    //   border-agent-* and all utility classes used inside the kit are included in
    //   the Tailwind JIT output. Without this glob, kit styles fail SILENTLY on the
    //   live page even though tsc and ESLint pass. (lesson: tailwind-jit-scan-breaks-on-lift)
    "../../core/@luana/ui-kit/src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary palette
        "comunify-primary": "hsl(var(--comunify-primary))",
        "comunify-primary-foreground":
          "hsl(var(--comunify-primary-foreground))",
        "comunify-primary-fg": "hsl(var(--comunify-primary-foreground))",
        "comunify-primary-hover": "hsl(var(--comunify-primary-hover))",
        "comunify-purple-mid": "hsl(var(--comunify-purple-mid))",
        // Tech / trust
        "comunify-blue": "hsl(var(--comunify-blue))",
        "comunify-blue-deep": "hsl(var(--comunify-blue-deep))",
        // CTA conversion (coral)
        "comunify-accent": "hsl(var(--comunify-accent))",
        // Semantic
        "comunify-stable": "hsl(var(--comunify-stable))",
        "comunify-warning": "hsl(var(--comunify-warning))",
        "comunify-critical": "hsl(var(--comunify-critical))",
        // Dark-foreground -text tokens (a11y contrast cement — WCAG AA dark fg for tint bg)
        "comunify-warning-text": "hsl(var(--comunify-warning-text))",
        "comunify-stable-text": "hsl(var(--comunify-stable-text))",
        "comunify-accent-text": "hsl(var(--comunify-accent-text))",
        "comunify-critical-text": "hsl(var(--comunify-critical-text))",
        "comunify-blue-text": "hsl(var(--comunify-blue-text))",
        // Neutral / layout
        "comunify-text": "hsl(var(--comunify-text))",
        "comunify-text-muted": "hsl(var(--comunify-text-muted))",
        "comunify-bg": "hsl(var(--comunify-bg))",
        "comunify-surface": "hsl(var(--comunify-surface))",
        "comunify-border": "hsl(var(--comunify-border))",
        // Shell surface tokens (dark-mode-aware via --line / --bg / --panel / --ink)
        bg: "hsl(var(--bg))",
        panel: "hsl(var(--panel))",
        line: "hsl(var(--line))",
        muted: "hsl(var(--muted))",
        ink: "hsl(var(--ink))",
        // Agent ring colors — used by RibbonTab, avatar border, StatusDot (kit organisms)
        "agent-luana": "hsl(var(--agent-luana))",
        "agent-nina": "hsl(var(--agent-nina))",
        "agent-tomas": "hsl(var(--agent-tomas))",
        "agent-sofia": "hsl(var(--agent-sofia))",
        "agent-bruno": "hsl(var(--agent-bruno))",
        "agent-lucia": "hsl(var(--agent-lucia))",
      },
      backgroundImage: {
        "comunify-gradient": "var(--comunify-gradient)",
      },
      fontFamily: {
        satoshi: [
          "var(--font-satoshi)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        manrope: [
          "var(--font-manrope)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        inter: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        /* RN-7: control-atom radius — brand-overridable via @luana/ui-kit rounded-control.
         * Falls back to 0.375rem (Tailwind v4 --radius-md default) so an omitted token
         * renders identically to pre-lift rounded-md (6px, zero visual change). */
        control: "var(--radius-control, 0.375rem)",
      },
    },
  },
  plugins: [],
};

export default config;
