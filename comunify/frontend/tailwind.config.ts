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
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        "comunify-primary": "hsl(var(--comunify-primary))",
        "comunify-primary-foreground": "hsl(var(--comunify-primary-foreground))",
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
        // Neutral / layout
        "comunify-text": "hsl(var(--comunify-text))",
        "comunify-text-muted": "hsl(var(--comunify-text-muted))",
        "comunify-bg": "hsl(var(--comunify-bg))",
        "comunify-surface": "hsl(var(--comunify-surface))",
        "comunify-border": "hsl(var(--comunify-border))",
      },
      backgroundImage: {
        "comunify-gradient": "var(--comunify-gradient)",
      },
      fontFamily: {
        satoshi: ["var(--font-satoshi)", "ui-sans-serif", "system-ui", "sans-serif"],
        manrope: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
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
