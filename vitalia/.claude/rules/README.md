# Vitalia — rules overlay

Rules brand-specific que extienden `.claude/rules/` core (raíz del workspace).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific (ej. HIPAA-lite vitalia, creator-economy patterns comunify) viven aquí.
- Cuando trabajés en `vitalia/` workdir, ambos sets aplican.

**Naming:** `{topic}.md` (ej. `hipaa-lite.md`, `creator-economy-funnels.md`).
