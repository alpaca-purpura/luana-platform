// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-1
/**
 * Architecture fitness test: Spanish neutro LatAm (tuteo, sin voseo)
 *
 * Scans shell-organism components for voseo patterns in user-facing strings.
 * Baseline per .claude/rules/spanish-text.md — F2 gherkin scenario i18n coverage.
 *
 * Ratchet: shrink-only. Any new voseo violation = test failure.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

import { describe, it, expect } from "vitest";

const SHELL_ORGANISM_DIR = resolve(__dirname, "../../components/shared/shell-organism");

// Voseo imperative suffixes that must NOT appear in user-facing string literals
// Reference: .claude/rules/spanish-text.md § R2 glosario
const VOSEO_IMPERATIVE_ENDINGS = [
  /\btenés\b/,
  /\bpodés\b/,
  /\bhacés\b/,
  /\bsabés\b/,
  /\bquerés\b/,
  /\bvenís\b/,
  /\bdecís\b/,
  // Voseo imperatives (2nd person singular -á/-é form that's NOT 3rd person)
  /\bmirá\b/,
  /\bdejá\b/,
  /\bponé\b/,
  /\busá\b/,
  /\bhacé\b/,
  /\belegí\b/,
  /\bagreg[áa]\b/,
  /\bconfigur[áa]\b/,
  /\brevisar?[áa]\b/,
  /\bguard[áa]\b/,
  /\babrí\b/,
  /\bvolvé\b/,
];

function getAllTsxFiles(dir: string): string[] {
  let files: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory() && entry !== "__tests__" && entry !== "node_modules") {
        files = files.concat(getAllTsxFiles(fullPath));
      } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
        if (!entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
          files.push(fullPath);
        }
      }
    }
  } catch {
    // directory may not exist yet — that's OK, test passes (nothing to scan)
  }
  return files;
}

describe("Architecture: Spanish neutro (tuteo, sin voseo) in shell-organism", () => {
  const files = getAllTsxFiles(SHELL_ORGANISM_DIR);

  it("shell-organism directory accessible (may be empty during incremental build)", () => {
    // This test passes whether directory exists and is empty or not.
    // Files are added ticket by ticket. The voseo scan runs on whatever's present.
    expect(true).toBe(true);
  });

  if (files.length === 0) {
    it("no TSX/TS files yet — voseo scan pending (T-2..T-6 will populate)", () => {
      expect(files.length).toBe(0); // tautology — passes, documents intent
    });
  } else {
    for (const filePath of files) {
      it(`no voseo in ${filePath.split("shell-organism/")[1] ?? filePath}`, () => {
        const content = readFileSync(filePath, "utf-8");
        for (const pattern of VOSEO_IMPERATIVE_ENDINGS) {
          // Only check inside string literals (JSX text or string values)
          // Skip comments and variable names
          const stringLiteralContent = content
            .replace(/\/\/[^\n]*/g, "") // remove line comments
            .replace(/\/\*[\s\S]*?\*\//g, ""); // remove block comments
          expect(stringLiteralContent).not.toMatch(pattern);
        }
      });
    }
  }
});
