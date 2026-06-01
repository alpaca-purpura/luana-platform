# Frontend Visual Fidelity (átomos/moléculas + mockup adherence + scope discipline)


> **Slim stub (context-rot pass 2026-05-30).** Cuerpo operativo completo en `.claude/skills/frontend-expert/references/visual-fidelity.md` — carga on-demand cuando `frontend-expert` / `builder-frontend` / `auditor-frontend` se activan. **Origen:** sesión 2026-05-28. **Cement-date:** 2026-05-28.

## Regla cardinal

El FE construido debe cumplir tres disciplinas (una verificación vía Playwright + auditor):

- **D1 — Design system first:** reutilizar átomos Shadcn (`components/ui/`) → tokens `@luana/design-tokens` → moléculas compartidas (`components/shared/`) → solo si nada sirve, crear en `features/{m}/components/` CON átomos. NUNCA reinventar una primitiva existente.
- **D2 — Mockup adherence:** parecerse al mockup en jerarquía visual, layout, estados (default/hover/loading/empty/error/success) y microcopy. Fidelidad = "un humano reconoce que es la misma pantalla", no pixel-perfect.
- **D3 — Scope discipline:** implementar SOLO lo que scopean los scenarios de `01-spec.md` + deliverables del ticket. Lo demás del mockup NO se construye en esta story.

## Cuándo carga el detalle

- `builder-frontend` arranca un ticket FE → leer D1/D2/D3 completos + gate pre-crear componente (bash snippet) + patrón Playwright scoped.
- `auditor-frontend` abre categoría Visual fidelity → leer enforcement layers + checklist 6 puntos.
- `/architect` FE declara `04-validators § playwright_visual_scope` → leer D3 + schema `story_scope_routes`/`story_scope_components`/`out_of_mockup_scope`.

## Anti-patterns (top 3 — lista completa en el detalle)

- ❌ Reinventar un átomo Shadcn que ya existe en `components/ui/`
- ❌ Implementar TODO el mockup cuando la historia scopea solo una parte (scope creep)
- ❌ `toHaveScreenshot()` de página completa fuera del scope de la historia (frágil)

## Referencias

- `.claude/skills/frontend-expert/references/visual-fidelity.md` — **cuerpo operativo completo** (D1/D2/D3 detallados, gate bash, patrón Playwright, auditor checklist, enforcement layers)
- `.claude/rules/frontend-fsd.md` — boundaries FSD-Lite + design system layers
- `.claude/rules/frontend-quality.md` — gates (tsc/eslint/vitest/jscpd)
- `.claude/rules/architect-autonomous-mode.md § playwright_visual_scope` — disciplina de scope visual
- `.claude/rules/spanish-text.md` — microcopy neutro
- `.claude/rules/anti-orphan-integration.md` — el componente debe estar enchufado (nav/route)
- `core/@luana/design-tokens` — tokens cross-brand
