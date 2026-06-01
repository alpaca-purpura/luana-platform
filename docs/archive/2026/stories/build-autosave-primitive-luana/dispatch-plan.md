# Dispatch plan — Story platform/build-autosave-primitive-luana

## autonomous_mode
- value: true
- ratified_by: chris ("encadena architect hasta el done", 2026-05-31)
- chain_if_true: [/dev-team → /auditor → /pm-luana merge]
- caps: { iterations_per_ticket: 10, audit_iter: 3, cost_usd: 4.00, walltime_min: 120 }
- on_cap_exceeded: "state=blocked + escalate Chris"
- safe_for_autonomous: true (FE lib · sin agentic prod · sin BE · Vitest determinista · contrato claro en ADR-012)

## Ticket → Agent → Model matrix
| T-id | Title | Surface | Agent | Model | Est. |
|---|---|---|---|---|---|
| T-1 | @luana schemas + hooks (useAutosave) + tests | FE-lib | builder-frontend | sonnet | ~45 min |
| T-2 | @luana ui-kit AutosaveBadge + consumer ref | FE-lib | builder-frontend | sonnet | ~35 min |
| T-3 | nicolify form-runtime rewrite (sin regresión) | FE-brand | builder-frontend | sonnet | ~40 min |
| Total | — | — | — | — | **~2h** |

## DAG
T-1 → T-2 → T-3 (secuencial)

## Scope visual / discipline
- NO toca presentación de pantallas existentes (vitalia adopción = aparte). AutosaveBadge usa tokens (contraste AA).
- nicolify form-runtime: invariante = comportamiento observable idéntico (tests existentes verdes antes/después).
- forbidden cross: core/luana-core-* (Python engine), vitalia/frontend (adopción aparte).

## Verificación
Librería → Vitest unit/component determinista (sin backend). El E2E real-backend vive en las stories de adopción
de brand (doctrina Verificación REAL). nicolify: tsc + vitest form-runtime verdes.

## Invocation autonomous
/dev-team platform build-autosave-primitive-luana   # T-1 → T-2 → T-3 → /auditor → /pm-luana merge
