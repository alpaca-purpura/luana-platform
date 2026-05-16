---
story_id: S-DOCKER-DEV-MULTIBRAND
type: service-story
module: infra
capability: dev-environment-multibrand
po_version: 1
last_modified: 2026-05-15T00:00:00Z
ratified_by_chris: true
decisions:
  D1: "1 postgres shared + N databases via init script idempotente"
  D2: "Brand-autocontenida: {brand}/docker-compose.dev.yml per brand"
  D3: "Qdrant + Redis opt-in profiles (no all-on por default)"
  D4: "Hot-reload monorepo via bind mount source + anonymous volume .venv + uv editable workspace"
  D5: "Cloudflared tunnel opt-in profile per brand para tests OAuth/Clerk/webhooks"
  D6: "Port allocation cementada: nicolify=8001/3001, vitalia=8002/3002, comunify=8003/3003, lupulo=8004/3004"
links:
  outcome: "../../outcomes/docker-dev-multibrand.md"
  outcome_platform: "../../outcomes/infra-dev-multibrand.md"
  checkpoint: "./checkpoint.md"
---

# S-DOCKER-DEV-MULTIBRAND — Docker dev local multimarca brand-autocontenida

## Resumen ejecutivo

Se construye la infraestructura Docker de desarrollo local para las 4 brands activas (nicolify, vitalia, comunify, lupulo) del monorepo luana-platform. Actualmente el entorno legacy tiene un solo `docker-compose.dev.yml` raíz con un único postgres single-brand (nicolify), sin soporte para las demás brands. El resultado es un sistema donde cada brand es autocontenida (`{brand}/docker-compose.dev.yml`) y comparte únicamente el postgres raíz (1 instancia, N databases). Un Makefile raíz expone targets ergonómicos (`make dev-vitalia`, `make dev-vitalia-tunnel`, `make dev-all`, etc.). El script `generate_infra_matrix.py` auto-genera `docs/portfolio/INFRA-MATRIX.md` desde los `{brand}/config/brand.yaml::infra` como índice cross-brand. Esto desbloquea el desarrollo paralelo de brands en local sin colisiones de puertos ni bases de datos.

## Acceptance Criteria (Gherkin AI-resistant)

### Scenario 1 — `happy-dev-vitalia` (`type: happy`)

**Given:**
- El monorepo `/home/chalreme/Proyectos/luana-platform/` está presente con código actual
- Docker está corriendo y el usuario pertenece al grupo `docker`
- No existe ningún contenedor `luana_*` activo previo
- El archivo `vitalia/.env.dev` existe (copiado desde `vitalia/.env.dev.template`) con valores válidos
- `vitalia/config/brand.yaml` contiene la sección `infra.dev` con `backend_port: 8002`, `frontend_port: 3002`, `database_name: vitalia_dev`

**When:**
- El usuario ejecuta `make dev-vitalia` desde la raíz del monorepo

**Then:**
- El servicio `luana_postgres_dev` levanta en `127.0.0.1:5435` con healthcheck verde (`pg_isready`) en menos de 30 segundos
- El script `scripts/postgres-init/01-create-databases.sh` se ejecuta automáticamente y la base de datos `vitalia_dev` existe en postgres (verificable con `psql -h 127.0.0.1 -p 5435 -U postgres -c "\l" | grep vitalia_dev`)
- El contenedor `vitalia_backend_dev` está corriendo y responde `HTTP 200` en `http://127.0.0.1:8002/health` dentro de los 90 segundos del cold start
- El contenedor `vitalia_frontend_dev` está corriendo y responde en `http://127.0.0.1:3002`
- Los servicios qdrant y redis NO están levantados (profiles opt-in, no activados en `make dev-vitalia` base)
- El total de tiempo desde `make dev-vitalia` hasta `curl http://127.0.0.1:8002/health` retorna 200 es menor a 90 segundos (cold start completo)

**Graders:**
- Integration test — `tests/scripts/test_docker_dev_integration.py::test_happy_dev_vitalia`
- Bash verify — `curl -sf http://127.0.0.1:8002/health | jq '.status == "ok"'`

---

### Scenario 2 — `happy-dev-vitalia-tunnel` (`type: happy`)

**Given:**
- `make dev-vitalia` ha completado exitosamente (vitalia backend + frontend up)
- `vitalia/config/brand.yaml::infra.dev.cloudflared_tunnel` contiene `vitalia-dev`
- El binario `cloudflared` está disponible en la imagen o el host tiene credenciales de tunnel configuradas en `vitalia/.env.dev`

**When:**
- El usuario ejecuta `make dev-vitalia-tunnel` desde la raíz del monorepo

**Then:**
- El contenedor `vitalia_cloudflared_dev` levanta (profile=tunnel activado)
- El log del contenedor cloudflared muestra `Registered tunnel connection` dentro de 60 segundos
- Los containers backend + frontend de vitalia siguen corriendo sin interrupción
- Los containers de otras brands no son afectados

**Graders:**
- Integration test — `tests/scripts/test_docker_dev_integration.py::test_tunnel_profile_up`
- Docker verify — `docker ps --filter name=vitalia_cloudflared_dev --format "{{.Status}}" | grep -i "up"`

---

### Scenario 3 — `negative-db-mismatch-idempotent` (`type: negative`)

**Given:**
- El contenedor postgres `luana_postgres_dev` está corriendo
- La base de datos `vitalia_dev` ya existe en postgres con tablas previas (schema no vacío)
- El script `scripts/postgres-init/01-create-databases.sh` se ejecuta nuevamente (simulando un `make dev-vitalia` en un entorno ya inicializado)

**When:**
- El script `scripts/postgres-init/01-create-databases.sh` se ejecuta contra el postgres ya inicializado con `vitalia_dev` existente

**Then:**
- El script termina con exit code 0 (sin error)
- La base de datos `vitalia_dev` sigue existente con sus tablas intactas (sin DROP ni recreación)
- No aparece ningún error en stderr del script
- El script imprime un mensaje legible del tipo `Database vitalia_dev already exists, skipping creation`
- Las demás databases (nicolify_dev, comunify_dev, lupulo_dev) no son afectadas

**Graders:**
- Bash test — `tests/scripts/test_postgres_init.sh::test_idempotency_existing_db`
- Integration test — `tests/scripts/test_docker_dev_integration.py::test_init_script_idempotent`

---

### Scenario 4 — `edge-2brands-parallel-no-port-collision` (`type: edge`)

**Given:**
- El monorepo está presente con `vitalia/.env.dev` y `comunify/.env.dev` configurados
- Ningún proceso ocupa los puertos 8002, 8003, 3002, 3003 en el host
- Docker está corriendo con recursos suficientes (mínimo 4GB RAM disponibles)

**When:**
- El usuario ejecuta `make dev-vitalia` y luego `make dev-comunify` (ambos activos simultáneamente)

**Then:**
- `vitalia_backend_dev` responde HTTP 200 en `http://127.0.0.1:8002/health`
- `vitalia_frontend_dev` responde en `http://127.0.0.1:3002`
- `comunify_backend_dev` responde HTTP 200 en `http://127.0.0.1:8003/health`
- `comunify_frontend_dev` responde en `http://127.0.0.1:3003`
- Ningún contenedor de vitalia y comunify comparte nombre (Docker auto-names distintos)
- Ambas brands comparten el mismo `luana_postgres_dev` sin conflicto
- `make dev-down-vitalia` detiene solo los contenedores de vitalia sin tocar comunify

**Graders:**
- Integration test — `tests/scripts/test_docker_dev_integration.py::test_two_brands_parallel`
- Port verify — `ss -tlnp | grep -E "8002|8003|3002|3003"`

---

### Scenario 5 — `edge-hot-reload-core-change` (`type: edge`)

**Given:**
- `make dev-vitalia` está corriendo con `vitalia_backend_dev` up
- El backend de vitalia tiene configurado bind mount del source monorepo (`$PWD:/workspace`) con anonymous volume en `.venv`
- El archivo `core/luana-core-platform/src/luana_core_platform/version.py` existe

**When:**
- Se modifica el archivo `core/luana-core-platform/src/luana_core_platform/version.py` en el host (operación touch o edición de contenido)

**Then:**
- El servidor uvicorn dentro del contenedor `vitalia_backend_dev` detecta el cambio de archivo dentro de los 2 segundos
- Uvicorn reinicia el proceso de aplicación (log: `Restarting...` o equivalente)
- El contenedor NO necesita reconstruirse (`docker compose build`)
- Después del reload, `http://127.0.0.1:8002/health` sigue respondiendo HTTP 200

**Graders:**
- Integration test — `tests/scripts/test_docker_dev_integration.py::test_hot_reload_core_change`
- Timing verify — reload event detectado en log dentro de 2s post-touch

---

### Scenario 6 — `adversarial-db-isolation-drop` (`type: adversarial`)

**Given:**
- `make dev-vitalia` y `make dev-comunify` están corriendo simultáneamente
- Ambas brands tienen datos en sus respectivas databases (`vitalia_dev` y `comunify_dev`)
- El usuario tiene acceso psql al postgres compartido via `127.0.0.1:5435`

**When:**
- Se ejecuta `psql -h 127.0.0.1 -p 5435 -U postgres -c "DROP DATABASE vitalia_dev;"` (simula acción adversarial accidental en DB de una brand)

**Then:**
- La operación DROP afecta únicamente `vitalia_dev`
- La base de datos `comunify_dev` sigue existente con todos sus datos intactos
- La base de datos `nicolify_dev` y `lupulo_dev` siguen existentes e intactas
- `comunify_backend_dev` sigue respondiendo HTTP 200 sin interrupción (no depende de vitalia_dev)
- La recuperación de vitalia es posible ejecutando `make dev-down-vitalia && make dev-vitalia` (recrea la DB via init script idempotente + re-corre migraciones)

**Graders:**
- Integration test — `tests/scripts/test_docker_dev_integration.py::test_db_isolation_after_drop`
- Verify — `psql ... -c "\l"` muestra comunify_dev/nicolify_dev/lupulo_dev intactas

---

### Scenario 7 — `happy-infra-matrix-generation` (`type: happy`)

**Given:**
- Las 4 brands activas tienen `{brand}/config/brand.yaml` con la sección `infra:` completa (dev + staging + prod)
- El script `scripts/generate_infra_matrix.py` está presente y ejecutable
- Python con pyyaml está disponible en el venv raíz

**When:**
- El usuario ejecuta `make infra-matrix` desde la raíz del monorepo

**Then:**
- El archivo `docs/portfolio/INFRA-MATRIX.md` es creado o actualizado
- El archivo contiene una tabla markdown con columnas: Brand, Backend port, Frontend port, DB name, Redis DB, Qdrant prefix, Dev domain, Prod domain
- Las 4 brands (nicolify, vitalia, comunify, lupulo) aparecen como filas con los valores correctos según sus `brand.yaml::infra`
- El archivo inicia con un header `<!-- AUTO-GENERATED via make infra-matrix — DO NOT EDIT MANUALLY -->` en la línea 1
- El script termina con exit code 0 y un mensaje `INFRA-MATRIX.md updated (4 brands)`
- El golden snapshot del test `test_generate_infra_matrix.py::test_golden_snapshot` pasa sin diff

**Graders:**
- Unit test — `tests/scripts/test_generate_infra_matrix.py::test_golden_snapshot`
- Bash verify — `head -1 docs/portfolio/INFRA-MATRIX.md | grep "AUTO-GENERATED"`

---

## Non-functional requirements

| Categoría | Requisito | Verificador |
|---|---|---|
| Cold start | `make dev-{brand}` completa en <90s (postgres ready + brand containers up) | integration test timing |
| Hot-reload | Cambio en archivo fuente detectado y reload iniciado en <2s | integration test file-watch |
| RAM máxima | `make dev-all` (4 brands simultáneas) <4GB RAM total Docker | `docker stats --no-stream` |
| Idempotencia | Init script ejecutado N veces produce mismo estado que 1 vez | bash test script |
| Port collision | Ningún conflicto de puertos entre brands al correr simultáneas | integration test paralelo |
| DB isolation | DROP de una DB no afecta otras brands | adversarial integration test |
| Shellcheck | Scripts bash sin errores shellcheck | CI non-functional validator |
| Compose valid | `docker compose config` parsea sin error para cada brand compose | CI non-functional validator |
| INFRA-MATRIX | `make infra-matrix` sin errores en <5s | unit test |
| .gitignore | `.env.dev` y `.env.prod` por brand NO commiteados | pre-commit check |

## Constraints técnicos heredados

- `.claude/rules/git-safety.md` — no `git add .`, no force push
- `.claude/rules/parallel-safety.md` — esta story puede ejecutarse en paralelo con S-CICD-DEPLOY siempre que usen worktrees distintos (post S-GIT-STRATEGY-CORE)
- `.claude/rules/anti-duplication.md` — Dockerfiles de vitalia/comunify/lupulo extienden patrón nicolify, no duplican
- `.claude/rules/backend-ddd.md` — los Dockerfiles de backend respetan la estructura `src/` del proyecto
- Docker Compose Profiles spec (docs.docker.com) — `--profile` para qdrant/redis/cloudflared opt-in
- uv workspace resolution — `uv sync` en raíz resuelve todos los `luana-core-*` packages; Dockerfiles deben respetar esta topología (no `cd {brand}/backend && uv sync`)
- Puerto postgres compartido: `127.0.0.1:5435:5432` (heredado del compose legacy, cementado)

## Cross-module impact

- **Lee de:** `{brand}/config/brand.yaml` (fuente de verdad de puertos, DB names, dominios)
- **Es leído por:** S-CICD-DEPLOY (los Dockerfiles producidos aquí son los que CI/CD construye para staging/prod)
- **Eventos emitidos:** ninguno (infra pura, no runtime domain events)
- **Eventos consumidos:** ninguno

## Open questions

- [x] ¿1 postgres o N? → **D1 ratificado:** 1 postgres + N databases (Chris 2026-05-15)
- [x] ¿Brand-autocontenida o compose raíz único? → **D2 ratificado:** `{brand}/docker-compose.dev.yml` per brand
- [x] ¿Qdrant/Redis siempre on? → **D3 ratificado:** opt-in profiles
- [x] ¿Hot-reload con venv bind mount? → **D4 ratificado:** bind mount source + anonymous volume .venv
- [x] ¿Cloudflared siempre? → **D5 ratificado:** opt-in profile per brand

## Próximo paso

`type=service-story` → skip UX → `/architect` directo (ready package completo producido en esta misma sesión)

## Changelog

- v1 2026-05-15 — /po + /architect producen 01-spec.md (decisions D1-D6 ratificados por Chris, state refining→ready en sesión única)
