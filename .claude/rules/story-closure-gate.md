# Story Closure Gate

**Origen:** caso vitalia 2026-05-18 — story `developed` quedó abandonada + 2nda story arrancada en mismo worktree. **Cement-date:** 2026-05-18.

**Detalle completo (6 fases workflow + 07-merge.md schema verbatim 5 secciones + gherkin_coverage field + 7 enforcement layers + anti-patterns examples + caso origen verbatim):** `docs/rules-detail/story-closure-gate.md`.

## Regla cardinal

Una story en `state: developed` o `reviewing` **NO puede abandonarse** para arrancar trabajo en otra story. Ciclo:

```
ready → developing → developed → reviewing → done
                         │           │
                         └─ AUTO ─→  └─ APPROVED ─→ merge ─→ done
```

`/dev-team` cerrar `developed` → **AUTO-HANDOFF** `/auditor`. APPROVED → **AUTO-HANDOFF** `/pm-{brand}` merge.

## Las 6 fases por worktree

| Fase | Owner | Output / artifact | Transition |
|---|---|---|---|
| **A — DEV** | `/dev-team` | `T-{n}-result.md` + `gate-output.json` GREEN + commits pushed | `ready → developing → developed` |
| **B — AUDIT** | `/auditor` (auto-handoff) | `T-{n}-review.md` + `CHECKPOINTS.md` (C1-C5) | `developed → reviewing` |
| **C — FIX-LOOP** | `/dev-team` (si CHANGES_REQUESTED) | fix commits + re-audit | cap 2 iter · excede → ESCALATED |
| **D — GHERKIN** | `/auditor` (Phase D dentro audit) | `06-audit/gherkin-matrix.md` (scenario → test → status) | embedded en B |
| **E — DOCS** | `/pm-{brand}` | `capabilities/{m}/{c}.yaml` + `modules/{m}.md` auto-list | embedded en F prep |
| **F — MERGE** | `/pm-{brand}` | `07-merge.md` 5 secciones + **F.3 Capability ledger update** + squash-merge + archive story (incl. chris-input.md) | `reviewing → done` |

Schema `07-merge.md` 5 secciones + `gherkin_coverage` field en `06-tickets.yaml` (verbatim ejemplos): ver detail doc.

### Fase F.3 — Capability ledger update (v2 cement 2026-05-27)

`/pm-{brand}` aplica logic del `cap_change_type` (declarado en checkpoint.md de la story) al cap YAML target. 4 ramas según el tipo de cambio:

> **★ v4 alignment (cement 2026-05-28):** `atomics` MUERTO — `scenario` es la unidad atómica de comportamiento. SSoT del schema cap: `docs/process/capability-protocol.md` + `docs/process/lifecycle.md`. Toda mención previa a `atomics_added`/`atomics[]` se reemplaza por `scenarios_added`/`scenarios[]`.

| `cap_change_type` | Acción sobre cap YAML |
|---|---|
| `new` | Crear `{brand}/docs/product/capabilities/{module}/{slug}.yaml` con schema v4 completo · `change_log[0]` con `type: new` + scenarios iniciales |
| `fix` | Append `change_log` entry con `type: fix` · `scenarios_added: []` · NO toca `scenarios[]` |
| `extend` | Append `change_log` entry con `type: extend` + scenarios nuevos · Append nuevos scenarios al array `scenarios[]` con `added_in_story: {story_id}` |
| `derive` | Crear cap YAML hijo con `parent_cap: {origen_slug}` + `change_log[0] type: derive` · Update cap padre: append `derives_capabilities: [hijo_slug]` |

**Order matters:** en `derive`, crear hijo primero (con `parent_cap` declarado), luego actualizar padre. Atomic write para evitar estado inconsistente.

**Update también:** `last_modified` del cap = today.

### Enforce reglas v3.1 (cement 2026-05-28 · cap verification)

Antes de cerrar el merge commit, verificar que el `change_log` entry de esta story cumpla:

| `cap_change_type` | `change_log[ultimo].scenarios_added.length` | Otros checks |
|---|---|---|
| `new` | `>= 1` REQUIRED | `scenarios[]` overall ≥1 scenario con shape válido |
| `extend` | `>= 1` REQUIRED | `scenarios[]` debió crecer vs commit anterior |
| `fix` | `>= 0` (opcional) | NO requiere scenario nuevo |
| `derive` | `>= 1` REQUIRED en cap hijo | `parent_cap.derives_capabilities[]` lista hijo |

Enforce point: `scripts/reconcile_capabilities.py --validate-ledger`. Pre-commit hook bloquea HARD en `main/release/*` + WARN en `wip/*` (advisory).

### Enforce reglas v3.2 (cement 2026-05-28 · bidirectional code↔cap mapping)

**Extiende v3.1 con bloques nuevos:** access + scenarios + business_rules.

| `cap_change_type` | `scenarios[]` (si user_visible: true) | `access` (si user_visible: true) | `business_rules` |
|---|---|---|---|
| `new` | `>= 1` REQUIRED (cement 2026-Q3 hard · advisory hasta entonces) | REQUIRED (cement 2026-Q3 hard) | OPTIONAL (advisory hasta 2026-Q4) |
| `extend` | si cap target tiene scenarios → append opcional | si nueva entry_point → REQUIRED | si nueva business rule → REQUIRED |
| `fix` | NO requiere cambio | NO requiere cambio | NO requiere cambio |
| `derive` | hijo hereda + customiza scenarios | hijo declara su access | hijo hereda + override |

**Cross-checks Fase F.3 v3.2:** además de los checks v3.1 anteriores, `/pm-{brand}` MUST verificar:

1. **Scenarios → e2e_test paths:** todos los `scenarios[*].e2e_test` declarados existen en filesystem (cross-check 3 · HARD)
2. **Access → roles:** roles declarados en `access.entry_points[*].requires_role` coinciden con `@require_phi_access` decorators del código asociado (cross-check 4 · advisory hasta resolver gap RBAC, ver lifecycle.md Fase 5.1)

> cross_check_1 y cross_check_2 (atomics↔headers) MUERTOS con atomics — ver `docs/process/lifecycle.md`.

Enforce point: `scripts/validate_code_cap_bidirectional.py` (cement 2026-05-28). Pre-push hook HARD bloquea si cross_check_3 drift > 0.

Doc canónico: `docs/process/capability-protocol.md` § Sección 11 (v3.2) + § Sección 13 (bidirectional validator).

## Escape valve — `defer_audit: true`

Caso de uso: Chris pausa auditoría por razón explícita. Schema en `checkpoint.md`:

```yaml
state: developed
phase: AWAIT_AUDIT_DEFERRED
defer_audit: true
defer_audit_reason: "ratificó pausa 2026-MM-DD: razón X"
defer_audit_ratified_by: chris
defer_audit_at: 2026-MM-DDTHH:MM:SS-05:00
```

Mientras true: `/dev-team` NO auto-handoff. `/pm-{brand}` bootstrap pingea deuda. WIP cap relax. Para nueva story requiere Chris ratify explícito.

Sin `defer_audit: true` el gate es ABSOLUTO.

## WIP cap post-decreto (hard rule · ★ v2 module-scoped 2026-05-28 ADR-009)

Bajo el modelo **hub único** (N sesiones / un worktree por marca), la unidad del cap dejó de ser "por worktree" y pasó a ser **por `code:{module}` bucket**: un build en vuelo por módulo. Stories de módulos distintos `developing` en paralelo sobre el mismo hub = OK (es lo que ADR-009 habilita). El bucket lock (`session-lock.sh`) serializa solo el mismo módulo.

| Estado | Cap default (v2) |
|---|---|
| `developing` | ≤ 1 por **`code:{module}`** (no por worktree) |
| `developed` | ≤ 1 por módulo (cerrar antes de otra del mismo módulo) |
| `reviewing` | ≤ 1 por módulo |
| `done` | ∞ (rolling 90d) |

Stories del MISMO módulo siguen secuenciales (A `done` ANTES de B del mismo módulo). SSoT del mecanismo: `.claude/rules/parallel-safety.md` M14 + `worktree-dual-strategy.md` § Regla cardinal v2 + `docs/architecture/luana-platform/ADR-009-single-hub-worktree.md`.

## Naming convention worktree

```
wip/{brand}-{story-padre-id}   # canónico
```

**NO** `wip/{brand}-slice-N-shipping` ni `wip/{brand}-misc` (ambiguos). `scripts/git/new-session.sh` valida story exista.

## Enforcement layers (defense-in-depth)

| Layer | Mecanismo |
|---|---|
| 1 | `/pm-{brand}` bootstrap Step 0 escanea stories developed/reviewing sin defer_audit |
| 2 | `/dev-team` Step 5 final auto-handoff explícito a `/auditor` |
| 3 | `/auditor` Phase D + Step 5 auto-handoff a `/pm-{brand}` merge |
| 4 | Hook `scripts/git-hooks/pre-commit` Section 12 bloquea stage files cross-story |
| 5 | `scripts/git/cleanup-session.sh` refuse remove worktree si stories no `done` |
| 6 | Template `06-tickets-template.yaml` `gherkin_coverage` mandatory |
| 7 | Template `07-merge-template.md` 5 secciones REFUSE merge si missing |

## Anti-patterns (top 5)

- ❌ `/dev-team` cierra ticket final + state=developed + arranca otro ticket de story distinta en mismo worktree (este es el bug origen)
- ❌ `/pm-{brand}` ofrece menú "nueva story" cuando hay story pendiente audit sin defer_audit
- ❌ `/auditor` cierra APPROVED sin emitir handoff explícito a `/pm-{brand}` merge
- ❌ Worktree branch nombrado ambiguo (hospedó 2 stories)
- ❌ `defer_audit: true` sin razón documentada + ratificación Chris

Lista completa (10 items) + ejemplos caso origen + cross-reference brand-docs-schema R2 archive: `docs/rules-detail/story-closure-gate.md`.

## Referencias

- `docs/rules-detail/story-closure-gate.md` — **detalle completo** (07-merge schema, gherkin_coverage, examples)
- `docs/process/story-closure-gate.md` — rationale + case study
- `docs/architecture/luana-platform/ADR-006-story-closure-gate.md` — decisión
- `docs/process/pm-redesign-2026-05.md` — paradigm v4 (Conv 3 auto-default)
- `.claude/rules/brand-docs-schema.md` § R2 — archive path canónico
