# Comunify brand overlay — rules

Extiende `.claude/rules/` raíz Luana con rules brand-specific comunify (Creator Economy + Educación — coaches, creators, infoproductores, cohort-based).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific viven aquí y se cargan cuando trabajés en `comunify/` workdir.
- Ambos sets aplican simultáneamente cuando edites archivos bajo `comunify/`.

| Rule | Descripción |
|---|---|
| `creator-funnels.md` | Integridad funnel ladder (lead_magnet→continuity), dual filter tenant+cohort en community engine, authority vault con attribution+consent, voice cloning sales_agent con consent stored, cohort lifecycle state machine, moderation pipeline |

**Naming:** `{topic}.md` (ej. `creator-funnels.md`).
