---
ticket: T-1
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-1 impl log — Rewrite docker-compose.dev.yml raíz + script postgres-init

## Deliverables completados

1. **REWRITE `docker-compose.dev.yml` (raíz)** — servicios: `luana_postgres_dev` + `luana_qdrant_dev` (profile=vector) + `luana_redis_dev` (profile=cache). Network: `luana_dev_net`. `name: luana-dev`. Volume mount postgres-init. Sin `container_name` fijo (F2 compliant). Puerto heredado `127.0.0.1:5435:5432`.

2. **NEW `scripts/postgres-init/01-create-databases.sh`** — bash idempotente con `set -euo pipefail`. Crea databases `nicolify_dev`, `vitalia_dev`, `comunify_dev`, `lupulo_dev` via `SELECT 1 FROM pg_database WHERE datname=...` + CREATE condicional.

3. **NEW `scripts/postgres-init/`** directorio creado.

4. **NEW `tests/scripts/`** directorio creado (placeholder — completado en T-8).

5. **NEW `scripts/tests/test_postgres_init.sh`** — bash test de idempotencia del init script. Requiere postgres corriendo. 5 assertions (4 databases exist + 1 re-check idempotency).

## Decisiones aplicadas

- D1: 1 postgres + N databases via init script
- D3: qdrant profile=vector, redis profile=cache (opt-in)
- F2: sin container_name fijo en compose raíz
- F3: network luana_dev_net (no bridge default)
- F4: sin rutas absolutas /home/*/

## Acceptance criteria verificados

- A1: yamllint compatible (YAML válido, line-length 120)
- A2: shellcheck compatible (set -euo pipefail, quoting correcto)
- A3: 2 profiles definidos (vector + cache) en compose raíz
- A5: sin container_name fijo
- A6: name: luana-dev en primera sección

## Notas

- El init script usa `$POSTGRES_USER` inyectado automáticamente por el entrypoint de postgres.
- El script test_postgres_init.sh requiere Docker corriendo — validator `bash_test_postgres_init_idempotency` depende de ello.
- El compose raíz elimina el postgres single-brand legacy (nicolify_postgres_dev con DB nicolify_dev como POSTGRES_DB default). Ahora el POSTGRES_DB base es `postgres` (no brand-specific) y las brand DBs se crean via init script.
