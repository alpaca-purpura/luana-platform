import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    exclude: ["e2e/**", "node_modules/**", "widget/**"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      // Focus coverage on testable logic — exclude type-only files and Next.js pages (SSR)
      include: [
        "src/features/comunify/schemas/**",
        "src/features/comunify/api/**",
        "src/lib/**",
      ],
      exclude: [
        "src/features/comunify/types/**",
        "src/features/comunify/index.ts",
        // Hooks use Clerk + React Query — covered in T-fe-3+ component integration tests
        "src/features/comunify/api/use-*.ts",
        "**/*.d.ts",
        "**/node_modules/**",
      ],
      thresholds: {
        statements: 20,
        branches: 20,
        functions: 20,
        lines: 20,
      },
    },
  },
});
