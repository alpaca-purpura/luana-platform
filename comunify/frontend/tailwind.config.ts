import type { Config } from "tailwindcss";

/**
 * Tailwind CSS config for @luana/comunify-web.
 * @luana/ui design tokens are consumed via CSS variables at runtime (T-scaffold-1).
 * Full token integration with @luana/design-tokens + comunify brand palette wired in T-fe-3.
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
      // Comunify brand tokens (seed values — full palette in T-fe-3)
      colors: {
        // Primary palette: creator-economy warm
        "comunify-primary": "hsl(var(--comunify-primary))",
        "comunify-primary-foreground": "hsl(var(--comunify-primary-foreground))",
        // Accent: community engagement
        "comunify-accent": "hsl(var(--comunify-accent))",
        // Community safety severity palette
        "comunify-critical": "hsl(var(--comunify-critical))",
        "comunify-warning": "hsl(var(--comunify-warning))",
        "comunify-stable": "hsl(var(--comunify-stable))",
      },
    },
  },
  plugins: [],
};

export default config;
