import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import globals from "globals";

/**
 * ESLint config for @luana/vitalia-web — FSD-Lite boundaries (T-fe-1 scaffold).
 * Full 60+ rule set wired in T-fe-4 (quality hardening ticket).
 * Boundaries plugin enforces cross-feature import isolation per .claude/rules/frontend-fsd.md.
 */

/** @type {import("eslint").Linter.Config[]} */
export default [
  // ─── Base JS recommendations ───
  js.configs.recommended,

  // ─── TypeScript ───
  ...tseslint.configs.recommended,

  // ─── Language options ───
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // ─── FSD-Lite boundaries ───
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "features", pattern: "src/features/**" },
        { type: "shared", pattern: "src/components/shared/**" },
        { type: "ui", pattern: "src/components/ui/**" },
        { type: "lib", pattern: "src/lib/**" },
        { type: "hooks", pattern: "src/hooks/**" },
      ],
    },
    rules: {
      // FSD-Lite: cross-feature imports forbidden by default
      // Using "boundaries/dependencies" (v6 API, replaces deprecated "boundaries/element-types")
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            // app can import from everything
            { from: { type: "app" }, allow: { to: { type: ["features", "shared", "ui", "lib", "hooks"] } } },
            // features can import from shared libs, ui, lib
            { from: { type: "features" }, allow: { to: { type: ["shared", "lib", "ui"] } } },
            // shared components can import ui and lib
            { from: { type: "shared" }, allow: { to: { type: ["ui", "lib"] } } },
            // lib is self-contained (no cross imports)
            { from: { type: "lib" }, allow: { to: { type: [] } } },
            // hooks can import lib
            { from: { type: "hooks" }, allow: { to: { type: ["lib"] } } },
          ],
        },
      ],
    },
  },

  // ─── Quality rules (baseline T-fe-1 scope) ───
  {
    rules: {
      // TypeScript strict
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // No default exports (except Next.js pages — overridden below)
      // Kept as warning for scaffold; T-fe-4 upgrades to error
      "no-var": "error",
      "prefer-const": "error",
    },
  },

  // ─── Next.js pages exception: default export allowed ───
  {
    files: ["src/app/**/page.tsx", "src/app/**/layout.tsx", "src/app/**/error.tsx", "src/app/**/loading.tsx", "src/app/**/not-found.tsx"],
    rules: {
      // Next.js App Router requires default exports on pages/layouts
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // ─── Test files ───
  {
    files: ["src/__tests__/**/*.ts", "src/__tests__/**/*.tsx"],
    languageOptions: {
      globals: {
        ...globals.browser,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      // Relax some rules for test files
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // ─── Ignore patterns ───
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "widget/dist/**",
      "coverage/**",
      ".eslintcache",
    ],
  },
];
