# ADR-005 — Worktree Policy (multi-session paralelo + sincronización + lift core dedicado)

> **Status:** ACCEPTED
> **Date:** 2026-05-18
> **Decision-makers:** Chris (alpacapurpura@) + Claude Opus 4.7 (advisory)
> **Supersedes:** none
> **Superseded by:** none
> **Builds on:** [ADR-004](./ADR-004-git-branching-and-environments.md) (triple-branch policy + worktrees revocó ban legacy)
> **Related docs:**
>
> - `docs/process/parallel-sessions-protocol.md` — SSoT detallado del modelo (D1-D14)
> - `.claude/rules/parallel-safety.md` — runtime rules sincronizadas con D1-D14
> - `.claude/rules/step-0-worktree.md` — step 0 obligatorio skills `/pm-{brand}` y `/pm-luana`
> - `scripts/git/new-session.sh` — creación worktree (mec. B)
> - `scripts/git/cleanup-session.sh` — cierre worktree (mec. C)
> - `scripts/git/check-sync.sh` — T1 sync logic portable (mec. A logic)
> - `scripts/git/push-wip.sh` — T-push sync portable (mec. L logic)
> - `scripts/git/status-all.sh` — dashboard cross-worktree (mec. H)
> - `scripts/git/regenerate-manifest.sh` — recovery worktrees a mano (mec. M)
> - `docs/process/warp-multibrand-handbook.md` — manual operativo Warp

## 1. Context

### 1.1 ADR-004 revocó el ban worktrees pero dejó underspecified la operación diaria

ADR-004 (2026-05-15) revocó el ban histórico de worktrees y estableció triple-branch policy
(`wip/*`, `main`, `release/{brand}-vX.Y.Z`) + uso de worktrees por sesión paralela. Pero
quedaron sin codificar:

1. **Topología filesystem:** cuántos worktrees existen, dónde viven, qué los diferencia
2. **Naming convention:** patrones branch + path para distinguir canónicos, efímeros, multi-lane, hotfix, exp, lifts core
3. **Sincronización con `main`:** cómo los canónicos long-lived no se atrasan días respecto a main
4. **Política merge a main:** cuándo squash-merge, quién dispara, excepciones (hotfix bypass, exp nunca, multi-lane independiente)
5. **Cambios al `core/luana-core-*/`:** dónde vive físicamente el lift, cómo otros worktrees consumen
6. **Enforcement skills `/pm-{brand}`:** cómo cada skill detecta worktree mode + refuse invocación inválida
7. **opencode parity:** qué cambia cuando la sesión es opencode en vez de Claude Code

### 1.2 Problemática operativa observada

Chris opera 2-3 sesiones paralelas (brands distintas) + ocasionalmente multi-lane dentro de
una brand. Sin codificación explícita:

- Canónicos long-lived quedan días atrasados → cuando intentan pushear/mergear → conflictos masivos
- Cambios al core en una sesión no se propagan visiblemente a otras sesiones consumidoras
- Skills `/pm-{brand}` invocados accidentalmente desde worktree de otra brand → leaks de scope
- Disciplina humana es la única defensa → frágil

## 2. Decision

Adoptar el modelo cementado en `docs/process/parallel-sessions-protocol.md` D1-D14. Resumen:

### 2.1 Topología (D2)

| Path | Tipo | Branch | Editar código |
|---|---|---|---|
| `~/Proyectos/luana-platform/` | PRINCIPAL | `main` | ❌ NO (solo merges + read cross-brand) |
| `~/Proyectos/luana-{brand}/` | CANÓNICO long-lived | rota `wip/{brand}-{slug}` según story activa | ✅ SÍ |
| `~/Proyectos/luana-{brand}-{slug}/` | EFÍMERO brand | `wip/{brand}-{slug}[-{lane}]` | ✅ SÍ |
| `~/Proyectos/luana-{brand}-hotfix-{slug}/` | EFÍMERO hotfix | `hotfix/{brand}-{slug}` | ✅ SÍ |
| `~/Proyectos/luana-{brand}-exp-{slug}/` | EFÍMERO experimento | `exp/{brand}-{slug}` | ✅ SÍ (NUNCA mergea) |
| `~/Proyectos/luana-core-{slug}/` | EFÍMERO core (D12) | `wip/core-{slug}` | ✅ SÍ (lift gate `/pm-luana`) |

### 2.2 Sincronización canónicos (D10)

3 triggers de sync hacia `origin/main`:

| Trigger | Aplica a | Comportamiento |
|---|---|---|
| T1 SessionStart hook (mec. A) | PRINCIPAL + CANÓNICO | auto-FF si tree clean + FF puro; advisory si merge real; banner LOUD si dirty + core changed |
| T2 `/pm-{brand}` step 0 (mec. N) | TODOS los wip/* | misma lógica T1 |
| T-push PreToolUse (mec. L) | TODOS los wip/* | fetch + advisory pre-push (no bloquea) |

### 2.3 Política merge (D11)

- Default: 1 squash-merge por story al cerrar `state=done` (auditor APPROVED + CHECKPOINTS aplicados). `/pm-{brand}` ejecuta como parte de transición `state=reviewing→done`.
- Checkpoint mid-story opcional cuando mitad lógica está cerrada.
- Hotfix bypass auditor formal (require `repro_verified: true` + test regression RED→GREEN).
- Experimentos NUNCA mergean. Cleanup extrae learnings.
- Multi-lane: cada lane mergea independiente cuando su `/auditor` lane APPROVED.
- Core change requiere `/pm-luana` promotion proposal `state ≥ accepted`.

### 2.4 Cambios al core (D12)

- Worktree dedicado `~/Proyectos/luana-core-{slug}/` con branch `wip/core-{slug}`
- Manifest `.session.yaml::brand = core` (pseudo-brand reservado)
- Cross-worktree dependency: T1 + advisory `uv sync` / `pnpm install` si lift cambió deps
- Breaking change: `/pm-luana` coordina stories cross-brand en release window

### 2.5 Step 0 enforcement (D13)

- SSoT `.claude/rules/step-0-worktree.md` consumido por skills via `@import`
- HARD refuse cuando skill `/pm-{brand-X}` invocado desde worktree de otra brand
- `/pm-luana` permite ejecución desde PRINCIPAL, CANÓNICO brand, EFÍMERO core (soft warn desde EFÍMERO brand-specific)

### 2.6 opencode parity (D14)

3 capas:
1. Bash scripts como SSoT portable
2. Claude Code hooks como sugar daily
3. Warp Workflows como sugar manual/opencode

opencode honra `.claude/skills/` y `.claude/rules/`. Hooks ausentes → scripts manuales.

## 3. Consequences

### 3.1 Positivas

- Aislamiento físico por sesión via worktree dedicado (git impide colisión por diseño)
- Canónicos al día via 3 triggers de sync
- Excepciones formales codificadas (hotfix, exp, multi-lane, core)
- Skills no se invocan accidentalmente cross-brand
- Modelo funciona en Claude Code Y opencode
- Lifts core con worktree dedicado mantienen separation of concerns

### 3.2 Negativas / Trade-offs

- **Espacio en disco:** cada worktree clona `node_modules/` (~500 MB cuando aplica)
- **RAM:** max 1 stack Docker por brand limita paralelo dentro de brand
- **Onboarding:** modelo más complejo que single-branch; requiere lectura del protocol completo + warp handbook
- **opencode requiere disciplina manual** (Warp Workflows mitigan)
- **Checkpoints mid-story no scripteados todavía** (procedimiento documentado, scripteamos cuando aparezca el primer caso)

### 3.3 Riesgos mitigados

- **Disciplina humana:** reemplazada por scripts + hooks + enforcement skills
- **Pérdida de WIP:** mec. B asegura branch wip/* desde origin/main fresco; M11 push ≤30 min
- **Cross-brand leak:** step 0 HARD refuse + auditor cross-brand mirror scan
- **Engine drift:** promotion gate `/pm-luana` + downstream regression R3

## 4. Alternatives Considered

### 4.1 Single-branch development con disciplina humana (legacy)

Status: rejected en ADR-004. Comprobado frágil con 2-3 sesiones paralelas + multimarca.

### 4.2 Worktrees sin enforcement formal (opción libre)

Status: rejected. Sin step 0 + sync triggers, los canónicos se atrasan + skills se invocan cross-brand.

### 4.3 Mono-branch en main + rebase frecuente

Status: rejected. Rebase + force-push prohibido (regla M5). main debe ser deployable siempre.

### 4.4 Auto-merge silencioso main → wip cuando hay cambios

Status: rejected en D10. Sólo FF puro silent; merge real requiere prompt (riesgo conflictos sutiles).

## 5. Implementation status

| Mecanismo | Status |
|---|---|
| B `new-session.sh` | ✅ implementado (promoted from v2 2026-05-18) |
| C `cleanup-session.sh` mejorado | ✅ implementado 2026-05-18 |
| A SessionStart hook + `check-sync.sh` | ✅ implementado 2026-05-18 |
| L `push-wip.sh` + Claude PreToolUse hook | ✅ implementado 2026-05-18 |
| H `status-all.sh` dashboard | ✅ implementado 2026-05-18 |
| M `regenerate-manifest.sh` | ✅ implementado 2026-05-18 |
| N `.claude/rules/step-0-worktree.md` SSoT | ✅ implementado 2026-05-18 |
| I PS1 bashrc snippet | ✅ implementado 2026-05-18 (`scripts/git/ps1-luana.sh`) |
| F wrapper `make dev-{brand}` con lock | ⏳ stub 2026-05-18 (Makefile) |
| G wrapper alembic con lock | ⏳ stub 2026-05-18 (`scripts/generate_migration.py`) |
| D pre-commit checks extras | ✅ implementado 2026-05-18 |
| K Warp Workflows yaml | ✅ implementado 2026-05-18 (`scripts/warp-workflows/`) |
| Warp handbook | ✅ implementado 2026-05-18 (`docs/process/warp-multibrand-handbook.md`) |

## 6. Future addenda

Cuando aparezca el primer caso real de checkpoint mid-story → codificar lessons en `scripts/git/checkpoint-merge.sh` o extender `cleanup-session.sh`. Hasta entonces, procedimiento manual documentado en D11.

Cuando bootstrap brands futuras (saasora, inmoflow, retailly, fixia, guestly, fitflow) → actualizar lista de brands válidas en `new-session.sh`, `step-0-worktree.md`, `status-all.sh`, y `docs/portfolio/PORTFOLIO.md` en mismo commit.
