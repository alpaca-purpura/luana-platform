---
story_id: S-GIT-STRATEGY-HELPERS
surface: INFRA
sub_architect: /architect
arch_version: 1
last_modified: 2026-05-15T00:00:00Z
links:
  spec: "01-spec.md"
  outcome: "../../outcomes/git-strategy-revised.md"
  rules:
    - ".claude/rules/git-safety.md"
    - ".claude/rules/parallel-safety.md"
    - ".claude/rules/git-haiku-delegation.md"
---

# 03-arch.md — S-GIT-STRATEGY-HELPERS

## Decision arquitectonica clave

Esta story es 100% infra tooling y documentacion: no toca Python/FastAPI/Next.js/bases de datos. La superficie es bash scripts + markdown docs + actualizacion de archivos de configuracion del monorepo. El patron central son dos scripts bash simetricos: `new-session.sh` (crea contexto) y `cleanup-session.sh` (destruye contexto limpiamente), ambos con sanitizacion de inputs y exit codes semanticos. La documentacion (CLAUDE.md, AGENTS.md, ADR-004, runbook, MEMORY) es el mecanismo de adoption — sin docs coherentes los scripts son inutiles porque nadie sabe que existen.

**Trade-off clave:** scripts bash vs Makefile targets. Se elige bash standalone porque: (1) `make` no esta disponible en todos los contextos de apertura de sesion nueva; (2) los scripts son invocados ANTES de que el repo este completamente configurado (worktree recien creado); (3) el error handling con `set -euo pipefail` es mas predecible en bash que en Makefile.

---

## Surface diff completo

### Archivos NUEVOS

| Archivo | Tipo | Descripcion |
|---|---|---|
| `scripts/git/new-session.sh` | bash script | Crea worktree + branch wip/* + copia .env templates |
| `scripts/git/cleanup-session.sh` | bash script | Push final + remueve worktree. STOP si dirty |
| `scripts/tests/test_new_session.sh` | bash test | Unit tests para new-session.sh (mock git) |
| `scripts/tests/test_cleanup_session.sh` | bash test | Unit tests para cleanup-session.sh (mock git) |
| `docs/architecture/luana-platform/ADR-004-git-branching-and-environments.md` | markdown | ADR ratificando triple-branch + reversion ban worktrees |
| `docs/process/git-workflow-multibrand.md` | markdown | Runbook cheatsheet diario + recovery patterns |
| `memory/git-workflow-multibrand.md` | markdown | MEMORY detail file (pointer-first) |

### Archivos MODIFY

| Archivo | Seccion a cambiar | Descripcion del cambio |
|---|---|---|
| `CLAUDE.md` | `## Git Workflow` (dentro seccion topology/rules) | Reemplazar politica legacy "solo development, main=prod auto" → triple-branch + worktrees. Agregar referencia a scripts/git/ y ADR-004. |
| `AGENTS.md` | `## Git Workflow` | Idem CLAUDE.md — mantener coherencia entre ambos archivos |
| `memory/MEMORY.md` (en `/home/chalreme/.claude/projects/-home-chalreme-Proyectos-luana-platform/memory/MEMORY.md`) | `## Workspace operacional` | Agregar linea pointer: `- [Git workflow multibrand](git-workflow-multibrand.md) — triple-branch + worktrees policy, scripts, ADR-004` |

---

## Especificacion detallada: `scripts/git/new-session.sh`

### Header obligatorio (documentacion inline)

```bash
#!/usr/bin/env bash
# new-session.sh — Crea worktree + branch wip/{SLUG} para sesion paralela nueva
#
# Usage:  scripts/git/new-session.sh SLUG
# Args:
#   SLUG     Identificador alfanumerico de la sesion (ej: A-docker, B-cicd, chris-hotfix)
#            Solo caracteres [a-zA-Z0-9_-]. REQUERIDO.
# Exit codes:
#   0  Worktree creado exitosamente
#   1  Error: slug invalido / branch ya existe / dir ya existe / git error
#
# Produces:
#   - Branch wip/{SLUG} en el repositorio local
#   - Worktree fisico en ../luana-{SLUG} (sibling del monorepo)
#   - Copias best-effort de .env.dev.template por brand (si existen)
#
# Example:
#   cd /home/chalreme/Proyectos/luana-platform
#   scripts/git/new-session.sh A-docker
#   cd ../luana-A
```

### Implementacion skeleton

```bash
#!/usr/bin/env bash
set -euo pipefail

SLUG="${1:?Usage: new-session.sh SLUG}"

# D1 — Sanitize: solo alnum + dash + underscore. Excluye .., /, \, espacios
[[ "$SLUG" =~ ^[a-zA-Z0-9_-]+$ ]] || {
  echo "::error::Invalid slug '${SLUG}' — only [a-zA-Z0-9_-] allowed"
  exit 1
}

BRANCH="wip/${SLUG}"
WORKTREE_DIR="../luana-${SLUG}"

# Verify branch no existe (git bloquea de todas formas, pero mensaje mejor)
if git rev-parse --verify "${BRANCH}" &>/dev/null; then
  echo "::error::Branch ${BRANCH} already exists — use a different slug or cleanup first"
  exit 1
fi

# Verify worktree dir no existe
if [[ -e "${WORKTREE_DIR}" ]]; then
  echo "::error::Directory ${WORKTREE_DIR} already exists"
  exit 1
fi

echo "Creating worktree ${WORKTREE_DIR} on branch ${BRANCH}..."
git worktree add -b "${BRANCH}" "${WORKTREE_DIR}" main

# D1 — Copy .env templates best-effort (no falla si no existen)
for brand_dir in nicolify vitalia comunify lupulo; do
  template="${brand_dir}/.env.dev.template"
  if [[ -f "${template}" ]]; then
    dest="${WORKTREE_DIR}/${brand_dir}/.env.dev"
    mkdir -p "$(dirname "${dest}")"
    cp "${template}" "${dest}" && echo "Copied ${template} → ${dest}" || true
  fi
done

echo ""
echo "Worktree ready: cd ${WORKTREE_DIR}"
echo "Branch: ${BRANCH}"
echo "Next: git commit + git push origin ${BRANCH} (safety net cada 30 min)"
```

---

## Especificacion detallada: `scripts/git/cleanup-session.sh`

### Header obligatorio (documentacion inline)

```bash
#!/usr/bin/env bash
# cleanup-session.sh — Push final + remueve worktree de sesion terminada
#
# Usage:  scripts/git/cleanup-session.sh SLUG
# Args:
#   SLUG     Identificador de la sesion a limpiar (ej: A-docker)
#            Solo caracteres [a-zA-Z0-9_-]. REQUERIDO.
# Exit codes:
#   0  Cleanup exitoso: worktree removido + branch pusheada
#   1  Error: slug invalido / worktree no existe / git error
#   2  STOP: worktree tiene cambios uncommitted — no destruye WIP
#
# SAFETY: el script NO remueve la branch wip/{SLUG} del repositorio.
#         Solo remueve el directorio fisico (worktree). La branch queda
#         para merge futuro a main o cleanup manual.
#
# Example:
#   cd /home/chalreme/Proyectos/luana-platform
#   scripts/git/cleanup-session.sh A-docker
```

### Implementacion skeleton

```bash
#!/usr/bin/env bash
set -euo pipefail

SLUG="${1:?Usage: cleanup-session.sh SLUG}"

# D1 — Sanitize
[[ "$SLUG" =~ ^[a-zA-Z0-9_-]+$ ]] || {
  echo "::error::Invalid slug '${SLUG}' — only [a-zA-Z0-9_-] allowed"
  exit 1
}

BRANCH="wip/${SLUG}"
WORKTREE_DIR="../luana-${SLUG}"

# Verify worktree existe
if [[ ! -d "${WORKTREE_DIR}" ]]; then
  echo "::error::No worktree at ${WORKTREE_DIR} — nothing to cleanup"
  exit 1
fi

# SAFETY GATE — verificar tree limpio antes de cualquier operacion destructiva
cd "${WORKTREE_DIR}"
if [[ -n "$(git status --short)" ]]; then
  echo "::error::Worktree ${WORKTREE_DIR} has uncommitted changes — commit or stash first"
  echo "Run: cd ${WORKTREE_DIR} && git status"
  exit 2
fi

# Push final (--set-upstream si primera vez; || true si ya up-to-date)
echo "Pushing ${BRANCH}..."
git push origin "${BRANCH}" --set-upstream 2>/dev/null \
  || git push origin "${BRANCH}" \
  || echo "(Branch already up-to-date or no commits — skipping push)"

cd - > /dev/null

# Remove worktree fisico (NO borra la branch)
echo "Removing worktree ${WORKTREE_DIR}..."
git worktree remove "${WORKTREE_DIR}"

echo ""
echo "Cleanup complete: worktree removed, branch ${BRANCH} pushed"
echo "Branch ${BRANCH} still exists — merge to main when ready or delete manually"
```

---

## Especificacion detallada: tests bash

### `scripts/tests/test_new_session.sh`

Los tests usan un directorio temporal como mock del repositorio git (via `git init` + variables de entorno sobrescritas). El script se invoca con `PATH` modificado para interceptar comandos git con funciones mock cuando sea necesario.

**Tests obligatorios:**

| Test ID | Descripcion | Tipo |
|---|---|---|
| `test_happy_new_session` | Mock git worktree add + verify dir creado + exit 0 | happy |
| `test_negative_duplicate_slug` | Branch preexistente → exit 1 + mensaje ::error:: | negative |
| `test_negative_dir_exists` | Dir preexistente → exit 1 + mensaje ::error:: | negative |
| `test_adversarial_path_traversal` | SLUG="../../etc/passwd" → exit 1 + ::error::Invalid slug | adversarial |
| `test_adversarial_slash_in_slug` | SLUG="foo/bar" → exit 1 | adversarial |
| `test_adversarial_space_in_slug` | SLUG="foo bar" → exit 1 | adversarial |
| `test_env_copy_best_effort` | Template existente → copiado; template ausente → no falla | edge |

**Pattern mock git:**

```bash
# Mock git via funcion en PATH temporal
setup_mock_git() {
  local mock_dir
  mock_dir="$(mktemp -d)"
  cat > "${mock_dir}/git" << 'MOCK'
#!/usr/bin/env bash
# Mock git para tests new-session.sh
case "$1 $2" in
  "rev-parse --verify")   exit 1 ;;  # branch no existe por default
  "worktree add")         mkdir -p "$4"; echo "Worktree added mock" ;;
  *)                      /usr/bin/git "$@" ;;
esac
MOCK
  chmod +x "${mock_dir}/git"
  export PATH="${mock_dir}:${PATH}"
}
```

### `scripts/tests/test_cleanup_session.sh`

| Test ID | Descripcion | Tipo |
|---|---|---|
| `test_happy_cleanup_session` | Worktree limpio → push + remove + exit 0 | happy |
| `test_edge_uncommitted_changes` | Tree dirty → exit 2 + worktree intacto | edge |
| `test_negative_no_worktree` | Slug sin worktree correspondiente → exit 1 | negative |
| `test_adversarial_path_traversal` | SLUG="../../etc/passwd" → exit 1 inmediato | adversarial |

---

## Especificacion detallada: ADR-004

Archivo: `docs/architecture/luana-platform/ADR-004-git-branching-and-environments.md`

**Estructura canonica Luana (igual que ADR-001):**

```
# ADR-004 — Git Branching Strategy + Environments (Triple-Branch + Worktrees)
Status: ACCEPTED
Date: 2026-05-15
Decision-makers: Chris + Claude Opus 4.7

## 1. Context
[Politica heredada single-brand "solo development, main=prod auto" en contradiccion
con multi-sesion paralela + multimarca + necesidad WIP safety net]

## 2. Decision
[Triple-branch: wip/{slug} + main + release/{brand}-vX.Y.Z.
Worktrees per sesion paralela HABILITADOS (reversion justificada de ban previo).]

## 3. Justificacion tecnica reversion ban worktrees
[Tabla: problema previo (sesiones humanas misma branch) vs solucion actual
(worktrees con branch dedicada — git bloquea colision automaticamente)]

## 4. Alternativas descartadas
[Single-branch (pisa WIP) / feature-branches sin worktrees (mismo filesystem,
checkout sobreescribe) / multi-repo (overhead operacional prohibitivo)]

## 5. Consecuencias
[Pro: paralelismo seguro garantizado / Contra: disciplina mental + cleanup
ritual mitigado por helper scripts]

## 6. Referencias
[git-strategy-revised.md / parallel-safety.md / git-safety.md /
scripts/git/new-session.sh / scripts/git/cleanup-session.sh]
```

---

## Especificacion detallada: Runbook `docs/process/git-workflow-multibrand.md`

Formato cheatsheet — cada workflow como bloque de comandos con comentarios.

**Secciones obligatorias:**

1. **Workflow diario — sesion nueva** (new-session.sh + commits + push wip/*)
2. **Workflow merge a main** (squash merge wip/* → main → staging auto-deploy)
3. **Workflow release a produccion** (release/{brand}-vX.Y.Z desde main → prod)
4. **Workflow cleanup** (cleanup-session.sh + branch lifecycle)
5. **Recovery patterns:**
   - Crash del sistema → `git stash list` + `git worktree list` + recovery desde wip/* pusheado
   - Branch wip/* TTL 30d (cron cleanup) → merge importante ANTES de 30d
   - Push falla non-fast-forward → STOP, escala Chris (no git pull)
   - Worktree dirty accidental → commit en wip/* o stash, luego cleanup
6. **Anti-patterns** (copiar del outcome doc)

---

## Especificacion detallada: MEMORY entry

**Archivo nuevo:** `memory/git-workflow-multibrand.md`

```markdown
# Git workflow multibrand — Triple-branch + Worktrees

Estado: IMPLEMENTADO (S-GIT-STRATEGY-CORE + S-GIT-STRATEGY-HELPERS done)

## Politica vigente (reemplaza "solo development, main=prod auto")

Triple-branch:
- wip/{slug}         autosave por sesion, TTL 30d
- main               integracion + staging auto-deploy
- release/{brand}-vX.Y.Z  produccion brand-especifica

Worktrees per sesion paralela: HABILITADOS (ADR-004).

## Helper scripts

  scripts/git/new-session.sh  SLUG   → crea worktree + branch wip/SLUG
  scripts/git/cleanup-session.sh SLUG → push + remove worktree

## Docs

  docs/architecture/luana-platform/ADR-004-git-branching-and-environments.md
  docs/process/git-workflow-multibrand.md (runbook cheatsheet)

## Rules actualizadas

  .claude/rules/git-safety.md       (S-GIT-STRATEGY-CORE T-1)
  .claude/rules/parallel-safety.md  (S-GIT-STRATEGY-CORE T-2)
  .claude/rules/git-haiku-delegation.md (S-GIT-STRATEGY-CORE T-3)
```

**Linea a agregar en MEMORY.md index:**
```
- [Git workflow multibrand](git-workflow-multibrand.md) — triple-branch + worktrees, scripts new-session/cleanup-session, ADR-004
```

---

## Tests requeridos (resumen)

| Archivo test | Comando verificador | Cobertura |
|---|---|---|
| `scripts/tests/test_new_session.sh` | `bash scripts/tests/test_new_session.sh` | 7 scenarios new-session |
| `scripts/tests/test_cleanup_session.sh` | `bash scripts/tests/test_cleanup_session.sh` | 4 scenarios cleanup |
| shellcheck new-session | `shellcheck scripts/git/new-session.sh` | lint bash |
| shellcheck cleanup-session | `shellcheck scripts/git/cleanup-session.sh` | lint bash |
| shellcheck tests | `shellcheck scripts/tests/test_new_session.sh scripts/tests/test_cleanup_session.sh` | lint tests |
| markdownlint ADR-004 | `markdownlint docs/architecture/luana-platform/ADR-004-*.md` | lint docs |
| markdownlint runbook | `markdownlint docs/process/git-workflow-multibrand.md` | lint docs |

---

## Cross-cutting concerns

- **No tenant isolation:** infra tooling, no hay queries ni datos de usuario
- **No migrations:** no hay base de datos involucrada
- **No PII:** scripts no tocan datos de usuarios
- **Backwards compatibility:** CLAUDE.md y AGENTS.md son actualizaciones in-place — el comportamiento descrito en ellos aplica forward-only; sesiones legacy en branch `development` siguen funcionando hasta que Chris las cierre

---

## Riesgos y mitigaciones

| Riesgo | Severidad | Mitigacion |
|---|---|---|
| Developer ejecuta cleanup con WIP → pierde trabajo | ALTA | exit code 2 + mensaje explicito + no se ejecuta git worktree remove |
| Slug con caracteres especiales → path traversal | ALTA | Regex `^[a-zA-Z0-9_-]+$` + exit 1 inmediato antes cualquier operacion git |
| CLAUDE.md / AGENTS.md desincronizados entre si | MEDIA | T-11 actualiza AMBOS en el mismo ticket, checklist coherencia en guidelines |
| ADR-004 desactualizado vs reglas efectivas | BAJA | ADR referencia rules + runbook (no duplica contenido — solo rationale) |

---

## Decisiones registradas

- **2026-05-15** — bash puro vs Python para scripts. Bash elegido: disponible sin venv, mejor para git subprocess, exit codes semanticos mas simples. Ver D1 en spec.
- **2026-05-15** — `exit 2` (dirty tree) diferenciado de `exit 1` (error generico) en cleanup. Permite scripts wrapper que manejen cada caso distinto.
- **2026-05-15** — MEMORY entry pointer-first: 1 linea index + archivo dedicado `git-workflow-multibrand.md`. Consistent con patron universal del proyecto (ver philosophy en CLAUDE.md).
- **2026-05-15** — Branch `wip/{SLUG}` NO se borra en cleanup. Solo se remueve el worktree fisico. La branch queda para merge a main o cleanup manual/cron. Razon: cleanup puede ocurrir mid-session antes de merge; destruir la branch seria destructivo.
