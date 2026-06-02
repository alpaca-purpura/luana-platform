# T-{n}-review.md — Template (auditor verdict)

> Owner: `/auditor` (Opus 4.8). Verdict por ticket.
> Auditor lee `T-{n}-handoff.md` + `T-{n}-result.md` + corre tests él mismo (no se fía).
> Self-fix permitido SOLO en triviales (lint, format, typo). Diseño/security/arch → escala.

---
ticket_id: T-1
story_id: STORY_ID
auditor_run: 1                                   # 1, 2, ... cap 2 → escala Chris
audited_at: 2026-05-04T17:30Z
auditor_model: claude-opus-4-8
verdict: APPROVED                                # APPROVED | CHANGES_REQUESTED | ESCALATED
self_fix_applied: false
escalation_reason: null
---

## Resumen 1-frase

[Qué entregó el dev, sirve para el story, qué aprueba/rechaza.]

## Acceptance verification (re-corrido por auditor)

| ID | Criterio | Re-verified | Resultado |
|---|---|---|---|
| A1 | POST happy → 200 | `pytest ... PASSED` (yo corrí) | ✅ |
| A2 | Cross-tenant → 403 | `pytest ... PASSED` | ✅ |
| A3 | Migration idempotente | `alembic upgrade head` x2 → OK | ✅ |
| A4 | Coverage no baja | 48.2% (>= 43%, baseline 47%) | ✅ |
| A5 | Spanish neutro | grep + manual review user-facing strings | ✅ |

## Quality gates re-corridos

```
$ /test-backend
[paste output literal]
[OK] All gates passed
```

## Code review categories

### Cat 1 — DDD inside-out

- ✅ Layers respetadas: domain pure, infra impl repos, application services, api thin.
- ✅ Sin imports cross-módulo.
- ✅ Sin domain logic en api routes.

### Cat 2 — Tenant isolation

- ✅ Cada query filtra `tenant_id`.
- ✅ `get_by_id(tenant_id, id)` (no `get_by_id(id)`).
- ✅ Adversarial scenario passed (cross-tenant 403).

### Cat 3 — Master data + currency

- ✅ Si DTO monetario: `currency: str | None`.
- ✅ Datetimes: `DateTime(timezone=True)`.

### Cat 4 — Migrations

- ✅ Idempotente (`IF NOT EXISTS`).
- ✅ No `sa.Enum()` en `create_table`.
- ✅ Verificada con `make verify-migration-idempotency`.

### Cat 5 — Spanish neutro UI

- ✅ Sin voseo en strings.
- ✅ Tildes correctas.

### Cat 6 — PII

- ✅ Response model excluye PII raw o usa mask.
- ✅ Audit log sanitiza payloads.

### Cat 7 — Test coverage + quality

- ✅ Coverage del módulo ↑ 6%.
- ✅ Tests cubren happy + negative + edge + adversarial.
- ✅ Tests usan `tempfile`/factories, no mocks excesivos.

### Cat 8 — Anti-duplication

- ✅ No mirror code de otros módulos. Si pattern compartido → lift `shared/`.
- ✅ Verificado contra inventario `anti-duplication.md`.

### Cat 9 — Code quality

- ✅ Naming consistente.
- ✅ Sin TODO/FIXME no contextualizados.
- ✅ Sin `# noqa` sin justificación.

### Cat 10 — Architecture fitness

- ✅ Arch tests pasan.
- ✅ Allowlists shrink (no agregadas entries nuevas).

### Cat 11 — Documentation

- ✅ Docstrings en funciones públicas.
- ✅ `product/modules/{m}.md` actualizado si aplica (en `07-merge.md`).

### Cat 12 — Cross-brand mirror (anti-duplicación cross-marca)

- ¿El diff replica un patrón que ya vive en `core/luana-core-*` (debió consumirse vía import) o en otra brand (`{brand}/backend|frontend/src`)?
- Match >50% con código de otra brand → **FAIL** (lift a engine vía `/pm-luana`, no mirror).
- Ver `.claude/rules/anti-duplication.md` + `.claude/rules/auditor-downstream-regression.md`.

### Cat 13 — Connectivity (anti-isla · Critical Rule #33)

- ¿La salida cumple las 4 contenciones CONN? **C**onsumed (≥1 consumidor real) · **O**n the map (cap YAML con hogar) · **N**avigable (reachability path concreto) · **N**otarized (cableado: `include_router`/nav/tool registry/EP-N/DI).
- Falta alguna de las 4 → isla → **FAIL** (no llega a `done`). Ver `.claude/rules/anti-orphan-integration.md`.

### Categoría 14 — Verificación live (DoD · Critical Rule #37)

- ¿Los scenarios críticos user-reachable se ejercieron LIVE contra dev-app (Chrome DevTools MCP) o hay evidencia `dod_evidence` registrada?
- ¿Los writes (POST/PATCH/PUT/DELETE) se ejercieron de verdad + se leyeron logs + se confirmó efecto en DB/UI?
- e2e que mockea el backend del surface bajo prueba = NO cuenta como live-verify (falso verde).
- **Ausencia de evidencia live en story con UI/endpoint → CHANGES_REQUESTED (no APPROVED).**

## Verificación live (Critical Rule #37 · `definition-of-done-live-verify.md`)

Los scenarios user-reachable de este ticket se ejercieron contra el stack dev real (`make dev-app-{brand}` / `localhost:300X`), no solo tests verdes:

```yaml
dod_live_verified: true|false
dod_env: "<make dev-app-{brand} → dev-app.{brand}lat.com (Chrome DevTools MCP) | localhost:300X>"
dod_evidence:
  - action: "<write/flujo real ejercido>"
    observed: "<efecto visible>"
    backend_log: "<status + sin traceback + efecto DB>"
```
> Un `GET 200` sobre un placeholder NO es verificación. Una e2e que mockea el backend del surface = falso verde.

## Self-fix log (si self_fix_applied = true)

> Solo TRIVIALES: lint, format, typo. NUNCA diseño/seguridad/arch.

- ❌ N/A para esta auditoría
- O: `fixed: ruff format src/modules/{m}/api/routes.py — 2 lines reformatted`

## Findings

> Si verdict=CHANGES_REQUESTED, listar cambios concretos requeridos.

- [ ] [Finding 1: archivo:línea — problema — fix sugerido]
- [ ] [Finding 2]

## Verdict

> **CHANGES_REQUESTED triggers automáticos:** ausencia de evidencia live (Categoría 14) en story con UI/endpoint → CHANGES_REQUESTED (no APPROVED).

**APPROVED** ✅

Razón: todos los acceptance criteria verificados, quality gates verde, code review 14 categorías OK, no hallazgos bloqueantes.

> O:
> **CHANGES_REQUESTED** ❌
> Razón: A2 falla (test_tenant_isolation devuelve 200 en vez de 403). Service no filtra tenant_id en repo.get(...). Ver finding #1.
> Iteración 1/2.

> O:
> **ESCALATED** 🚨
> Razón: tras 2 iteraciones, dev no logra cumplir A4 (coverage). Sospecho que diseño del service requiere refactor mayor.
> escalation_reason: "Service tiene complejidad ciclomática 18, requiere split en 2 use cases. Pasa fuera de mi autoridad."

## Output al orchestrator

```
APPROVED -> ver T-{n}-review.md
ticket state: audit-passed
```
