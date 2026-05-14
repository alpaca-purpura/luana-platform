import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import globals from "globals";

/**
 * ESLint config for @luana/comunify-web — FSD-Lite boundaries (T-scaffold-1 + T-fe-1).
 * Full 60+ rule set wired in T-fe-2/T-fe-3 (quality hardening tickets).
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
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: { type: "app" }, allow: { to: { type: ["features", "shared", "ui", "lib", "hooks"] } } },
            { from: { type: "features" }, allow: { to: { type: ["shared", "lib", "ui"] } } },
            { from: { type: "shared" }, allow: { to: { type: ["ui", "lib"] } } },
            { from: { type: "lib" }, allow: { to: { type: [] } } },
            { from: { type: "hooks" }, allow: { to: { type: ["lib"] } } },
          ],
        },
      ],
    },
  },

  // ─── Quality rules (baseline scaffold) ───
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "prefer-const": "error",
    },
  },

  // ─── Next.js pages exception: default export allowed ───
  {
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/error.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/not-found.tsx",
    ],
    rules: {
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
