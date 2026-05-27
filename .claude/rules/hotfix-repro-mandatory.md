# Hot-fix Repro Mandatory

**Origen:** PI-12 S1 T-1.bis (2026-05-05). Handoff doc misdiagnosed bug — sin repro local, ~$8 USD wasted en builder Opus wrong scope.

**Detalle completo (workflow 4 steps verbatim + caso origen detallado + ejemplo schema repro_evidence + multibrand awareness):** `docs/rules-detail/hotfix-repro-mandatory.md`.

## Regla cardinal

ANTES de spawn `builder-{backend|agentic|frontend}` para hot-fix ticket originado en handoff/incident/escalation, `/dev-team` o `/po` MUST reproducir falla localmente y validar diagnóstico de scope antes de pasar al builder.

## Cuándo aplica (señales hot-fix)

Ticket con AL MENOS UNA:
- Title/context contiene: `bug`, `hot-fix`, `regression`, `incident`, `bis`, `revert`, `fix forward`
- Origin field menciona: `handoff doc`, `pase a producción failed`, `auditor escalation`, `customer report`
- Spec describe symptom (no design from scratch) + propone scope quirúrgico (1-3 files, ≤2h)
- Sub-numero `T-N.bis` (per R8 convention)

## Workflow obligatorio (4 steps)

### Step 1 — Reproducción local

```bash
WS=$(git rev-parse --show-toplevel)

# Brand-specific bug:
cd ${WS}/{brand}/backend && ${WS}/.venv/bin/pytest <repro test paths> -v --tb=short

# Engine bug (core/luana-core-*/):
cd ${WS}/core/luana-core-{pkg} && ${WS}/.venv/bin/pytest <repro test paths> -v --tb=short
```

FAIL → confirma symptom. PASS → handoff desactualizado, STOP escalate.

### Step 2 — Diagnóstico real

Compara symptom observado vs root cause propuesto en handoff:

- ✅ **Match**: handoff VALIDADO. Proceed con scope.
- ⚠️ **Mismatch**: handoff MISDIAGNOSED. STOP. Document "Diagnosis correction" en T-{n}-impl-log.md. Re-redactar ticket spec.
- ❌ **No repro**: bug ya fixed o doc desactualizado. STOP. Cierra ticket `superseded` o escalate.

### Step 3 — Cite repro evidence en spec/ticket

Ticket entry en `04-tickets.yaml`:

```yaml
repro_verified: true
repro_evidence:
  brand: "nicolify"   # o "core/luana-core-<pkg>" si engine
  command: "cd ${WS}/nicolify/backend && ${WS}/.venv/bin/pytest tests/X/test_y.py::test_z -v"
  output: |
    AssertionError: '>' not supported between NoneType and int
    at line 153 of test_y.py
  diagnosis_validates_handoff: false
  diagnosis_correction: "Real cause is X, NOT Y as handoff suggested"
```

### Step 4 — Spawn builder

Builder spawn MUST cite `repro_verified: true` en prompt. Si `repro_verified: false` o ausente → `/dev-team` REFUSE spawn con error citado a esta rule.

## Anti-patterns prohibidos

- ❌ Builder spawn con scope tomado de handoff doc sin reproducción local
- ❌ Repro reportado pero `diagnosis_correction` omitida cuando diverge
- ❌ Spec ratifica handoff sin citar repro evidence verbatim
- ❌ Hot-fix ticket sin `repro_verified` field

## Enforcement layers

| Layer | Mecanismo | Owner |
|---|---|---|
| 1 | /po SKILL Step "Reproducción local" obligatorio en spec hot-fix | `/po` |
| 2 | /dev-team SKILL Step 0.5 "Verify repro_verified" antes spawn builder | `/dev-team` |
| 3 | 04-tickets template `repro_verified: bool` field documented | template |
| 4 | Auditor REVIEW Cat 11 verifica repro_verified citado | auditors |
| 5 | Builder agent prompt header check: `repro_verified: true` o magic ack | builder-* |

## Multibrand awareness

- Hot-fix brand-specific → reproducir en `{brand}/backend/` o `{brand}/frontend/` solamente
- Hot-fix engine (`core/luana-core-*/`) → reproducir en core package + al menos una brand consumer activa para validar ripple
- Ticket `repro_evidence.brand` field obligatorio para distinguir scope

## Referencias

- `docs/rules-detail/hotfix-repro-mandatory.md` — **detalle completo** (caso origen verbatim, workflow detail)
- `docs/process/process-improvement-handoff-2026-05-05.md` — handoff misdiagnosis case
- `docs/process/learnings.md` 2026-05-05 — T-1.bis closure
- `.claude/skills/{dev-team,po}/SKILL.md` — R26 enforcement
- `docs/specs/templates/04-tickets-template.yaml` § repro_verified
