# Vitalia brand overlay — rules

Extiende `.claude/rules/` raíz Luana con rules brand-specific vitalia (Salud + Bienestar — clínicas médicas/dentales/estéticas, HIPAA-lite).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific viven aquí y se cargan cuando trabajés en `vitalia/` workdir.
- Ambos sets aplican simultáneamente cuando edites archivos bajo `vitalia/`.

| Rule | Descripción |
|---|---|
| `hipaa-lite.md` | Salvaguardas defensivas PHI: dual filter tenant+clinic, audit log obligatorio, encryption at-rest+in-transit, retention 10y, RBAC strict roles médicos, sanitization en traces, voice patterns sales_agent para canales no-encriptados |
| `shell-mockup-per-component.md` | **Storybook-first (ex mockup-per-component · SUPERSEDED 2026-06-22 · HB-104):** el diseño/build parte de **Storybook** (`@luana/ui-kit` = SSoT visual, canon §5); net-new se PROPONE + PROMUEVE al kit + story (vía `/pm-luana`). El viejo modelo `_shared.css`/mockup-HTML por-componente + `ratified_visual_by_chris` quedó MUERTO (registro histórico). La firma de Chris (`mockup_final_signed`) sigue viva sobre el mockup compuesto de Storybook. Doctrina binding: `.claude/rules/frontend-visual-fidelity.md § Storybook`. ADR (superseded): `vitalia/docs/architecture/ADR-vitalia-003-shell-mockup-per-component-protocol.md` |
| `shell-feature-architecture-mandatory.md` | Gate bloqueante transversal Fase 2: toda story sub-tab debe citar `architecture_pattern: ADR-vitalia-004` en frontmatter `01-spec.md` + `03-arch.md` + `checkpoint.md`. Patrón único de 9 secciones (route group + FSD-Lite + Server-First + React Query + Zustand + RHF/Zod + DDD `PhiRepositoryBase` + migrations idempotent + `growth_studio_event` + tests 4 capas). Sin cita: `/architect` REFUSE arrancar. SSoT: `vitalia/docs/architecture/ADR-vitalia-004-shell-feature-architecture.md` |

**Naming:** `{topic}.md` (ej. `hipaa-lite.md`).
