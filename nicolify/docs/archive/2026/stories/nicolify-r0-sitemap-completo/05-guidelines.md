---
story_id: nicolify-r0-sitemap-completo
kind: 05-guidelines
brand: nicolify
surfaces: [frontend]
architecture_pattern: ADR-nicolify-001
adr_001_compliance: partial-with-rationale
owner: /architect
generated_on: 2026-06-03
---

# 05-guidelines — Nicolify R0 sitemap (thin nav-skeleton · FE-only)

> Patterns + reglas concretas que `builder-frontend` aplica. Es un build de DATOS sobre maquinaria shipped — alta disciplina de scope, baja ceremonia de diseño.

## must_load_skills (builder)
- `frontend-expert` — Server-First, FSD-Lite, patrones de ruta Next.js 16 App Router.
- `nicolify-design-system` — labels/copy nicolify (tuteo), reuso de `EmptyState`, N3-static (SubSubTabsBar), JIT-safe classes.
- `playwright-expert` — fixture autenticado (Clerk testing token) + gate anti-burbuja `base.ts` + nav-walk.

## must_load_rules
- `.claude/rules/frontend-fsd.md` — boundaries.
- `.claude/rules/frontend-quality.md` — gates (tsc/eslint/vitest/arch).
- `.claude/rules/frontend-visual-fidelity.md` — D3 scope discipline (NO construir hojas reales).
- `.claude/rules/spanish-text.md` — neutro tuteo en labels/copy.
- `.claude/rules/definition-of-done-live-verify.md` — DoD #37 (live-verify localhost:3001 + base.ts anti-burbuja + demo).
- `.claude/rules/anti-orphan-integration.md` — CONN (cada leaf navegable + con empty-state).
- `nicolify/.claude/rules/shell-feature-architecture.md` — ADR-nicolify-001 (adr_001_compliance: partial-with-rationale ya justificado en 03-arch § 16).

## Files in scope (verbatim · ver 03-arch-fe.md tabla completa)
**MODIFIED:** `src/lib/routing/shell-routes.ts` · `src/lib/agent-catalog.ts` · `src/components/shared/shell-organism/SubTabContent.tsx` · `src/lib/routing/__tests__/shell-routes.test.ts` · `src/__tests__/architecture/test_shell_routes_ssot.test.ts` · `e2e/.../empty-states-all-subtabs.spec.ts` (+ `ribbon-nav`/`ribbon-deeplink` si referencian slugs viejos · solo data).
**NEW:** `src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx` (+ `not-found.tsx`) · `e2e/fixtures/base.ts` · `e2e/regression/nicolify-r0-shell/nav-walk-v3.spec.ts`.

## Patterns FE (concretos)

### P1 — shell-routes.ts es el SSoT (no hardcodear nada fuera)
El árbol vive UNA sola vez en `AGENT_CATALOG` / `AGENT_SUBTABS` / `AGENT_SUBSUBTABS`. La maquinaria (Ribbon/SubTabsBar/SubSubTabsBar/dispatcher) lee de ahí. NUNCA escribir un array de slugs/subtabs en un componente. El arch test `test_shell_routes_ssot` lo enforce.

### P2 — Árbol v3 exacto (de SYSTEM-MAP v2.0 · copiar slug-a-slug)
```ts
AGENT_SUBTABS = {
  abel:      [icp, oferta, marca],
  brenda:    [contenido-presencia, pauta, inteligencia-asesoria],
  christian: [contactos, inbox, pipeline, equipo-comercial, agenda, propuestas],
  sara:      [proximamente],                 // único · deferred
  norvil:    [cartera, renovaciones, fidelizacion],
  config:    [conexiones, preferencias, tokens, autonomia-agentes],
}
AGENT_SUBSUBTABS = {
  "abel.oferta":          [catalogo-escalera, dossier-mineria],
  "christian.propuestas": [propuestas, licitaciones],
  "norvil.fidelizacion":  [momentos, champion-shield, value-proof-qbr, gifting],
}
DEFAULT_LANDING = { agent: "christian", subtab: "pipeline" }   // SIN cambio
AGENT_CATALOG.defaultSubtab:  abel→icp · brenda→contenido-presencia · christian→pipeline · sara→proximamente · norvil→cartera · config→conexiones
```
Cada `SubTabMeta`/`SubSubTabMeta` = `{ id, label, icon }`. Label en español neutro tuteo + emoji. Sugerencia de labels: ICP & buyer 🎯 · Oferta 📦 · Marca 🏷️ · Contenido & Presencia ✍️ · Pauta 📢 · Inteligencia & Asesoría 🧠 · Contactos 👥 · Inbox 📥 · Pipeline 📊 · Equipo comercial 🧑‍💼 · Agenda 📅 · Propuestas 📝 · Próximamente ⏳ · Cartera 🗂️ · Renovaciones 🔄 · Fidelización 💚 · Conexiones 🔌 · Preferencias ⚙️ · Tokens 🪙 · Autonomía de agentes 🤖. Leaves: Catálogo & escalera 📦 · Dossier (minería) ⛏️ · Propuestas 📝 · Licitaciones ⛏️ · Momentos 🎂 · Champion-shield 🛡️ · Value-proof / QBR 📈 · Gifting 🎁. (Emojis ajustables; lo HARD son los `id` slugs.)

### P3 — Guards whitelist (G3 / A4) — agregar isValidSubSubTab
Los guards existentes (`isValidAgent`/`isValidSubtab`/`getDefaultSubtab`) validan por construcción el set nuevo (leen `AGENT_SUBTABS`). Agregar `isValidSubSubTab(agent, subtab, subsubtab)` simétrico (ver 03-arch-fe § Whitelist guard N3) — la ruta N3 lo usa para `notFound()`. Cubre XSS/path-traversal/prototype en N3.

### P4 — Ruta N3 = clon verbatim del patrón [subtab]/page.tsx
```ts
// [agent]/[subtab]/[subsubtab]/page.tsx — Server Component
export default async function SubSubtabPage({ params }: { params: Promise<{tenantId,agent,subtab,subsubtab}> }) {
  const { agent, subtab, subsubtab } = await params;
  if (!isValidSubSubTab(agent, subtab, subsubtab)) notFound();
  return <SubTabContent agent={agent} subtab={subtab} subsubtab={subsubtab} />; // dispatcher resuelve el empty-state del leaf
}
```
`SubTabContent` se amplía para aceptar `subsubtab?` opcional y, cuando viene, buscar la key `{agent}.{subtab}.{subsubtab}` (o `{agent}.{subsubtab}`) en el content-map → empty-state del leaf. Mantener el fallback genérico existente. (Decidí key `{agent}.{subtab}.{subsubtab}` para evitar colisión — christian.propuestas.propuestas vs christian.propuestas.licitaciones.)

### P5 — Empty-states: reusar EmptyState (NO diseñar contenido)
El content-map (`SUBTAB_CONTENT_MAP`) mapea cada combo → `{icon, title, description, ctaLabel?}`. Reescribir las keys al árbol v3 (N2) + agregar las 8 leaves. Copy "en construcción / Próximamente" neutro tuteo, NO contenido real de la hoja. Sara: title "Próximamente" + copy que indica que el espacio existe pero la función llega después.

### P6 — Server-First (G2 N/A)
Empty-states + páginas N2/N3 = Server Components (sin `"use client"`). Sin store nuevo → G2 (SSR-safe persist) N/A. La maquinaria N2/N3 que ya es client (SubSubTabsBar) NO se toca.

### P7 — Tailwind JIT-safe (G3)
NUNCA template literals en class strings. Esta story casi no toca classes (reusa EmptyState), pero si algún `cn()` se toca, usar literals completas.

### P8 — Fixture anti-burbuja base.ts (DoD #37)
```ts
// e2e/fixtures/base.ts — extiende auth.fixture (Clerk token) + collectors
import { test as authTest, expect } from "../auth.fixture";
export const test = authTest.extend({
  page: async ({ page }, use) => {
    const pageErrors: Error[] = [];
    const consoleErrors: string[] = [];   // allowlist shrink-only
    const apiErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e));
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("response", (r) => { if (r.url().includes("/api/") && r.status() >= 400) apiErrors.push(`${r.status()} ${r.url()}`); });
    await use(page);
    expect(pageErrors, "JS uncaught (burbuja Next)").toHaveLength(0);
    expect(consoleErrors.filter(notAllowlisted), "React/hydration errors").toHaveLength(0);
    expect(apiErrors, "/api 4xx/5xx").toHaveLength(0);
    await expect(page.locator("nextjs-portal")).toHaveCount(0);  // overlay de error de Next ausente
  },
});
export { expect };
```
Specs autenticados importan de `fixtures/base.ts`, NUNCA de `@playwright/test`. (Patrón canónico de la rule #37 · referencia vitalia `e2e/fixtures/base.ts`.)

## Anti-patterns prohibidos (esta story)
- ❌ Diseñar/implementar cualquier hoja real (ICP, inbox, cartera, pauta…) — son R1..R5, FUERA DE SCOPE.
- ❌ Editar la maquinaria del shell (Ribbon/SubTabsBar/SubSubTabsBar/EmptyState/Layout/Luana/TopBar).
- ❌ Hardcodear slugs/subtabs fuera de `shell-routes.ts` (rompe el SSoT · arch test FAIL).
- ❌ Crear `features/{agent}/` (no hay contenido real que justifique un feature).
- ❌ Tocar `core/luana-core-*/` o cualquier otro brand (engine boundary).
- ❌ Template literals en class strings de Tailwind (G3).
- ❌ Voseo en labels/copy (neutro tuteo).
- ❌ Dejar un leaf N3 sin ruta `[subsubtab]/page.tsx` (→ 404 = isla · viola CONN).
- ❌ `vitest -u` / `--update-snapshots` mecánico en los tests de datos — actualizar revisando el diff (coverage_update).
- ❌ e2e que mockea el backend presentado como live-verify (falso verde · rule #37).

## Definition of Done (live · #37)
- `make dev-nicolify` levantado · localhost:3001 con shell.
- Recorrer el menú v3 completo (Chrome MCP o demo manual): cada Ribbon tab → cada N2 → los 3 N3 → empty-state visible, Console limpia (0 rojos), sin overlay de Next.
- `dod_evidence` en checkpoint: combos navegados + observación (empty-state + console limpia + sin 404 en N3).
- `demo-script.md` (4 secciones · recorrer el menú) + `demo_signoff` de Chris (APPROVED) — gate `/pm-nicolify` Fase F.
