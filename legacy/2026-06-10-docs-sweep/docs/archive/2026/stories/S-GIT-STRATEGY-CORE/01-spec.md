---
story_id: S-GIT-STRATEGY-CORE
type: service-story
module: infra
capability: safe-parallel-sessions
po_version: 1
last_modified: 2026-05-15T00:00:00Z
ratified_by_chris: true
sub_outcome: git-strategy-revised
outcome: infra-dev-multibrand
links:
  outcome: "../../outcomes/git-strategy-revised.md"
  checkpoint: "checkpoint.md"
---

## Resumen ejecutivo

Esta story implementa la base operacional git del monorepo luana-platform para entornos multi-sesión Claude paralela. Establece una **triple-branch policy** (`wip/{slug}` para autosave, `main` para integración+staging, `release/{brand}-vX.Y.Z` para producción) junto con la **revocación del ban legacy de worktrees** (cada sesión paralela usa su propio worktree físico dedicado, lo que hace imposible la colisión de WIP). Complementa esto con un **WIP safety net** de tres mecanismos ordenados por frecuencia, un **pre-commit hook dinámico** que aplica gates completos en `main`/`release/*` y gates ligeros en `wip/*`, y flujos de CI/CD GitHub Actions alineados con la nueva política de branches. No tiene superficie de usuario final: todos los entregables son archivos de reglas Markdown (`.claude/rules/`), workflows YAML (`.github/workflows/`), y el hook Bash (`scripts/git-hooks/pre-commit`).

---

## Acceptance Criteria (Gherkin AI-resistant)

### Scenario 1 — `wip-branch-ci-light` (`type: happy`)

**Contexto:** Una sesión Claude (o developer) trabaja en un worktree dedicado `../luana-B` con branch `wip/B-docker-compose`.

**Given:**
- El repo tiene branches `main` (protegido) y `wip/B-docker-compose` (activo en worktree `../luana-B`)
- El archivo `.github/workflows/ci-wip.yml` existe con `on: push: branches: ['wip/**']`
- El archivo `.github/workflows/ci.yml` tiene `on: push: branches: [main]` (NO incluye `wip/**`)

**When:**
- Se ejecuta `git push origin wip/B-docker-compose` desde el worktree `../luana-B`

**Then:**
- GitHub Actions dispara `ci-wip.yml` (light gates: lint targeted + tests targeted)
- GitHub Actions NO dispara `ci.yml` (full gates)
- GitHub Actions NO dispara `cd-staging.yml` ni `cd-prod.yml`
- El workflow `ci-wip.yml` completa en menos de 5 minutos
- No se hace ningún deploy automático

**Graders:**
- [Shell parse] — `grep -E "branches.*wip" .github/workflows/ci-wip.yml` retorna match
- [Shell parse] — `grep -E "branches" .github/workflows/ci.yml` NO incluye `wip/**`
- [Bash test] — `scripts/tests/test_pre_commit_hook.sh::test_wip_skips_arch_fitness`

---

### Scenario 2 — `squash-merge-main-to-staging` (`type: happy`)

**Contexto:** El trabajo en `wip/A-docker-compose` está listo para integración. Se hace squash-merge a `main`.

**Given:**
- Branch `wip/A-docker-compose` tiene commits limpios
- Branch `main` está actualizado
- Archivo `.github/workflows/cd-staging.yml` existe con `on: push: branches: [main]`
- Servidor staging (placeholder) configurado en los secrets del repo

**When:**
- Se ejecuta desde el workdir principal:
  ```bash
  git checkout main
  git merge --squash wip/A-docker-compose
  git commit -m "feat(docker): T-1+T-2 base compose multibrand"
  git push origin main
  ```

**Then:**
- GitHub Actions dispara `ci.yml` (full gates: lint + test + arch-fitness + coverage)
- GitHub Actions dispara `cd-staging.yml` (auto-deploy a staging)
- `ci.yml` completa en menos de 15 minutos
- `cd-staging.yml` deploya al cluster staging shared (o escribe log "staging server placeholder — configure STAGING_HOST secret to activate")
- NO se dispara `cd-prod.yml`

**Graders:**
- [Shell parse] — `grep -E "branches.*\[main\]" .github/workflows/cd-staging.yml` retorna match
- [Shell parse] — `grep -E "on:.*push" .github/workflows/cd-prod.yml` NO incluye `[main]`
- [Shell parse] — Jobs de `ci.yml` incluyen `arch-fitness` como step o job separado

---

### Scenario 3 — `release-branch-to-prod` (`type: happy`)

**Contexto:** Staging validado. Se crea branch `release/vitalia-v0.3.0` desde `main` y se pushea a producción.

**Given:**
- Branch `main` está en estado validado post-staging
- Archivo `.github/workflows/cd-prod.yml` existe
- `cd-prod.yml` parsea el nombre del branch con regex `release/([a-z0-9-]+)-v(\d+\.\d+\.\d+)`
- `dorny/paths-filter@v3` configurado para detectar qué brands tienen cambios

**When:**
- Se ejecuta:
  ```bash
  git checkout -b release/vitalia-v0.3.0
  git push origin release/vitalia-v0.3.0
  ```

**Then:**
- GitHub Actions dispara `cd-prod.yml`
- El workflow extrae `brand=vitalia` y `version=0.3.0` del nombre del branch
- El workflow corre gates CI completos antes de deploy
- El workflow despliega SOLO la brand `vitalia` (selective deploy vía paths-filter o matrix)
- El branch `release/vitalia-v0.3.0` se auto-elimina post-deploy exitoso (o se deja para cleanup manual)

**Graders:**
- [Shell parse] — `grep -E "release/\*" .github/workflows/cd-prod.yml` retorna match en el bloque `on:`
- [Shell parse] — `cd-prod.yml` contiene `dorny/paths-filter` o equivalente de detección selectiva
- [Shell parse] — `cd-prod.yml` tiene regex extraction `BRANCH="${GITHUB_REF#refs/heads/}"` con parsing brand+version
- [Shell parse] — `cd-prod.yml` NO tiene branch `main` ni `wip/**` en el trigger `on: push`

---

### Scenario 4 — `pull-prohibited-regression` (`type: negative`)

**Contexto:** Un agente o developer intenta usar `git pull` para resolver un push fallido.

**Given:**
- El archivo `.claude/rules/git-safety.md` contiene la nueva triple-branch policy
- El archivo existe y tiene sección "PROHIBIDO"

**When:**
- Se busca `git pull` en `.claude/rules/git-safety.md`

**Then:**
- `git pull` aparece listado explícitamente como PROHIBIDO sin excepción
- El archivo también prohíbe `git fetch && merge` (el equivalente semántico)
- El texto de la rule explica la alternativa correcta para push no-fast-forward (STOP + reportar Chris)
- La rule NO menciona `development` como única rama (legacy removido)

**Graders:**
- [Shell grep] — `grep -i "git pull.*PROHIBIDO\|PROHIBIDO.*git pull" .claude/rules/git-safety.md` retorna match
- [Shell grep] — `grep "development.*única" .claude/rules/git-safety.md | wc -l` retorna `0`
- [Shell grep] — `grep -i "triple-branch\|wip/\|release/" .claude/rules/git-safety.md` retorna al menos 3 matches

---

### Scenario 5 — `hook-dynamic-gates-wip` (`type: edge`)

**Contexto:** El pre-commit hook se ejecuta en un commit en branch `wip/test-feature`.

**Given:**
- Hook `scripts/git-hooks/pre-commit` instalado en `.git/hooks/pre-commit` (via symlink)
- Branch actual es `wip/test-feature` (detectable via `git symbolic-ref --short HEAD`)
- Se hace `git add` de un archivo Python y se intenta commit

**When:**
- Se ejecuta `git commit -m "wip(test): prueba hook dinámico"`

**Then:**
- El hook detecta branch `wip/*` correctamente
- El hook ejecuta: voseo check + ruff lint + ruff format (checks ligeros)
- El hook SALTA: arch-fitness check, coverage check, jscpd, interrogate, pip-audit (checks pesados)
- Si el archivo tiene magic comment `# wip-fast` en las primeras 5 líneas, el hook también salta los checks ligeros adicionales específicos de wip
- El commit completa en menos de 2 segundos (dado que no hay ruff failures reales)

**Graders:**
- [Bash test] — `scripts/tests/test_pre_commit_hook.sh::test_wip_branch_skips_heavy_gates` pasa con BRANCH=wip/test
- [Bash test] — `scripts/tests/test_pre_commit_hook.sh::test_main_branch_runs_full_gates` pasa con BRANCH=main
- [Shell grep] — `grep -E "symbolic-ref|git.*branch.*current" scripts/git-hooks/pre-commit` retorna match
- [Shell grep] — `grep "wip\*\|wip/\*\|case.*wip" scripts/git-hooks/pre-commit` retorna match

---

### Scenario 6 — `cleanup-wip-safe-30d` (`type: adversarial`)

**Contexto:** El cron semanal de cleanup ejecuta su lógica sobre branches `wip/*` del repo.

**Given:**
- Workflow `.github/workflows/cleanup-wip.yml` configurado con `schedule: cron`
- Existen branches `wip/old-feature` (último commit hace 45 días) y `wip/active-work` (último commit hace 2 días)
- El workflow corre en modo dry-run por defecto (output lista candidatos, no elimina)

**When:**
- El cron semanal ejecuta el workflow (o se dispara manualmente via `workflow_dispatch`)

**Then:**
- El workflow lista `wip/old-feature` como candidato a eliminación (>30d sin commits)
- El workflow NO lista `wip/active-work` como candidato (commit reciente)
- En modo dry-run (default), NO se elimina ningún branch
- Si se activa modo delete (input manual), se elimina SOLO `wip/old-feature`
- El workflow NUNCA toca branches `main` o `release/*`
- El workflow genera un resumen con branches candidatos y branches preservados

**Graders:**
- [Shell parse] — `grep -E "wip/\*\*|refs/heads/wip" .github/workflows/cleanup-wip.yml` retorna match en lógica de filtro
- [Shell parse] — `cleanup-wip.yml` NO contiene lógica que toque `main` o `release/*`
- [Shell parse] — `cleanup-wip.yml` tiene `schedule:` o `workflow_dispatch:` en el bloque `on:`
- [Shell parse] — `cleanup-wip.yml` tiene lógica de comparación de fecha del último commit (ej: `git log -1 --format="%ct"`)

---

## Non-functional requirements

| Categoria | Requisito | Verificador |
|---|---|---|
| Tiempo ci-wip.yml | Completa en < 5 min para PR/push a wip/* | Medición tiempos GitHub Actions (observable en Action run summary) |
| Tiempo ci.yml | Completa en < 15 min para push a main | Ídem |
| Overhead hook wip/* | Hook completa en < 2s en branch wip/* (sin arch fitness/coverage) | `time git commit --allow-empty -m "test"` en worktree wip |
| Overhead hook main | Hook completa en < 30s en branch main (con ruff full) | `time git commit --allow-empty -m "test"` en main |
| Idempotencia workflows | Re-run de workflow con mismo SHA no produce efectos secundarios duplicados | Verificación manual + workflow design |
| Sin secretos en logs | Workflows nunca loguean STAGING_HOST, prod tokens, ni SSH keys | Revisión manual código YAML + `permissions:` blocks |

---

## Constraints técnicos heredados

- `.claude/rules/anti-default-flip-audit.md`: cualquier cambio en el trigger de workflows que cambie qué gates se corren se trata como "flag flip" y requiere audit de los tests que dependen del gate anterior.
- `.claude/rules/anti-duplication.md`: reusable workflows (via `workflow_call`) para evitar copiar-pegar jobs entre `ci.yml`, `cd-staging.yml`, `cd-prod.yml`.
- `.claude/rules/hotfix-repro-mandatory.md`: si algún ticket de esta story se convierte en hot-fix (regresión introducida por los workflows nuevos), se requiere repro local antes de spawn builder.
- `.claude/rules/tdd-mandatory.md`: los tests Bash del hook (`scripts/tests/test_pre_commit_hook.sh`) deben escribirse ANTES de refactorizar el hook (RED → GREEN → REFACTOR).
- Conventional Commits format obligatorio en todos los commits de esta story.
- `git commit --no-verify` PROHIBIDO (los tests del hook deben pasar, no bypassearse).

---

## Cross-module impact

- **Lee de:** ninguno (es infra/process, no toca modules/ Python ni features/ TypeScript)
- **Es leído por:** S-DOCKER-DEV-MULTIBRAND (sus workflows asumen triple-branch), S-CICD-DEPLOY (amplía sobre workflows base), S-GIT-STRATEGY-HELPERS (helper scripts referencian estos branches)
- **Eventos emitidos:** ninguno (infra pura)
- **Eventos consumidos:** ninguno

---

## Decisiones ratificadas (D1..D7)

| ID | Decisión | Ratificada en |
|---|---|---|
| D1 | Triple-branch: `wip/*` autosave + `main` integración/staging + `release/{brand}-vX.Y.Z` prod | commit 48da7ec (outcome git-strategy-revised.md) |
| D2 | Worktrees per sesión paralela — revoca ban legacy. Cada sesión Claude SU worktree físico + branch `wip/*` dedicado | commit 48da7ec |
| D3 | WIP safety net 3 mecanismos en orden: push frecuente a main (80%) → push a wip/* (15%) → git stash solo context-switch corto mismo día (5%) | commit 48da7ec |
| D4 | Pre-commit hook dinámico por branch: main → full, wip/* → light, release/* → full+E2E smoke | commit 48da7ec |
| D5 | CI/CD GitHub Actions puro — NO Argo CD. `dorny/paths-filter@v3` para selective deploy. GitHub Environments per brand para gating prod | commit ff33858 (outcome infra-dev-multibrand.md) |
| D6 | Regla M11: nunca pasar >30 min sin push si hay cambios significativos en worktree | commit 48da7ec |
| D7 | cleanup-wip.yml: cron weekly, TTL 30d para branches wip/* sin commits recientes | commit 48da7ec |

---

## Open questions

Ninguna — todas las decisiones están ratificadas por Chris en commits ff33858 + 48da7ec.

---

## Próximo paso

- Tipo service-story → skip UX → `/architect` directo (combinado con `/po` en esta sesión)
- Artefactos `03-arch.md` + `04-validators.yaml` + `05-guidelines.md` + `06-tickets.yaml` producidos en esta misma sesión

---

## Changelog

- v1 2026-05-15 — /po+/architect produjo spec a partir de outcome git-strategy-revised.md ratificado (commits ff33858 + 48da7ec)
