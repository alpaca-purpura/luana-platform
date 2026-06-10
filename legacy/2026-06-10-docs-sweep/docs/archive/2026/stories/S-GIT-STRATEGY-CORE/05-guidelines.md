---
story_id: S-GIT-STRATEGY-CORE
surface: INFRA
generated_by: /architect
last_modified: 2026-05-15T00:00:00Z
---

# 05-guidelines.md — S-GIT-STRATEGY-CORE

Patterns obligatorios y prohibidos para `/dev-team` al implementar los 9 tickets de esta story. Cargar este archivo junto con las rules listadas en "Skills y rules a cargar".

---

## Patterns required

### Commits y git workflow

- **Conventional Commits** format obligatorio en todos los commits de esta story: `<type>(<scope>): <desc>`. Types válidos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
- **Stage por nombre exacto** — `git add <filename>`. Nunca `git add .` / `-A` / `-u`.
- Commits atómicos por ticket: T-1 → 1 commit por `.claude/rules/git-safety.md`, no mezclar con T-2 (parallel-safety) en el mismo commit.
- Haiku delegation pattern para commit+push multi-file (`.claude/rules/git-haiku-delegation.md`).

### Naming y estructura de workflows YAML

- **kebab-case** en nombres de archivo: `ci-wip.yml`, `cd-staging.yml`, `cd-prod.yml`, `cleanup-wip.yml`. Nunca camelCase (`ciWip.yml`) ni snake_case (`ci_wip.yml`).
- **`name:` descriptivo en inglés** para cada job y step (no dejar steps sin nombre).
- **`timeout-minutes:`** en cada job — valores recomendados: ci-wip jobs ≤5, ci.yml jobs ≤15, cd jobs ≤20, cleanup ≤10.
- **`permissions:` block mínimo** por job (least-privilege). Ver tabla referencia:

| Workflow | Job | Permissions recomendados |
|---|---|---|
| ci-wip.yml | todos | `contents: read` |
| ci.yml | todos | `contents: read` |
| cd-staging.yml | deploy-staging | `contents: read` |
| cd-prod.yml | parse-release, detect-changes | `contents: read` |
| cd-prod.yml | deploy-brand-prod | `contents: read` (secretos vía environment) |
| cleanup-wip.yml | cleanup-wip-branches | `contents: write` (necesario para `gh api` delete branch) |

### Actions pinning y versiones

- `actions/checkout@v4` — versión pinada (NO `@main`, `@latest`, `@v3`).
- `astral-sh/setup-uv@v5` — versión pinada.
- `pnpm/action-setup@v4` — versión pinada.
- `actions/setup-node@v4` con `node-version: 20` (LTS, consistente con workspace).
- `dorny/paths-filter@v3` — versión pinada.

### Reusable workflows (anti-duplication)

- Jobs que se repiten en 2+ workflows → extraer a `.github/workflows/_reusable-*.yml` con trigger `workflow_call`.
- Ejemplo: el job `python-lint` de `ci.yml` y `ci-wip.yml` puede compartir un `_reusable-python-lint.yml` si la implementación es idéntica.
- Nota: el workflow `_deploy-brand.yml` reusable completo viene en `S-CICD-DEPLOY T-2`. En esta story, `cd-prod.yml` puede invocar el script de deploy directamente (placeholder) hasta que ese reusable exista.

### Detección selectiva con dorny/paths-filter

- En `cd-prod.yml`, el filtro de paths debe cubrir todas las brands conocidas actualmente: nicolify, vitalia, comunify, lupulo, core (para luana-core-* packages).
- El filtro puede ser estático (YAML con brands listadas) — no necesita ser dinámico en esta story.
- La brand parseada del branch name se usa como key del filtro para determinar si esa brand tiene cambios.

### GitHub Environments

- Crear environment `staging` para `cd-staging.yml` (con o sin aprobación manual — configurable en repo Settings).
- Crear environments `prod-{brand}` para cada brand en `cd-prod.yml` (con required reviewers = Chris para prod).
- Los secrets `STAGING_HOST`, `STAGING_SSH_KEY`, `PROD_HOST`, `PROD_SSH_KEY` son environment-scoped (no repo-level).
- El workflow debe funcionar en "placeholder mode" cuando los secrets están vacíos (log `::notice::` + `exit 0`).

### Rule Markdown — formato canónico

- Frontmatter YAML en cada rule reescrita con `globs:` y `description:`:
  ```yaml
  ---
  globs: "**/*"
  description: "<Una línea descriptiva del propósito de la rule>"
  ---
  ```
- Secciones con H2 (`##`) para cada política principal.
- Tablas para reglas M1-M11 en `parallel-safety.md` (formato existente preservado).
- Listas con `-` (no `*`) para items prohibidos.
- Bloques de código `bash` para comandos y ejemplos.

### Hook Bash — estilo y seguridad

- `set -euo pipefail` al inicio (ya presente — mantener).
- Funciones helper con nombres `_luana_<verb>_<noun>` para lógica reutilizable (ej: `_luana_detect_branch`, `_luana_gate_level`).
- Branch detection via `git symbolic-ref --short HEAD 2>/dev/null || echo 'HEAD-detached'` (robusto ante HEAD detached).
- Variables exportadas para secciones: `export GATE_LEVEL CURRENT_BRANCH`.
- Magic comment `# wip-fast` (o `# wip-fast: <reason>`) en primeras 5 líneas del staged file → skip secciones extra en `wip/*`.
  Regex: `grep -qE '^#\s*wip-fast(:|$)' "${FILE}"` (aplicar solo en primeras 5 líneas via `head -5`).

### Test Bash — test_pre_commit_hook.sh

- Usar patrón de stub via override de función o variable de entorno para mockear `git symbolic-ref`.
- Estructura: `test_<name>() { ... }` + runner al final que llama todas las funciones y reporta resultado.
- Exit 0 si todos los tests pasan, exit 1 si alguno falla (compatible con CI shell cmd).
- Cada test documenta qué verifica en comentario: `# Tests: hook detects wip/* as LIGHT gate`.

---

## Patterns forbidden

### Workflows

- **❌ Workflow sin `permissions:` block** — cada job MUST declarar sus permisos mínimos. Un job sin `permissions:` hereda los del workflow; un workflow sin `permissions:` hereda `GITHUB_TOKEN` con write a todos los scopes. Riesgo supply chain.
- **❌ `actions/*@main`, `@latest`, `@master`** — unpinned en producción. En desarrollo local OK si se quiere probar, pero NUNCA commit a main o release/*. Usar SHA pin para seguridad extra en prod-crítico (opcional para esta story, recomendado en S-CICD-DEPLOY).
- **❌ Hardcoded brand names en lógica de routing** — usar `dorny/paths-filter` o bash regex sobre el branch name para extraer la brand. No `if BRAND == "vitalia"` hardcoded en la lógica principal.
- **❌ Hook que bloquea push** — el hook es `pre-commit`, no `pre-push`. Ejecuta en el momento del commit, que es más granular y permite WIP commits frecuentes en `wip/*`. Nunca convertirlo en pre-push hook (perdería la diferenciación por branch en el momento del commit).
- **❌ Mezclar cd-staging.yml y cd-prod.yml en un solo workflow** — son triggers distintos (main vs release/*) con targets distintos y gates de aprobación distintos. Separados es más mantenible.
- **❌ Deploy prod desde main directamente** — prod SIEMPRE desde `release/{brand}-vX.Y.Z`. El flujo main → staging → release/* → prod es el gate de calidad. Cualquier shortcut es un bug de diseño.
- **❌ `workflow_run:` dependency entre ci.yml y cd-staging.yml en el mismo push** — el trigger `workflow_run` tiene delays y complejidad innecesaria. Si se quiere gate, usar `needs:` dentro del mismo workflow o accept que cd-staging corre en paralelo con ci (y falla si el deploy tiene errores propios). La estrategia de gate correcta viene en S-CICD-DEPLOY.

### Rules Markdown

- **❌ Mencionar `development` como única/principal rama de trabajo** — legacy removido. `main` es la rama de integración; `wip/*` son las ramas de trabajo diario.
- **❌ "WORKTREES PROHIBIDOS"** — texto literal del legacy que debe desaparecer de `parallel-safety.md`. El patrón correcto es worktrees requeridos con branch dedicado.
- **❌ Mencionar `git push origin development`** como comando canónico en `git-haiku-delegation.md` — debe generalizarse a los 3 destinos con lógica condicional.
- **❌ Duplicar contenido entre rules** — si una política ya está en `git-safety.md`, `parallel-safety.md` SOLO referencia con "ver git-safety.md § X". No copiar párrafos.

### Hook Bash

- **❌ `--no-verify` como escape** — el hook nunca debe sugerir esto. Las secciones wip/* light ya son la válvula de escape para iteración veloz. `--no-verify` está prohibido por `git-safety.md`.
- **❌ Magic comment `# wip-fast` en branches `main` o `release/*`** — la lógica wip-fast solo activa cuando `GATE_LEVEL=light` (que solo aplica a `wip/*`). En main/release/*, el GATE_LEVEL es siempre `full` y la rama de código wip-fast es unreachable.
- **❌ Modificar la lógica interna de las 9 secciones existentes** — el refactor T-9 solo agrega branch detection + envuelve secciones en condicionales. Las 9 secciones son funcionales y tienen tests. Modificarlas está fuera de scope.
- **❌ `set +e` dentro de secciones** — si una sección necesita manejar errores sin salir, usar `if ! <cmd>; then` en lugar de deshabilitar el modo errexit globalmente.

---

## Files in scope por ticket

| Ticket | Files | Operación |
|---|---|---|
| T-1 | `.claude/rules/git-safety.md` | REWRITE completo |
| T-2 | `.claude/rules/parallel-safety.md` | REWRITE completo |
| T-3 | `.claude/rules/git-haiku-delegation.md` | UPDATE (generalizar 3 destinos, mantener resto) |
| T-4 | `.github/workflows/ci.yml` | REWRITE (de placeholder a full gates) |
| T-5 | `.github/workflows/ci-wip.yml` | NEW |
| T-6 | `.github/workflows/cd-staging.yml` | NEW |
| T-7 | `.github/workflows/cd-prod.yml` | NEW |
| T-8 | `.github/workflows/cleanup-wip.yml` | NEW |
| T-9 | `scripts/git-hooks/pre-commit` | REFACTOR (agregar branch detection, preservar secciones) |
| T-9 | `scripts/tests/test_pre_commit_hook.sh` | NEW (tests bash — TDD primero) |

Files explícitamente OUT OF SCOPE (no tocar):

- `.github/workflows/release.yml` — preservar intacto
- `backend/src/**` — no hay cambios Python de producción
- `frontend/src/**` — no hay cambios TypeScript de producción
- Cualquier `*/docs/product/**` brand-specific — es infra transversal, no brand-specific

---

## Skills y rules a cargar para /dev-team

**Obligatorio cargar antes de iniciar cualquier ticket:**

| Rule/Skill | Por qué |
|---|---|
| `.claude/rules/anti-default-flip-audit.md` | Los cambios en triggers de workflows son análogos a "flag flips" — deben auditarse tests que dependan del trigger anterior (T-4: ci.yml rewrite cambia qué gates corren en main) |
| `.claude/rules/anti-duplication.md` | Reusable workflows para evitar copiar-pegar jobs entre workflows (T-4, T-5 pueden compartir jobs via workflow_call) |
| `.claude/rules/git-safety.md` | Irónicamente, la regla que estás reescribiendo (T-1) aplica a TU propio commit mientras la escribes. Stage por nombre, no --no-verify, conventional commits. |
| `.claude/rules/parallel-safety.md` | Multi-sesión safety durante el build de esta story |
| `.claude/rules/tdd-mandatory.md` | Tests bash del hook (T-9) deben escribirse ANTES del refactor. RED → GREEN → REFACTOR. |
| `.claude/rules/git-haiku-delegation.md` | Delegación a Haiku para commits multi-file (todos los tickets tienen >1 file) |

**Cargar según ticket específico:**

| Ticket | Rule adicional |
|---|---|
| T-9 (hook) | `.claude/rules/hotfix-repro-mandatory.md` si se detecta regresión en secciones 1-9 existentes durante el refactor |
| T-4, T-5, T-6, T-7, T-8 (workflows) | Documentación de `dorny/paths-filter@v3` (tessl tile si disponible, docs oficial si no) |

---

## Secuencia de ejecución recomendada

Los tickets de esta story tienen dos grupos independientes que pueden ejecutarse en paralelo con worktrees dedicados:

**Grupo A — Rules Markdown (T-1, T-2, T-3):** Rápidos (1h c/u), documentación pura. Después de implementar los workflows (T-4..T-9), actualizar las references en T-1/T-2/T-3 para citar los workflows nuevos.

**Grupo B — Workflows + Hook (T-4, T-5, T-6, T-7, T-8, T-9):** Código ejecutable. Orden recomendado dentro del grupo:
1. T-9 (hook): primero — TDD obligatorio, tests bash antes del refactor
2. T-4 (ci.yml rewrite): siguiente — base del CI full que los demás workflows dependen conceptualmente
3. T-5 (ci-wip.yml): independiente de T-4 pero mejor después para ver el contraste
4. T-6 (cd-staging.yml): independiente, placeholder mode
5. T-7 (cd-prod.yml): el más complejo, last
6. T-8 (cleanup-wip.yml): independiente, cron simple

Secuencia final recomendada si ejecutar serial: T-9 → T-4 → T-5 → T-6 → T-7 → T-8 → T-1 → T-2 → T-3.
