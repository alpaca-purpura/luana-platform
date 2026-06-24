// This file has been automatically migrated to valid ESM format by Storybook.
import path from "path";
import { fileURLToPath } from "url";

import type { StorybookConfig } from "@storybook/nextjs-vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-themes", "@storybook/addon-a11y"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      "@": path.resolve(__dirname, "../src"),
      // Clerk module mock — redirige @clerk/nextjs al stub de Storybook.
      // Provee useAuth/useUser/useTenantId/ClerkProvider sin vi.mock.
      "@clerk/nextjs": path.resolve(__dirname, "./mocks/clerk.ts"),
    };
    return config;
  },
};

// eslint-disable-next-line import/no-default-export -- Storybook requiere default export en main.ts
export default config;
