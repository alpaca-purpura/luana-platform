/**
 * Architecture test — Ribbon MUST NOT use Shadcn Tabs (F1-S7 T-4 NEW)
 *
 * Invariant: Ribbon.tsx, RibbonTab.tsx, ConfigTab.tsx must NOT import from
 * '@/components/ui/tabs' (Radix Tabs primitive).
 *
 * Rationale:
 *   Shadcn <Tabs> uses Radix TabsRoot/TabsTrigger/TabsContent API, which manages
 *   active state internally and assumes content is rendered inline (not via
 *   route navigation). This is incompatible with Vitalia's route-based agent
 *   navigation pattern (each "tab" is a Next.js route segment).
 *
 *   F1-S7 ribbon implements roving tabindex WAI-ARIA tablist with usePathname()
 *   for active state — the correct pattern. Regression to Shadcn Tabs would
 *   break URL-based deep linking and Back/Forward browser navigation.
 *
 * This test is a shrink-only gate: passes once and MUST keep passing.
 *
 * spec_anchor: 03-arch.md § 12 arch tests · 06-tickets.yaml T-4 gherkin_coverage §
 *   "(arch) test-ribbon-no-shadcn-tabs.test.ts NEW invariant"
 *
 * downstream-regression-na: brand-local arch fitness test; no cross-brand consumers
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT = resolve(__dirname, "../../..");
const SHELL_ORG = join(ROOT, "src", "components", "shared", "shell-organism");

const RIBBON_FILES = ["Ribbon.tsx", "RibbonTab.tsx", "ConfigTab.tsx"] as const;

/**
 * Check if a file contains any import from @/components/ui/tabs
 * (Radix Tabs primitive — incompatible with route-based nav pattern).
 */
function fileImportsShadcnTabs(absPath: string): boolean {
  if (!existsSync(absPath)) return false;
  const source = readFileSync(absPath, "utf-8");
  // Match: import ... from '@/components/ui/tabs' or "@/components/ui/tabs"
  return /from\s+['"]@\/components\/ui\/tabs['"]/m.test(source);
}

/**
 * Check if a file contains JSX <Tabs> usage from Shadcn Tabs component.
 * Matches: <Tabs, <TabsTrigger, <TabsContent, <TabsList
 */
function fileUsesTabsJSX(absPath: string): boolean {
  if (!existsSync(absPath)) return false;
  const source = readFileSync(absPath, "utf-8");
  return /<Tabs(?:Trigger|Content|List)?[\s>/{]/.test(source);
}

describe("arch: Ribbon components must NOT use Shadcn Tabs (route-based nav invariant)", () => {
  for (const filename of RIBBON_FILES) {
    const absPath = join(SHELL_ORG, filename);

    it(`${filename} does NOT import from '@/components/ui/tabs'`, () => {
      // File must exist (T-2/T-3 must be done before T-4)
      expect(
        existsSync(absPath),
        `${filename} not found at ${absPath}. Run T-2/T-3 first.`,
      ).toBe(true);

      expect(
        fileImportsShadcnTabs(absPath),
        `${filename} imports from '@/components/ui/tabs'. ` +
          "Ribbon must use route-based navigation (usePathname/useRouter), " +
          "NOT Shadcn Tabs (Radix TabsRoot API). See 03-arch.md § anti-patterns.",
      ).toBe(false);
    });

    it(`${filename} does NOT use <Tabs> / <TabsTrigger> / <TabsContent> JSX`, () => {
      if (!existsSync(absPath)) return; // covered by previous test

      expect(
        fileUsesTabsJSX(absPath),
        `${filename} contains <Tabs*> JSX elements. ` +
          "Use <button role='tab'> with roving tabindex pattern instead.",
      ).toBe(false);
    });
  }
});
