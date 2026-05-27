<!-- voseo-allowed: internal step 0 SSoT for skill consumers, not user-facing -->
---
description: "Step 0 obligatorio (mec. N) — detection worktree + manifest + sync KISS + enforcement skills /pm-{brand} y /pm-luana. SSoT D13 + v2 2026-05-18."
---

# Step 0 — Worktree detection + sync + enforcement (mec. N — v2)

**Consumed by:** `/pm-{brand}` (×4 + 6 futuras) y `/pm-luana` via `@.claude/rules/step-0-worktree.md`.

**SSoT model:** `docs/process/parallel-sessions-protocol.md` § D13 + `docs/process/worktree-protocol-v2-plan.md` § CORE #3 + CORE #5.

**Detalle completo (12 pasos logic v2 verbatim + output canonical examples all-OK/advisory/HARD REFUSE + implementación práctica skill body):** `docs/rules-detail/step-0-worktree.md`. Skill `worktree-protocol` cubre troubleshoot + modificar reglas.

## Logic v2 (12 pasos — resumen ejecutable)

1. **Detect TYPE** via path regex sobre `git rev-parse --show-toplevel`: PRINCIPAL / CANÓNICO brand=X / EFÍMERO story brand=X / EFÍMERO core / EFÍMERO protocol / UNKNOWN
2. **Read manifest** `.session.yaml` (ausente en PRINCIPAL por diseño)
3. **Verify cross-coherence** brand/type manifest matches path regex. Mismatch v2 NEW: AUTO-FIX manifest in-place (no escalate). Si brand difiere (rare) → ESCALATE Chris
4. **Manifest ausente + path UNKNOWN** → STOP escalate
5. **Manifest ausente + path conocido** → advisory regenerar
6. **Aplicar enforcement matrix** (tabla abajo)
7. **Run sync KISS activo** `scripts/git/sync-from-main.sh` (modo ejecutar). Tree clean + FF puro → silent. Merge real OK → silent + 1 línea. Conflict → STOP + prompt. Tree dirty + merge real → STOP + "commit/stash WIP"
8. **List otros worktrees vivos** de la misma brand
9. **Cross-brand mixing detection** HEAD vs main (advisory loud si bypass scope gate)
10. **Bucket lock acquire** `scripts/git/session-lock.sh acquire {bucket}` ∈ {code, docs, tests}
11. **Output canonical block** (compacto si OK, expandido si advisory/error)
12. **Si CANÓNICO + sync result auto-merge** → loguear en `~/Proyectos/luana-{brand}/.session-log`

Bucket por skill: `/po-ux`,`/po`,`/ux-agentico` → docs · `/dev-team`,`/architect` → code · `/auditor` → code · `/pm-*` → no acquire (read-mostly).

## Enforcement matrix

| Skill | Worktree type / brand | Verdict |
|---|---|---|
| `/pm-{brand-X}` | CANÓNICO brand X | ✅ OK proceed |
| `/pm-{brand-X}` | EFÍMERO brand X | ✅ OK + leer story/lane manifest |
| `/pm-{brand-X}` | CANÓNICO/EFÍMERO brand Y (Y≠X) | ❌ **HARD REFUSE** — STOP + redirect |
| `/pm-{brand-X}` | PRINCIPAL | ❌ **HARD REFUSE** |
| `/pm-{brand-X}` | EFÍMERO core | ❌ **HARD REFUSE** — core es /pm-luana |
| `/pm-{brand-X}` | UNKNOWN | ❌ **HARD REFUSE** escalate |
| `/pm-luana` | PRINCIPAL | ✅ OK (default) |
| `/pm-luana` | CANÓNICO brand X | ✅ OK (cross-brand desde brand context) |
| `/pm-luana` | EFÍMERO core | ✅ OK (lift work) |
| `/pm-luana` | EFÍMERO brand X | ⚠️ OK + soft warn |
| `/pm-luana` | UNKNOWN | ❌ **HARD REFUSE** escalate |

## Output canonical (formato general)

```
[step 0 worktree]
  path:     <cwd>
  branch:   <branch> [tree state]
  type:     <PRINCIPAL|CANÓNICO|EFÍMERO> <brand|core>
  manifest: brand=<X> story=<Y> lane=<Z|—>
  sync:     <status>
  others:   <other worktrees same brand>
[step 0 <OK|STOP>]
```

Ejemplos completos (all-OK compact, advisory sync, advisory loud core changed, HARD REFUSE): detail doc.

## Bloqueo

Step 0 ES bloqueante. Verdict HARD REFUSE → skill termina. Verdict OK + advisory → continúa pero advisory visible.

## Cuándo NO aplica

- Skills builders (`builder-*`) — NO cargan step 0
- Skills domain (`brand-expert`, `offer-expert`, etc.) — NO cargan step 0
- Skills git/tooling (`commit-push`, `git-manager`) — NO cargan step 0

Step 0 es exclusivo a skills que manejan SSoT funcional brand-specific o cross-brand (`/pm-*`).

## Referencias

- `docs/rules-detail/step-0-worktree.md` — **detalle completo** (12 pasos verbatim + output examples)
- `docs/process/parallel-sessions-protocol.md` § D8, D10, D12, D13
- `docs/architecture/luana-platform/ADR-005-worktree-policy.md`
- `.claude/rules/parallel-safety.md`
- `scripts/git/{check-sync,regenerate-manifest,status-all}.sh`
