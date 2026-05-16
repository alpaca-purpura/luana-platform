---
story_id: S-GIT-STRATEGY-CORE
surface: INFRA
sub_architect: /architect (unified — surface única, no split BE/FE/AGENTIC)
arch_version: 1
last_modified: 2026-05-15T00:00:00Z
links:
  spec: "01-spec.md"
  outcome: "../../outcomes/git-strategy-revised.md"
  rules:
    - ".claude/rules/git-safety.md"
    - ".claude/rules/parallel-safety.md"
    - ".claude/rules/git-haiku-delegation.md"
    - ".claude/rules/anti-default-flip-audit.md"
    - ".claude/rules/anti-duplication.md"
    - ".claude/rules/tdd-mandatory.md"
---

## Decisión arquitectónica clave

La plataforma luana-platform opera en un contexto de multi-sesión Claude paralela en WSL2, donde el patrón legacy "único branch `development`, mismo workdir, sin worktrees" creó dos clases de riesgo: (1) WIP no-commiteado perdido cuando `git checkout` sobreescribe el filesystem compartido entre sesiones, y (2) política CI/CD binaria (desarrollo=nada, main=prod-auto) que contradice el flujo real (commits frecuentes a main para staging + releases explícitos para producción). La solución adopta **triple-branch policy** con **worktrees físicos dedicados por sesión** (git bloquea automáticamente dos worktrees en el mismo branch — colisión imposible por diseño) y **pre-commit hook dinámico** que calibra la pesadez de los checks al tipo de branch (iteración veloz en `wip/*`, calidad plena en `main`). Este cambio revoca el ban histórico de worktrees, que falló no por la tecnología sino porque se usaban sin branches dedicados; el patrón canónico 2026 (`git worktree add ../luana-X wip/X-slug`) es distinto y seguro.

---

## Surface diff — archivos afectados

### Files MODIFIED (T-1, T-2, T-3, T-4, T-9)

| Archivo | Ticket | Cambio |
|---|---|---|
| `.claude/rules/git-safety.md` | T-1 | REWRITE completo — 14 líneas legacy → ~80 líneas triple-branch policy |
| `.claude/rules/parallel-safety.md` | T-2 | REWRITE completo — "worktrees PROHIBIDOS" → worktrees requeridos por sesión, M1-M8 preservados + M9/M10/M11 nuevos |
| `.claude/rules/git-haiku-delegation.md` | T-3 | UPDATE — generalizar 3 destinos (main/wip/release) con guardrails distintos, eliminar hardcode `git push origin development` |
| `.github/workflows/ci.yml` | T-4 | REWRITE — de 57 líneas placeholder → full gates con arch-fitness + coverage check |
| `scripts/git-hooks/pre-commit` | T-9 | REFACTOR — agregar branch detection dinámico + switch case por tipo de branch |

### Files NEW (T-5, T-6, T-7, T-8)

| Archivo | Ticket | Propósito |
|---|---|---|
| `.github/workflows/ci-wip.yml` | T-5 | CI ligero para push a `wip/*` — lint targeted + tests targeted, sin arch-fitness ni coverage |
| `.github/workflows/cd-staging.yml` | T-6 | CD staging — trigger en push a `main`, deploy a cluster staging shared (server placeholder) |
| `.github/workflows/cd-prod.yml` | T-7 | CD producción — trigger en push a `release/*`, parse brand+version, selective deploy via dorny/paths-filter |
| `.github/workflows/cleanup-wip.yml` | T-8 | Cron semanal — lista y opcionalmente elimina branches `wip/*` sin commits >30d |

### Files PRESERVED (sin tocar)

| Archivo | Razón |
|---|---|
| `.github/workflows/release.yml` | Publish a GH Packages (Python/TS packages `luana-core-*`). Trigger en tags `v*.*.*`. Scope y propósito distintos al CD de brand apps. NO se modifica. |

---

## Skeletons YAML (para T-5, T-6, T-7, T-8)

Los skeletons definen estructura, triggers, jobs clave y variables de entorno. La implementación completa (secrets lookup, steps internos de deploy, error handling) es responsabilidad de `/dev-team` T-4 a T-8.

### ci-wip.yml — skeleton

```yaml
name: CI (WIP)

on:
  push:
    branches:
      - 'wip/**'

# Minimum permissions (security: least-privilege)
permissions:
  contents: read

jobs:
  python-lint-targeted:
    name: python-lint-targeted
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
        with:
          python-version: "3.12"
      - run: uv sync --all-packages
      # Targeted: only lint packages changed in this push (dorny/paths-filter selects)
      # /dev-team implementa paths-filter detection y loop sobre packages detectados
      - run: uv run ruff check <changed-packages> --no-cache

  python-test-targeted:
    name: python-test-targeted
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
        with:
          python-version: "3.12"
      - run: uv sync --all-packages
      # Skip arch-fitness, skip coverage threshold — solo tests del módulo tocado
      - run: uv run pytest -x -q --tb=short --ignore=tests/architecture/ --override-ini="addopts=" <changed-test-paths>

  ts-lint-targeted:
    name: ts-lint-targeted
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      # /dev-team implementa detección de paquete FE cambiado y eslint targeted
      - run: pnpm --filter <changed-package> lint

  # NOTE: NO ts-test completo, NO arch-fitness FE, NO coverage threshold en WIP
  # Objetivo: < 5min total para iteración rápida
```

### cd-staging.yml — skeleton

```yaml
name: CD (Staging)

on:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  deploy-staging:
    name: deploy-staging
    runs-on: ubuntu-latest
    timeout-minutes: 10
    # GitHub Environment — aprobación opcional (configurar en repo Settings > Environments > staging)
    environment: staging
    steps:
      - uses: actions/checkout@v4

      # Gate: CI full debe haber pasado antes de deploy
      # /dev-team implementa: job dependency o verificación de status del ci.yml run asociado

      - name: Deploy to staging
        env:
          STAGING_HOST: ${{ secrets.STAGING_HOST }}
          STAGING_SSH_KEY: ${{ secrets.STAGING_SSH_KEY }}
        run: |
          # Placeholder — activar cuando STAGING_HOST secret configurado
          if [ -z "${STAGING_HOST}" ]; then
            echo "::notice::Staging server not configured. Set STAGING_HOST + STAGING_SSH_KEY secrets to activate auto-deploy."
            echo "Staging deploy skipped — placeholder mode."
            exit 0
          fi
          # /dev-team implementa: rsync/ssh deploy script o kubectl apply
          bash scripts/deploy/deploy-staging.sh

      # Post-deploy: smoke health check
      - name: Staging health check
        if: env.STAGING_HOST != ''
        run: |
          # /dev-team implementa: curl {brand}-test.nicolify.com/health endpoints
          bash scripts/deploy/health-check-staging.sh
```

### cd-prod.yml — skeleton

```yaml
name: CD (Production)

on:
  push:
    branches:
      - 'release/**'

permissions:
  contents: read

jobs:
  parse-release:
    name: parse-release-branch
    runs-on: ubuntu-latest
    outputs:
      brand: ${{ steps.parse.outputs.brand }}
      version: ${{ steps.parse.outputs.version }}
    steps:
      - id: parse
        run: |
          BRANCH="${GITHUB_REF#refs/heads/}"
          # Regex: release/{brand}-vX.Y.Z
          if [[ ! "$BRANCH" =~ ^release/([a-z0-9-]+)-v([0-9]+\.[0-9]+\.[0-9]+)$ ]]; then
            echo "::error::Branch '$BRANCH' does not match release/{brand}-vX.Y.Z pattern"
            exit 1
          fi
          echo "brand=${BASH_REMATCH[1]}" >> "$GITHUB_OUTPUT"
          echo "version=${BASH_REMATCH[2]}" >> "$GITHUB_OUTPUT"

  detect-brand-changes:
    name: detect-brand-changes
    needs: parse-release
    runs-on: ubuntu-latest
    outputs:
      brand_changed: ${{ steps.filter.outputs[needs.parse-release.outputs.brand] }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          # Filtro dinámico por brand parseada del branch name
          # /dev-team implementa generación dinámica del filtro o filtro estático con brands conocidas
          filters: |
            nicolify:
              - 'nicolify/**'
            vitalia:
              - 'vitalia/**'
            comunify:
              - 'comunify/**'
            lupulo:
              - 'lupulo/**'
            core:
              - 'core/**'

  deploy-brand-prod:
    name: deploy-brand-${{ needs.parse-release.outputs.brand }}
    needs: [parse-release, detect-brand-changes]
    runs-on: ubuntu-latest
    # GitHub Environment per brand — permite aprobación manual pre-deploy prod
    environment: prod-${{ needs.parse-release.outputs.brand }}
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4

      - name: Deploy brand to production
        env:
          BRAND: ${{ needs.parse-release.outputs.brand }}
          VERSION: ${{ needs.parse-release.outputs.version }}
          # Secrets per brand (configurar en repo Settings > Environments > prod-{brand})
          PROD_SSH_KEY: ${{ secrets.PROD_SSH_KEY }}
          PROD_HOST: ${{ secrets.PROD_HOST }}
        run: |
          if [ -z "${PROD_HOST}" ]; then
            echo "::notice::Production server for ${BRAND} not configured. Set PROD_HOST + PROD_SSH_KEY in environment prod-${BRAND}."
            exit 0
          fi
          bash scripts/deploy/deploy-brand-prod.sh "${BRAND}" "${VERSION}"

      # Reusable deploy logic viene en S-CICD-DEPLOY T-2 (_deploy-brand.yml reusable workflow)
      # Este skeleton invoca el script directo hasta que el reusable workflow exista
```

### cleanup-wip.yml — skeleton

```yaml
name: Cleanup WIP branches

on:
  schedule:
    # Cada domingo a las 02:00 UTC
    - cron: '0 2 * * 0'
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry run (list only, no delete)'
        required: true
        default: 'true'
        type: choice
        options:
          - 'true'
          - 'false'
      max_age_days:
        description: 'Max age in days before branch is candidate for cleanup'
        required: false
        default: '30'

permissions:
  contents: write   # Needed to delete branches

jobs:
  cleanup-wip-branches:
    name: cleanup-wip-branches
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # Full history needed to check commit dates

      - name: List and optionally delete stale WIP branches
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          DRY_RUN: ${{ github.event.inputs.dry_run || 'true' }}
          MAX_AGE_DAYS: ${{ github.event.inputs.max_age_days || '30' }}
        run: |
          # /dev-team implementa lógica completa:
          # 1. git for-each-ref refs/remotes/origin/wip/** --format='%(refname:short) %(committerdate:unix)'
          # 2. Para cada branch: (now - last_commit_date) > MAX_AGE_DAYS → candidato
          # 3. DRY_RUN=true → solo listar candidatos (salida formateada)
          # 4. DRY_RUN=false → gh api DELETE /repos/{owner}/{repo}/git/refs/heads/{branch}
          # 5. NUNCA tocar main ni release/* (filtro explícito)
          # 6. Generar resumen: N candidatos, M preservados, K eliminados
          bash scripts/git/cleanup-wip-branches.sh
```

---

## pre-commit hook — pseudocódigo refactor (T-9)

El hook actual (`scripts/git-hooks/pre-commit`) tiene 620 líneas y 9 secciones. El refactor agrega **detección de branch** al inicio y un **switch case** para saltar/aplicar secciones según tipo de branch. Las 9 secciones existentes se preservan sin modificar su lógica interna.

```bash
#!/usr/bin/env bash
# Pre-commit hook — branch-aware dynamic gates
# Secciones existentes: 1 voseo | 2 ruff check | 3 ruff format | 4 R3 SSoT
#                        5 R32 capability | 6 R33 backlog | 7 checkpoint state
#                        8 PII seed YAMLs | 9 PII goldens YAMLs
# NEW: Branch detection section (antes de sección 1)
#
# Magic comment bypass (wip/* only):
#   # wip-fast                    → skip secciones 4-9 adicional al skip por branch
#   # wip-fast: <reason>          → ídem con razón documentada

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "${REPO_ROOT}"

# ─────────────────────────────────────────────────────────────────
# BRANCH DETECTION — NEW (antes de cualquier otra sección)
# ─────────────────────────────────────────────────────────────────
CURRENT_BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo 'HEAD-detached')"

# Determine gate level por tipo de branch
# main / release/* → FULL (todas las secciones)
# wip/*            → LIGHT (secciones 1-3 básicas, skip 4+ a menos que wip-fast no aplique)
# otros (HEAD detached, tags) → FULL por defecto (safe)
GATE_LEVEL="full"
case "${CURRENT_BRANCH}" in
  wip/*)
    GATE_LEVEL="light"
    # Check magic comment wip-fast en cualquier staged file
    # Si presente: log aviso, aplicar secciones 1-2 (voseo + ruff check), skip resto
    # /dev-team implementa: grep staged files para magic comment
    ;;
  main|release/*)
    GATE_LEVEL="full"
    ;;
  *)
    GATE_LEVEL="full"
    ;;
esac

# Export para uso en secciones
export GATE_LEVEL CURRENT_BRANCH

# Secciones existentes 1-9 se envuelven en condicionales:
# if [ "${GATE_LEVEL}" = "full" ] || [ "<sección aplica en light>" ]; then
#   <sección>
# fi
#
# Secciones que corren en LIGHT: 1 (voseo), 2 (ruff check), 3 (ruff format)
# Secciones que corren solo en FULL: 4 (R3 SSoT), 5 (R32 capability), 6 (R33 backlog),
#                                     7 (checkpoint state), 8 (PII seed), 9 (PII goldens)
# Rationale: en wip/* los archivos son WIP — SSoT freshness gates y capability
# reconcilers pueden dar falsos positivos sobre work-in-progress.
# main → merge squash ya tiene los archivos finales → gates completos son correctos.

# ... (secciones existentes 1-9 sin modificar su lógica interna) ...

exit 0
```

---

## Tests requeridos (por TDD — antes de implementar)

### Bash unit tests hook (T-9)

Path: `scripts/tests/test_pre_commit_hook.sh`

Tests obligatorios a escribir ANTES de refactorizar el hook:

| Test ID | Descripción | Mecanismo |
|---|---|---|
| `test_wip_branch_detection` | Hook detecta `wip/feature-x` como LIGHT gate | Stub `git symbolic-ref` con BRANCH=wip/feature-x, verificar GATE_LEVEL=light |
| `test_main_branch_detection` | Hook detecta `main` como FULL gate | Stub BRANCH=main, verificar GATE_LEVEL=full |
| `test_release_branch_detection` | Hook detecta `release/vitalia-v0.3.0` como FULL gate | Stub BRANCH=release/vitalia-v0.3.0, verificar GATE_LEVEL=full |
| `test_wip_skips_arch_fitness` | En LIGHT gate, sección arch-fitness NO se ejecuta | Mock sección 4 con counter, verificar counter=0 cuando GATE_LEVEL=light |
| `test_main_runs_arch_fitness` | En FULL gate, sección arch-fitness SÍ se ejecuta | Mock sección 4 con counter, verificar counter=1 cuando GATE_LEVEL=full |
| `test_wip_fast_magic_comment_skips_extra` | Magic comment `# wip-fast` en staged file → skip secciones extra en wip/* | Stub staged file con magic comment, verificar skip |
| `test_voseo_runs_in_wip` | Sección voseo (1) corre siempre, incluso en wip/* | GATE_LEVEL=light + staged file con voseo → hook blocks |
| `test_ruff_runs_in_wip` | Sección ruff (2-3) corre en wip/* | GATE_LEVEL=light + staged .py con ruff violation → hook blocks |
| `test_detached_head_defaults_full` | HEAD detached → FULL gate (safe default) | Stub `git symbolic-ref` retornando error, verificar GATE_LEVEL=full |
| `test_backward_compat_sections_1_to_9` | Las 9 secciones existentes siguen pasando sin modificar su lógica | Regresión sobre test suite actual del hook (`backend/tests/scripts/test_pre_commit_hook.py`) |

### Workflow lint (T-4, T-5, T-6, T-7, T-8)

- `actionlint .github/workflows/*.yml` — valida sintaxis y referencias GitHub Actions correctas
- Instalación: `brew install actionlint` (macOS) o `go install github.com/rhysd/actionlint/cmd/actionlint@latest` (Linux)
- Corre en CI como job adicional en `ci.yml` (el mismo workflow se valida a sí mismo en el siguiente push)

### Markdownlint (T-1, T-2, T-3)

- `markdownlint .claude/rules/git-safety.md .claude/rules/parallel-safety.md .claude/rules/git-haiku-delegation.md`
- Config: `.markdownlint.json` existente en repo (o defaults si no existe)

---

## Cross-cutting concerns

- **Tenant isolation:** NO aplica (infra pura, no toca tenant data)
- **PII:** NO aplica (no hay datos de usuario)
- **Migraciones:** NO aplica (no hay DB schema)
- **Idempotencia:** Los workflows deben ser idempotentes — re-run con mismo SHA no produce doble-deploy (implement via `if: github.sha != already_deployed_sha` check o simplemente aceptar re-deploy idempotente si el deployment script es idempotente)
- **Backwards compatibility:** La regla `development` legacy se elimina. El branch `development` puede existir en repos locales; no hay gate que lo elimine automáticamente. Developers con checkout en `development` deben migrar manualmente a `main` + `wip/*`. Documentar en T-13 (S-GIT-STRATEGY-HELPERS).
- **Secrets:** Todos los secrets de deploy son environment-scoped en GitHub (`prod-{brand}`, `staging`) — no repo-level. Esto permite per-brand access control.

---

## Riesgos y mitigaciones

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Worktrees sin branch dedicado (pattern incorrecto) | Alta | Helper scripts `new-session.sh` en T-10 (S-GIT-STRATEGY-HELPERS) crean worktree + branch wip/* atómicamente. Rule parallel-safety.md M9 documenta el patrón obligatorio. Git bloquea automáticamente duplicación de branch en dos worktrees. |
| Servidor staging no disponible al cierre del outcome | Media | `cd-staging.yml` tiene placeholder mode explícito (log "configure STAGING_HOST secret to activate"). Workflow está listo; activación cuando Chris decida proveedor. No bloqueante para stories downstream. |
| Magic comment `# wip-fast` abusado (skip gates en main) | Media | El switch case solo activa wip-fast en `GATE_LEVEL=light`, que solo aplica a branches `wip/*`. En `main` o `release/*`, el GATE_LEVEL es always `full` y la lógica wip-fast es unreachable. |
| Cleanup cron elimina branch wip/* con trabajo valioso | Media | TTL 30d es conservador. M11 (push >30min sin commit) garantiza que trabajo real tiene push reciente. La branch no aparece como candidata si tiene commit en los últimos 30d. |
| ci-wip.yml permite pushear código con tests rotos a wip/* | Baja | Es el trade-off explícito — wip/* acepta snapshots incompletos. La calidad se verifica en el squash-merge a main (ci.yml full gates). |
| actionlint no instalado localmente | Baja | Corre en CI automáticamente. Localmente es opcional — los errores de sintaxis YAML son detectados por GitHub Actions en el primer push. |

---

## Decisiones registradas

- **D1 (2026-05-15)** — Triple-branch policy adoptada. Alternativa descartada: trunk-based sin wip/* (requería disciplina extrema de commits-pequeños que no encaja con sesiones Claude autónomas largas).
- **D2 (2026-05-15)** — Worktrees revertidos. El ban previo falló porque se usaban sin branch dedicado. Con branch dedicado, git previene colisión a nivel de sistema de archivos — no requiere disciplina humana.
- **D3 (2026-05-15)** — pre-commit hook refactorizado (no reemplazado). Las 9 secciones existentes son valiosas; solo se envuelven en condicionales de branch. Evita reescribir lógica testada.
- **D4 (2026-05-15)** — `ci-wip.yml` separado de `ci.yml` (no un path filter dentro del mismo workflow). Más legible, más fácil de mantener, permite timeouts distintos.
- **D5 (2026-05-15)** — `release.yml` existente (GH Packages publish) se preserva intacto. Su trigger (`push: tags: ['v*.*.*']`) es orthogonal al CD de brand apps (`push: branches: release/*`). No hay conflicto.
- **D6 (2026-05-15)** — `cd-prod.yml` usa `dorny/paths-filter@v3` para selective deploy. Alternativa (siempre deployar todo): demasiado lento + riesgo de deploy involuntario de brands sin cambios.
- **D7 (2026-05-15)** — cleanup-wip.yml dry-run por default. Delete requiere input manual `dry_run=false`. Esto previene eliminación accidental en el primer run del cron.

---

## Próximo paso

`done -> docs/product/stories/S-GIT-STRATEGY-CORE/03-arch.md` (el orchestrator /architect unificado produce 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml).
