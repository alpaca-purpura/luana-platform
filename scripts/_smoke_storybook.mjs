#!/usr/bin/env node
/**
 * Smoke gate: verify the Storybook static build contains the expected stories.
 *
 * Runs against the pre-built storybook-static/index.json — NO running server needed.
 * Checks that every canonical story ID is present and that the bundle compiled without
 * error (i.e. storybook build succeeded before this runs).
 *
 * This is the degraded alternative to `test-storybook` (Playwright-based render).
 * Use `test-storybook` when a Storybook server is available; use this script in CI
 * or local runs where spinning a server is inconvenient.
 *
 * Usage:
 *   node scripts/_smoke_storybook.mjs
 *
 * Prerequisites:
 *   pnpm --filter @luana/ui-kit build-storybook   (writes storybook-static/index.json)
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(root, "core/@luana/ui-kit/storybook-static/index.json");

if (!existsSync(indexPath)) {
  console.error("ERROR: storybook-static/index.json not found. Run: pnpm --filter @luana/ui-kit build-storybook");
  process.exit(1);
}

const index = JSON.parse(readFileSync(indexPath, "utf8"));
const entries = index.entries ?? {};
const storyIds = new Set(Object.keys(entries));

// Canonical story IDs expected from Batch 1 + Batch 2.
// Format: storybook kebab-case IDs (title--story-name).
const CANONICAL = [
  // Batch 1 — lista/detalle
  "lista-detalle-entityinfocard--default",
  "lista-detalle-entitypicker--default",
  "lista-detalle-entitysubnavbar--master-mode",
  "lista-detalle-entityworkspacelayout--detail-mode",
  // Batch 2 — layout primitives
  "layout-pagecontainer--default",
  "layout-pageheader--sin-acciones",
  "layout-pageheader--con-acciones",
  "layout-pagesection--con-titulo",
  "layout-pagecontentstack--default",
  "layout-toolbar--basica",
  "layout-toolbar--con-barra-filtros",
  "layout-emptystate--sin-icono",
  "layout-emptystate--error-state-default",
  "layout-pagination--primera-pagina",
  "layout-pagination--interactiva",
  "layout-skeletons--lista-skeleton",
  "layout-skeletons--formulario-skeleton",
  "layout-detaillayout--detail-layout-default",
  "layout-detaillayout--form-layout-dos-columnas",
  // Batch 2 — archetypes
  "archetypes-listpagescaffold--con-contenido",
  "archetypes-listpagescaffold--cargando",
  "archetypes-listpagescaffold--vacio",
  "archetypes-listpagescaffold--con-error",
  "archetypes-detailpagescaffold--con-subnav",
  "archetypes-detailpagescaffold--cargando",
  "archetypes-formpagescaffold--con-contenido",
  "archetypes-formpagescaffold--estado-guardando",
  "archetypes-dashboardpagescaffold--con-secciones",
  "archetypes-dashboardpagescaffold--cargando",
  // Batch 2 — Group
  "group-group--basico",
  "group-group--con-accento-de-agente",
  "group-group--con-error-semantico",
  "group-group--what-for-chip-solo",
  // Batch 2 — autosave
  "autosave-floatingautosaveindicator--idle",
  "autosave-floatingautosaveindicator--saving",
  "autosave-floatingautosaveindicator--saved",
  "autosave-floatingautosaveindicator--error",
  "autosave-autosavebadge--idle",
  "autosave-autosavebadge--saving",
  "autosave-autosavebadge--saved",
  "autosave-autosavebadge--todos-los-estados",
];

const missing = CANONICAL.filter((id) => !storyIds.has(id));

if (missing.length > 0) {
  console.error(`smoke_storybook FAIL: ${missing.length} canonical story IDs missing from build:`);
  for (const id of missing) console.error(`  - ${id}`);
  process.exit(1);
}

const totalStories = Object.values(entries).filter((e) => e.type === "story").length;
console.log(`smoke_storybook PASS: ${totalStories} stories compiled into storybook-static/index.json`);
console.log(`  Canonical IDs verified: ${CANONICAL.length}/${CANONICAL.length}`);
console.log(`  Total story entries: ${totalStories} (including docs variants not in CANONICAL)`);
