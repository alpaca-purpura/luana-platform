# Vitalia brand overlay — rules

Extiende `.claude/rules/` raíz Luana con rules brand-specific vitalia (Salud + Bienestar — clínicas médicas/dentales/estéticas, HIPAA-lite).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific viven aquí y se cargan cuando trabajés en `vitalia/` workdir.
- Ambos sets aplican simultáneamente cuando edites archivos bajo `vitalia/`.

| Rule | Descripción |
|---|---|
| `hipaa-lite.md` | Salvaguardas defensivas PHI: dual filter tenant+clinic, audit log obligatorio, encryption at-rest+in-transit, retention 10y, RBAC strict roles médicos, sanitization en traces, voice patterns sales_agent para canales no-encriptados |
| `shell-mockup-per-component.md` | Protocolo bloqueante pre-`/architect`: cada story Vitalia Fase 1+2 que construye componente UI shell-organism debe producir mockup HTML por-componente en `{story-id}/mockups/` ratificado por Chris ANTES de transition `refining → refined`. F1-S0 exenta (infra-only). SSoT: `vitalia/docs/architecture/ADR-vitalia-003-shell-mockup-per-component-protocol.md` |
| `shell-feature-architecture-mandatory.md` | Gate bloqueante transversal Fase 2: toda story sub-tab debe citar `architecture_pattern: ADR-vitalia-004` en frontmatter `01-spec.md` + `03-arch.md` + `checkpoint.md`. Patrón único de 9 secciones (route group + FSD-Lite + Server-First + React Query + Zustand + RHF/Zod + DDD `PhiRepositoryBase` + migrations idempotent + `growth_studio_event` + tests 4 capas). Sin cita: `/architect` REFUSE arrancar. SSoT: `vitalia/docs/architecture/ADR-vitalia-004-shell-feature-architecture.md` |

**Naming:** `{topic}.md` (ej. `hipaa-lite.md`).
