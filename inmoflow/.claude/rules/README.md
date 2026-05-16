# InmoFlow brand overlay — rules

Extiende `.claude/rules/` raíz Luana con rules brand-specific inmoflow (Real Estate (Inmobiliaria) — brokers, agencias bienes raíces).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific viven aquí y se cargan cuando trabajés en `inmoflow/` workdir.
- Ambos sets aplican simultáneamente cuando edites archivos bajo `inmoflow/`.

| Rule | Descripción |
|---|---|
| `portales-sync-and-lead-routing.md` | Sync bidireccional portales inmobiliarios (MercadoLibre/ZonaProp/Idealista), lead routing determinístico por zona+especialización, calculadoras hipotecarias con tasas DB (nunca hardcoded) |

**Naming:** `{topic}.md` (ej. `portales-sync-and-lead-routing.md`).
