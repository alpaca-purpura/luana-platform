# Anti-Default-Flip Audit

**Origen:** failed `/pase-produccion` 2026-05-04 (commit `64738354` flipeó `USE_OUTBOX_PATTERN_*` False→True sin auditar → 25 BE failures + ~3h investigación + ~500k tokens).

**Detalle completo (4 steps verbatim con grep/test/run commands cross-brand + ejemplos CORRECTO/INCORRECTO commit body + multibrand awareness detail):** `docs/rules-detail/anti-default-flip-audit.md`.

## Regla cardinal

ANTES de flipear default de feature flag (`USE_*_PATTERN_*`, `LITELLM_PROXY_ENABLED`, `USE_DEEPAGENTS_*`, `ENABLE_*`, etc.) que cambia call path side-effect (events, persistence, logging, observability, LLM provider routing, agent orchestration) → **OBLIGATORIO 4 STEPS**:

### Step 1 — Grep tests path viejo (cross-codebase, multibrand)

```bash
WS=$(git rev-parse --show-toplevel)
grep -rn "<legacy_call_path>" \
  ${WS}/core/luana-core-*/tests/ \
  ${WS}/{nicolify,vitalia,comunify,lupulo}/backend/tests/ \
  2>/dev/null | grep -v __pycache__
```

Output capture obligatorio en commit body sección `## Tests audited`.

### Step 2 — Update mocks path nuevo

Per test detectado: migrar mocks al `<new_canonical_path>`, o capturar via observability/persistence sink, o bypass explícito (magic comment `# arch-bypass: testing legacy capability`).

### Step 3 — Run full suite con AMBOS valores flag

```bash
# Core package affected:
cd ${WS}/core/luana-core-{pkg} && ${WS}/.venv/bin/pytest -x -q
USE_FLAG=false ${WS}/.venv/bin/pytest -x -q

# Cada brand consumer activa:
for B in nicolify vitalia comunify lupulo; do
  cd ${WS}/${B}/backend && ${WS}/.venv/bin/pytest -x -q
  USE_FLAG=false ${WS}/.venv/bin/pytest -x -q
done
```

Ambos valores 100% en core + todas las brands. UNO falla → STOP.

### Step 4 — Documentar commit body

```
flag <NAME> flipped <OLD>→<NEW>

## Tests audited
- N tests migrated to new canonical path
- M tests use bypass for legacy capability (magic comment)
- 0 tests use `monkeypatch.setattr(<flag>=<old>)` band-aid

## Path old: <full>
## Path new: <full>
## Verification: pytest passed both values (logs attached)
```

## Inventario flags side-effect (SSoT — actualizar al agregar nuevos)

| Flag | Default actual | Side-effect path | Path viejo → Path nuevo |
|---|---|---|---|
| `USE_OUTBOX_PATTERN_SALES_AGENT` | `True` (post 2026-04-29) | events emission | `EventBus.publish` → `outbox.adapter_bus.publish` |
| `USE_OUTBOX_PATTERN_COPILOT` | `True` (post 2026-04-29) | events emission | idem |
| `USE_OUTBOX_PATTERN_BRAND` | `True` (post 2026-04-29) | events emission | idem |
| `USE_OUTBOX_PATTERN_DEFAULT` | `False` | events emission fallback | idem |
| `USE_DEEPAGENTS_*` (futuros) | TBD | agent orchestration | LangGraph plain → deepagents `task` |

> Note: `LITELLM_PROXY_ENABLED` row removed PI-12 S1 T-5 (legacy adapters deleted T-4 — proxy is only runtime LLM dispatch path).

**Cuando agregar nuevo flag side-effect → editar este inventario en mismo commit.**

## Anti-patterns prohibidos

- ❌ Flipear default sin grep tests path viejo (Step 1)
- ❌ Flipear default sin run full suite con ambos valores (Step 3)
- ❌ Commit body sin sección "Tests audited" (Step 4)
- ❌ Mockear path viejo cuando flag default es path nuevo (passes silenciosamente)
- ❌ `monkeypatch.setattr(USE_*=False)` band-aid sin migrar mock (D2 PI-11)
- ❌ Bypass arch fitness sin magic comment justificado
- ❌ Agregar nuevo flag side-effect sin actualizar inventario SSoT

## Enforcement layers (7)

| Layer | Mecanismo | Owner |
|---|---|---|
| 1 PM PR.md | Bloque "Default flips audited" cuando aplique | `/pm-{brand}` o `/pm-luana` (si core) |
| 2 Architect CONTRACT.md | "Tests audit: paths mockeados antes/después" si propone flip | `/architect` |
| 3 Builder Step 0 | Grep tests path viejo antes flip code cross-core + brands | `/dev-team` (builder-*) |
| 4 Auditor Cat review | Cat 14 (business) / Cat 13 (agentic) "Default flip coverage" | auditor-{backend,agentic} |
| 5 Arch fitness test | `test_no_legacy_eventbus_mock_when_outbox_on.py` bloquea automatic | engine + brand tests/architecture/ |
| 6 TDD rule | `.claude/rules/tdd-mandatory.md` § "Default flag flips" obligatoria | `/pm-*` |
| 7 Runtime warning | `LegacyEventBus.publish` DeprecationWarning cuando flag True | `core/luana-core-events/` |

## Penalizaciones

- Builder skip Step 1 grep → REVERT
- Auditor skip Cat 14/13 → re-audit
- Architect CONTRACT sin "Tests audit" si propone flip → REJECT
- Arch fitness violation = build fail (gate hard)
- Skip inventario update al agregar nuevo flag → process-learnings.md case study

## Multibrand awareness

- Flag flip en `core/luana-core-*/` → impacto cross-brand. Auditar suites de **todas** las brands consumer activas + core
- Flag override per-brand en `{brand}/config/brand.yaml` → audit scope = sólo esa brand + arch tests
- Promotion gate: flip que afecta `core/` requiere `/pm-luana` ratification (ver `docs/promotion-protocol/README.md`)
- Brands futuras (saasora, inmoflow, retailly, fixia, guestly, fitflow) deben revalidar este inventario al opt-in

## Referencias

- `docs/rules-detail/anti-default-flip-audit.md` — **detalle completo** (ejemplos CORRECTO/INCORRECTO + caso origen)
- `.claude/rules/anti-duplication.md` — análogo defense in depth (cross-module mirror detection)
- `.claude/rules/tdd-mandatory.md` § Default flag flips
- `.claude/rules/auditor-downstream-regression.md` — Step 1 grep tests path viejo (ortogonal)
- `docs/promotion-protocol/README.md` — workflow brand→core lift gate
