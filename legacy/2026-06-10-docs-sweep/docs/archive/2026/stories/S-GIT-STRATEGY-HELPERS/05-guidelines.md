---
story_id: S-GIT-STRATEGY-HELPERS
arch_version: 1
last_modified: 2026-05-15T00:00:00Z
---

# 05-guidelines.md — S-GIT-STRATEGY-HELPERS

## Files in scope (lista exacta)

### Archivos NUEVOS a crear

```
scripts/git/new-session.sh
scripts/git/cleanup-session.sh
scripts/tests/test_new_session.sh
scripts/tests/test_cleanup_session.sh
docs/architecture/luana-platform/ADR-004-git-branching-and-environments.md
docs/process/git-workflow-multibrand.md
memory/git-workflow-multibrand.md
```

### Archivos MODIFICAR (secciones especificas)

```
CLAUDE.md                    → seccion "## Git Workflow" o equivalente heredada
AGENTS.md                    → seccion "## Git Workflow" heredada
/home/chalreme/.claude/projects/-home-chalreme-Proyectos-luana-platform/memory/MEMORY.md
                             → ## Workspace operacional: agregar 1 linea pointer
```

### Archivos NO tocar (out of scope)

```
.claude/rules/git-safety.md            ← S-GIT-STRATEGY-CORE T-1
.claude/rules/parallel-safety.md       ← S-GIT-STRATEGY-CORE T-2
.claude/rules/git-haiku-delegation.md  ← S-GIT-STRATEGY-CORE T-3
.github/workflows/                     ← S-GIT-STRATEGY-CORE T-4..T-9
scripts/git-hooks/pre-commit           ← S-GIT-STRATEGY-CORE T-9
cualquier backend/src/                 ← fuera de scope
cualquier frontend/src/                ← fuera de scope
```

---

## Patterns REQUIRED

### R1 — Bash: `set -euo pipefail` OBLIGATORIO

Todo script en `scripts/git/` DEBE comenzar con:

```bash
#!/usr/bin/env bash
set -euo pipefail
```

Razon: `set -e` para en el primer error (no acumula), `set -u` falla si variable undefined, `set -o pipefail` propaga exit code de pipes. Sin esto, un fallo silencioso puede continuar y ejecutar operaciones destructivas.

### R2 — Sanitizacion SLUG: regex estricta `^[a-zA-Z0-9_-]+$`

```bash
[[ "$SLUG" =~ ^[a-zA-Z0-9_-]+$ ]] || {
  echo "::error::Invalid slug '${SLUG}' — only [a-zA-Z0-9_-] allowed"
  exit 1
}
```

La regex DEBE excluir explicitamente: `..` (path traversal), `/` (subdirectorios), `\` (escape sequences), espacios (split de argumentos), `$` (expansion de variables). El character set `[a-zA-Z0-9_-]` es el minimo suficiente para slugs legibles.

**No usar alternativas mas permisivas** como `^[^/]+$` — excluyen `/` pero permiten `..`, espacios, caracteres de control.

### R3 — Exit codes semanticos en cleanup-session.sh

| Exit code | Significado | Cuando |
|---|---|---|
| 0 | Exito | Cleanup completo exitoso |
| 1 | Error generico | Slug invalido / worktree no existe / git error |
| 2 | STOP — WIP no destruido | Worktree tiene uncommitted changes |

Exit code 2 diferenciado de 1 permite que scripts wrapper distingan entre "error de uso" (1) y "accion correcta del usuario requerida" (2). El caller puede mostrar un mensaje diferente para cada caso.

### R4 — Helper scripts en `scripts/git/` (ubicacion canonica)

Los helpers del workflow git viven en `scripts/git/` por coherencia con `scripts/git-hooks/` existente. NO deben agregarse como targets de `Makefile` (make tiene semantica diferente para errores y no garantiza disponibilidad en worktrees nuevos antes de `make dev`).

### R5 — Header de documentacion en cada script

Cada script DEBE tener un bloque de comentarios en el header que incluya:
- `Usage:` — sintaxis de invocacion
- `Args:` — descripcion de cada argumento con tipos y restricciones
- `Exit codes:` — tabla completa de exit codes
- `Produces:` — que archivos/estados crea el script
- `Example:` — al menos un ejemplo funcional de invocacion

### R6 — Formato ADR canonico Luana

El ADR-004 DEBE seguir el mismo formato que ADR-001 existente en `docs/architecture/luana-platform/adr/`. Secciones: Context / Decision / Justificacion / Alternativas descartadas / Consecuencias / Referencias.

El Status DEBE ser `ACCEPTED` (no `PROPOSED`) porque Chris ya ratifico la decision en el outcome doc `git-strategy-revised.md`.

### R7 — Runbook: formato cheatsheet one-liner por workflow

Cada workflow en `docs/process/git-workflow-multibrand.md` DEBE estar estructurado como bloque de comandos ejecutables con comentarios minimos. El objetivo es que alguien pueda copiar-pegar directamente al terminal. No prosa larga.

```bash
# ── Workflow: nueva sesion paralela ──────────────────────
cd /home/chalreme/Proyectos/luana-platform
scripts/git/new-session.sh A-docker      # crea worktree + branch wip/A-docker
cd ../luana-A
# ... trabaja, commitea frecuente ...
git push origin wip/A-docker             # safety net (cada 30 min maximo)
```

### R8 — MEMORY entry: pointer-first estricto

La linea en `MEMORY.md` (index) DEBE ser exactamente:

```
- [Git workflow multibrand](git-workflow-multibrand.md) — triple-branch + worktrees, scripts new-session/cleanup-session, ADR-004
```

El detalle vive en `memory/git-workflow-multibrand.md` (archivo dedicado). NUNCA poner mas de 1 linea en el index por entrada.

### R9 — Usar `$HOME` o paths relativos, NUNCA hardcodear `/home/chris/` o `/home/chalreme/`

Los scripts usan `../luana-${SLUG}` (path relativo al CWD = raiz del monorepo) en lugar de paths absolutos hardcodeados. Los docs pueden referenciar `/home/chalreme/Proyectos/luana-platform` como ejemplo ilustrativo solo en comentarios, pero el codigo funciona con paths relativos.

### R10 — CLAUDE.md y AGENTS.md deben ser coherentes entre si

La politica git en CLAUDE.md y AGENTS.md DEBEN decir lo mismo. T-11 los actualiza ambos en el mismo ticket. Checklist de coherencia:
- Triple-branch mencionada (wip/*, main, release/*)
- Worktrees HABILITADOS (no "PROHIBIDOS" como el texto legacy)
- Referencias a `scripts/git/new-session.sh` y `scripts/git/cleanup-session.sh`
- Referencia a ADR-004
- Eliminacion de "Single branch = development" legacy

---

## Patterns FORBIDDEN

### F1 — Scripts que destruyen sin verificacion previa

`cleanup-session.sh` NUNCA ejecuta `git worktree remove` si el tree esta sucio. La verificacion con `git status --short` es obligatoria ANTES de cualquier operacion destructiva.

```bash
# PROHIBIDO — destruir sin verificar
git worktree remove "${WORKTREE_DIR}"

# REQUERIDO — verificar primero
if [[ -n "$(git status --short)" ]]; then
  echo "::error::..."
  exit 2
fi
git worktree remove "${WORKTREE_DIR}"
```

### F2 — Regex de sanitizacion laxa

```bash
# PROHIBIDO — excluye / pero permite .. y espacios
[[ "$SLUG" =~ ^[^/]+$ ]]

# PROHIBIDO — excluye solo espacios simples, no es suficiente
[[ "$SLUG" != *" "* ]]

# REQUERIDO — whitelist estricta
[[ "$SLUG" =~ ^[a-zA-Z0-9_-]+$ ]]
```

### F3 — Hardcodear `/home/chris/...` o `/home/chalreme/...` en scripts

Los paths absolutos especificos de la maquina de Chris NO deben aparecer en el codigo de los scripts (si pueden aparecer en comentarios de ejemplos en docs). Usar paths relativos o `$HOME`.

```bash
# PROHIBIDO en codigo del script
WORKTREE_DIR="/home/chalreme/Proyectos/luana-${SLUG}"

# REQUERIDO — relativo al CWD
WORKTREE_DIR="../luana-${SLUG}"
```

### F4 — Scripts con argumentos multiples o flags complejos

Los scripts aceptan exactamente 1 argumento (SLUG). No agregar flags opcionales, opciones `--force`, ni comportamiento variable segun numero de argumentos. La simplicidad es intencionada: un slug = una sesion.

### F5 — Poner detalle en MEMORY.md index directamente

```markdown
<!-- PROHIBIDO en MEMORY.md index -->
- [Git workflow multibrand](git-workflow-multibrand.md) — triple-branch: wip/{slug} autosave TTL 30d + main integracion + staging auto-deploy + release/{brand}-vX.Y.Z prod. Helper scripts: new-session.sh + cleanup-session.sh...

<!-- REQUERIDO — 1 linea puntero -->
- [Git workflow multibrand](git-workflow-multibrand.md) — triple-branch + worktrees, scripts new-session/cleanup-session, ADR-004
```

El detalle va en `memory/git-workflow-multibrand.md`.

### F6 — `git add -A` / `git add .` en cualquier contexto

Los scripts no ejecutan operaciones de staging. Pero cualquier commit que produzca esta story DEBE seguir la regla de staging por nombre exacto de archivo. Prohibido en toda operacion git.

### F7 — `git worktree remove --force`

El flag `--force` en `git worktree remove` bypasea la verificacion de tree limpio. Prohibido en los scripts y en uso manual. La verificacion previa con `git status --short` es el mecanismo de proteccion.

### F8 — Tests bash sin isolation (tocar el repo real)

Los tests en `scripts/tests/test_*.sh` DEBEN usar un directorio temporal o mocks de git. NUNCA ejecutar `git worktree add` real en el repositorio de produccion durante los tests.

---

## Skills / rules a cargar en /dev-team

Cuando `/dev-team` ejecuta tickets de esta story, DEBE cargar:

| Recurso | Por que |
|---|---|
| `.claude/rules/git-safety.md` | Contexto de la politica git que se esta documentando |
| `.claude/rules/parallel-safety.md` | Contexto del problema de sesiones paralelas |
| `.claude/rules/git-haiku-delegation.md` | Pattern de commit + push que debe respetarse al hacer commits de esta story |
| `docs/product/outcomes/git-strategy-revised.md` | Decisiones tecnicas ratificadas (fuente de verdad) |
| `03-arch.md` (esta story) | Skeletons concretos de los scripts |
| `01-spec.md` (esta story) | Scenarios y exit codes esperados |

Skills opcionales:
- `backend-expert` — si necesita hardening adicional del bash

---

## Quality gates pre-commit

Antes de commitear cualquier ticket de esta story, verificar:

1. `shellcheck scripts/git/new-session.sh scripts/git/cleanup-session.sh` → 0 errores
2. `bash scripts/tests/test_new_session.sh` → todos GREEN
3. `bash scripts/tests/test_cleanup_session.sh` → todos GREEN
4. `markdownlint docs/architecture/luana-platform/ADR-004-*.md docs/process/git-workflow-multibrand.md` → 0 errores
5. Si T-11: `grep -q 'wip/' CLAUDE.md AGENTS.md` → ambos mencionan triple-branch
6. Si T-13: `grep -q 'git-workflow-multibrand' memory/MEMORY.md` → pointer existe
