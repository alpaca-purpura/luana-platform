# Nicolify brand overlay — rules

Extiende `.claude/rules/` raíz Luana con rules brand-specific nicolify (Agencias + Servicios B2B — agencias marketing, software boutique, consultoras).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific viven aquí y se cargan cuando trabajés en `nicolify/` workdir.
- Ambos sets aplican simultáneamente cuando edites archivos bajo `nicolify/`.

| Rule | Descripción |
|---|---|
| `b2b-billable-hours.md` | Integridad financiera time tracking→invoice (sum equality), currency policy preservando client.currency en invoice, proposal+contract lifecycle con audit, client portal con auth Clerk separada y dual filter tenant+client, CRM enterprise multi-stage forecast |

**Naming:** `{topic}.md` (ej. `b2b-billable-hours.md`).
