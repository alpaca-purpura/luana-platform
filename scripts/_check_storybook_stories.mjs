#!/usr/bin/env node
/**
 * Gate sb_renders_canon (story core-ds-foundation T-2).
 *
 * Asserts every component in the DELIVERED batch has a Storybook story file under
 * core/@luana/ui-kit/stories/ that imports the REAL component from ../src/ (never a copy).
 *
 * Batch-aware: the validator effect lists the full canonical set, but T-2 ships
 * incrementally (review_protocol: "entrega incrementalmente, no big-bang"). This script
 * gates the LISTA/DETALLE group delivered now. Append slugs as later batches land.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const storiesDir = join(root, "core/@luana/ui-kit/stories");

// component file basename (under src/) → story file basename (under stories/)
const BATCH = [
  ["EntityWorkspaceLayout", "EntityWorkspaceLayout.stories.tsx"],
  ["EntitySubNavBar", "EntitySubNavBar.stories.tsx"],
  ["EntityPicker", "EntityPicker.stories.tsx"],
  ["EntityInfoCard", "EntityInfoCard.stories.tsx"],
];

const failures = [];
for (const [component, storyFile] of BATCH) {
  const path = join(storiesDir, storyFile);
  if (!existsSync(path)) {
    failures.push(`MISSING story for ${component}: ${storyFile}`);
    continue;
  }
  const src = readFileSync(path, "utf8");
  // Must import the REAL component from ../src/ (consume, never copy).
  if (!new RegExp(`from "\\.\\./src/${component}"`).test(src)) {
    failures.push(
      `${storyFile} does not import the real component from ../src/${component}`,
    );
  }
  // Must declare a story meta + autodocs tag (props/code autodocs).
  if (!/tags:\s*\[[^\]]*"autodocs"/.test(src)) {
    failures.push(`${storyFile} missing tags: ["autodocs"]`);
  }
}

if (failures.length) {
  console.error("sb_renders_canon FAIL:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`sb_renders_canon PASS: ${BATCH.length} canon stories present (lista/detalle batch)`);
