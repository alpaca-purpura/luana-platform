# Vitalia brand overlay — rules

Extiende `.claude/rules/` raíz Luana con rules brand-specific vitalia (Salud + Bienestar — clínicas médicas/dentales/estéticas, HIPAA-lite).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific viven aquí y se cargan cuando trabajés en `vitalia/` workdir.
- Ambos sets aplican simultáneamente cuando edites archivos bajo `vitalia/`.

| Rule | Descripción |
|---|---|
| `hipaa-lite.md` | Salvaguardas defensivas PHI: dual filter tenant+clinic, audit log obligatorio, encryption at-rest+in-transit, retention 10y, RBAC strict roles médicos, sanitization en traces, voice patterns sales_agent para canales no-encriptados |

**Naming:** `{topic}.md` (ej. `hipaa-lite.md`).
