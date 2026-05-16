---
story_id: S-GIT-STRATEGY-HELPERS
type: service-story
module: infra
capability: safe-parallel-sessions
po_version: 1
last_modified: 2026-05-15T00:00:00Z
ratified_by_chris: true
links:
  outcome: "../../outcomes/git-strategy-revised.md"
  parent_story: "S-GIT-STRATEGY-CORE"
  platform_outcome: "../../outcomes/infra-dev-multibrand.md"
---

# S-GIT-STRATEGY-HELPERS — Helper scripts + docs runbooks + ADRs

## Resumen ejecutivo

Esta story entrega las herramientas operacionales y la documentacion necesaria para que el workflow triple-branch + worktrees per sesion (definido en S-GIT-STRATEGY-CORE) sea usable en el dia a dia. Produce: dos scripts bash (`new-session.sh`, `cleanup-session.sh`) que automatizan la creacion y destruccion de worktrees con branch dedicado, actualizacion de CLAUDE.md y AGENTS.md con la politica nueva, ADR-004 ratificando la decision de revertir el ban de worktrees, y un runbook cheatsheet con los patrones de recuperacion. El sistema resuelve el riesgo de WIP perdido en sesiones paralelas Claude y reemplaza la politica legacy "solo development" heredada de single-brand Nicolify.

**Actor principal:** Chris (developer principal) y cualquier sesion Claude Code paralela abriendo un worktree nuevo.

**Outcome esperado:** cualquier sesion paralela puede iniciar con `scripts/git/new-session.sh {slug}` y terminar con `scripts/git/cleanup-session.sh {slug}` sin riesgo de pisar WIP de otra sesion. La documentacion en CLAUDE.md, AGENTS.md, ADR-004 y el runbook es coherente y reemplaza completamente la politica legacy.

**Depends on:** S-GIT-STRATEGY-CORE (state=done) — los scripts asumen que las rules `.claude/rules/git-safety.md` y `.claude/rules/parallel-safety.md` ya fueron reescritas con triple-branch + worktrees.

---

## Acceptance Criteria (Gherkin AI-resistant)

### Scenario 1 — `happy-new-session` (`type: happy`)

**Given:**
- El monorepo esta en `/home/chalreme/Proyectos/luana-platform/` con git tree limpio en branch `main`
- No existe ninguna branch `wip/A-docker` ni directorio `../luana-A`
- S-GIT-STRATEGY-CORE esta done (rules reescritas con triple-branch)

**When:**
- Developer ejecuta `scripts/git/new-session.sh A-docker` desde el directorio raiz del monorepo

**Then:**
- El script termina con exit code 0 en menos de 5 segundos
- Existe un worktree git en `../luana-A` (path relativo al monorepo) apuntando a la branch `wip/A-docker`
- La branch `wip/A-docker` existe en el repositorio local
- Si alguno de `nicolify`, `vitalia`, `comunify`, `lupulo` tiene un archivo `{brand}/.env.dev.template`, existe una copia en `../luana-A/{brand}/.env.dev`
- El output final del script incluye la linea `Worktree ready: cd ../luana-A`
- El directorio `../luana-A` es accesible con `cd` y `git status` muestra branch `wip/A-docker`

**Graders:**
- bash test — `scripts/tests/test_new_session.sh::test_happy_new_session`

---

### Scenario 2 — `happy-cleanup-session` (`type: happy`)

**Given:**
- Existe un worktree en `../luana-B` con branch `wip/B-cicd` creado previamente con `new-session.sh`
- El worktree `../luana-B` tiene el working tree limpio (sin cambios uncommitted)
- La branch `wip/B-cicd` tiene al menos un commit

**When:**
- Developer ejecuta `scripts/git/cleanup-session.sh B-cicd` desde el directorio raiz del monorepo

**Then:**
- El script termina con exit code 0 en menos de 10 segundos
- Git ejecuta `git push origin wip/B-cicd` (o reporta "already up-to-date" si no hay nada nuevo)
- El directorio `../luana-B` ya no existe en el filesystem
- El worktree `../luana-B` ya no aparece en `git worktree list`
- La branch `wip/B-cicd` sigue existiendo en el repositorio (solo se remueve el worktree fisico, no la branch)
- El output final incluye `Cleanup complete: worktree removed, branch wip/B-cicd pushed`

**Graders:**
- bash test — `scripts/tests/test_cleanup_session.sh::test_happy_cleanup_session`

---

### Scenario 3 — `negative-duplicate-slug` (`type: negative`)

**Given:**
- Ya existe la branch `wip/A-docker` en el repositorio (de una sesion previa)

**When:**
- Developer ejecuta `scripts/git/new-session.sh A-docker` nuevamente

**Then:**
- El script termina con exit code distinto de 0 (fallo explicito)
- El output contiene el mensaje `::error::Branch wip/A-docker exists`
- No se crea ningun directorio ni worktree nuevo
- El estado del repositorio queda identico al estado antes de ejecutar el script

**Graders:**
- bash test — `scripts/tests/test_new_session.sh::test_negative_duplicate_slug`

---

### Scenario 4 — `edge-uncommitted-changes` (`type: edge`)

**Given:**
- Existe un worktree en `../luana-C` con branch `wip/C-ux`
- El worktree `../luana-C` tiene cambios uncommitted (archivos modificados o nuevos sin `git add` + `git commit`)

**When:**
- Developer ejecuta `scripts/git/cleanup-session.sh C-ux` desde el directorio raiz del monorepo

**Then:**
- El script termina con exit code 2 (diferenciado — no es exit 1 generico)
- El output contiene el mensaje `::error::Worktree ../luana-C has uncommitted changes — commit or stash first`
- El directorio `../luana-C` sigue existiendo intacto con todos sus archivos
- El worktree `../luana-C` sigue apareciendo en `git worktree list`
- No se ejecuta ningun `git push` ni `git worktree remove`

**Graders:**
- bash test — `scripts/tests/test_cleanup_session.sh::test_edge_uncommitted_changes`

---

### Scenario 5 — `adversarial-path-traversal` (`type: adversarial`)

**Given:**
- El script `scripts/git/new-session.sh` esta disponible

**When:**
- Se ejecuta `scripts/git/new-session.sh "../../etc/passwd"` (path traversal attempt)

**Then:**
- El script termina con exit code 1 inmediatamente
- El output contiene el mensaje `::error::Invalid slug`
- No se crea ningun worktree, directorio, ni branch
- El sistema de archivos queda intacto (ningun archivo fuera del monorepo fue tocado)

**Analogamente para `cleanup-session.sh "../../etc/passwd"`:**
- Mismo exit code 1 + mensaje `::error::Invalid slug`
- Ninguna operacion git ejecutada

**Graders:**
- bash test — `scripts/tests/test_new_session.sh::test_adversarial_path_traversal`
- bash test — `scripts/tests/test_cleanup_session.sh::test_adversarial_path_traversal`

---

## Non-functional requirements

| Categoria | Requisito | Verificador |
|---|---|---|
| Latencia new-session | Ejecucion completa < 5s (incluye worktree create + branch + .env copy) | bash test `time new-session.sh` |
| Latencia cleanup-session | Ejecucion completa < 10s (incluye push + worktree remove) | bash test `time cleanup-session.sh` |
| Shellcheck | `shellcheck scripts/git/*.sh` 0 errores, 0 warnings | CI gate + validator |
| Markdownlint | 0 errores en ADR-004 + runbook + docs MD nuevos | markdownlint-cli |
| Coherencia docs | CLAUDE.md, AGENTS.md, ADR-004, runbook, MEMORY entry: politica triple-branch identica en todos | revision manual checklist |
| Sanitizacion SLUG | Solo caracteres `[a-zA-Z0-9_-]` aceptados. Nada fuera del set → exit 1 inmediato | bash test adversarial |
| Idempotencia cleanup | Si worktree ya no existe → error explicito, no panic | bash test negative |

---

## Decisions

**D1 — Helper scripts pattern (bash puro, no Python)**
Los scripts usan bash puro con `set -euo pipefail` y sanitizacion de inputs via regex `^[a-zA-Z0-9_-]+$`. Se descarto Python para evitar dependencia de venv activation en contextos de sesion nueva. Bash disponible universalmente en Linux.

**D2 — Location canonica `scripts/git/`**
Los helpers viven en `scripts/git/` (no en `Makefile` targets ni en `.claude/scripts/`) porque son scripts operacionales del workflow git, no herramientas del proceso de CI o del skill system. Consistente con `scripts/git-hooks/` ya existente.

**D3 — ADR-004 ratifica reversion ban worktrees**
La decision de revertir el ban historico de worktrees (documentado en MEMORY.md "perdí una semana previa") requiere un ADR explicito con justificacion tecnica y alternativas descartadas. Formato ADR canonico Luana (igual que ADR-001). Owner: `/architect`.

**D4 — MEMORY entry pointer-first**
La entrada en MEMORY.md es 1 linea de indice con `[[git-workflow-multibrand]]` + 1-line hook. El detalle vive en `memory/git-workflow-multibrand.md` dedicado. Consistent con filosofia pointer-first cementada en todas las memorias del proyecto.

---

## Cross-module impact

- **Lee de:** `.claude/rules/git-safety.md` + `.claude/rules/parallel-safety.md` (producidos por S-GIT-STRATEGY-CORE — asumidos presentes)
- **Es leido por:** toda sesion Claude que abre el proyecto (CLAUDE.md + AGENTS.md actualizados son auto-loaded)
- **Eventos emitidos:** ninguno (infra tooling, no runtime)
- **Eventos consumidos:** ninguno

---

## Open questions

Ninguno — decisiones D1..D4 ratificadas por Chris en outcome doc `git-strategy-revised.md`.

---

## Proximo paso

`type=service-story` → skip UX → `/architect` produce 03-arch.md + 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml

## Changelog

- v1 2026-05-15 — /po draft inicial + Chris ratificado en outcome doc
