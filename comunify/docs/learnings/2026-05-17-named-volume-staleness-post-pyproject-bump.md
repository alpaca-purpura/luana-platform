---
brand: comunify
date: 2026-05-17
slug: named-volume-staleness-post-pyproject-bump
promotable: yes                           # pattern aplica cross-brand (vitalia, nicolify, lupulo, futuras)
applies_to_other_brands_potentially: [vitalia, nicolify, lupulo, saasora, inmoflow, retailly, fixia, guestly, fitflow]
target_core_package: scripts/postgres-init  # no aplica a package — es addendum a docs/process/docker-dev-multibrand.md
---

# Named volume staleness post `{brand}/pyproject.toml` bump

**Qué aprendimos:** Docker `compose up -d --build` repobla un named volume desde el image's filesystem **sólo si el volumen está vacío al primer mount**. Si el volumen ya tenía data (sesión previa) y luego se rebuildea la image con dependencies nuevas, el volumen NO se repobla automáticamente — el `.venv` viejo queda enmascarando el nuevo.

Síntoma crash típico: `ModuleNotFoundError: No module named '<dep_recién_agregada>'` durante alembic upgrade (o cualquier `uv run`) aunque la image rebuildeada SÍ tenga la dep correctamente instalada.

**Origen:** `comunify-dev-stack-functional` repro 2026-05-17T19:45. `comunify_backend_venv` se había creado en sesión previa cuando `comunify/pyproject.toml::dependencies = []`. Tras agregar los 13 deps runtime (bug 9 fix), `make dev-comunify` mantuvo el venv stale → backend crash loop `ModuleNotFoundError: No module named 'psycopg2'` (psycopg2-binary llega transitivo desde `luana-core-platform`, no estaba en venv viejo).

**Why:** comportamiento documentado de Docker — `tmpfs` y anonymous volumes se repoblan en cada start; named volumes con data persistente NO. Es feature (proteger data persistente como DBs), no bug — pero aplica a TODOS los named volumes, incluyendo `.venv` que NO es data persistente sino derivado de pyproject.toml.

**How to apply:** cada vez que modifiques `{brand}/pyproject.toml` post primer `make dev-{brand}` exitoso, SIEMPRE recreá el volumen específico del brand:

```bash
BRAND=comunify  # o vitalia, nicolify, lupulo
docker compose -f docker-compose.dev.yml -f ${BRAND}/docker-compose.dev.yml stop ${BRAND}_backend_dev
docker compose -f docker-compose.dev.yml -f ${BRAND}/docker-compose.dev.yml rm -fsv ${BRAND}_backend_dev
docker volume rm ${BRAND}_backend_venv
docker compose -f docker-compose.dev.yml -f ${BRAND}/docker-compose.dev.yml up -d --build ${BRAND}_backend_dev
```

**NO** uses `make dev-clean-{brand}` — su `docker compose down -v` nukea volumen postgres compartido (`luana_postgres_dev_data`) impactando sesiones paralelas de otras brands.

**Candidato addendum receta:** `docs/process/docker-dev-multibrand.md` debe agregar sección "Re-poblar venv post pyproject bump" + opcionalmente nuevo Makefile target `make dev-rebuild-{brand}-venv` que encapsule el flujo (TBD `/pm-luana` evalúa).

**Vínculos:**
- `[[playwright-runner-parity-gap]]` — bug 15 descubierto en misma sesión (mismo cluster de bootstrap gaps)
- Receta canónica vitalia: `vitalia/docs/archive/2026/stories/vitalia-dev-stack-functional/07-merge.md` (12 pasos)
- Merge artifact: `comunify/docs/archive/2026/stories/comunify-dev-stack-functional/07-merge.md` § bug 14
