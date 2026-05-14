import type { Config } from "tailwindcss";

/**
 * Tailwind CSS config for @luana/vitalia-web.
 * @luana/ui design tokens are consumed via CSS variables at runtime (T-fe-1 scaffold).
 * Full token integration with @luana/design-tokens wired in T-fe-4.
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
      // Vitalia brand tokens (seed values — full palette in T-fe-4)
      colors: {
        // Primary palette: medical teal
        "vitalia-primary": "hsl(var(--vitalia-primary))",
        "vitalia-primary-foreground": "hsl(var(--vitalia-primary-foreground))",
        // Accent: health green
        "vitalia-accent": "hsl(var(--vitalia-accent))",
        // Medical severity palette
        "vitalia-critical": "hsl(var(--vitalia-critical))",
        "vitalia-warning": "hsl(var(--vitalia-warning))",
        "vitalia-stable": "hsl(var(--vitalia-stable))",
      },
    },
  },
  plugins: [],
};

export default config;
