# Lupulo brand overlay — rules

Extiende `.claude/rules/` raíz Luana con rules brand-specific lupulo (Gastronomía — restaurantes, bares, cafeterías).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific viven aquí y se cargan cuando trabajés en `lupulo/` workdir.
- Ambos sets aplican simultáneamente cuando edites archivos bajo `lupulo/`.

| Rule | Descripción |
|---|---|
| `kds-integration.md` | Integración bidireccional POS/KDS (Toast/Square/Clover/Fudo) con adapter contract, reservation lifecycle idempotente, menu sync POS-wins con checksum, kitchen event stream obligatorio via outbox, availability check pre-reservation, photo upload con EXIF strip |

**Naming:** `{topic}.md` (ej. `kds-integration.md`).
