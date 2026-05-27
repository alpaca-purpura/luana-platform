# Auditor Downstream Regression Scope (Multibrand)

**Origen:** PI-12 S1 Story A T-1 (2026-05-04). Cost_recorder PASS pero downstream tests no corridos → bug llegó a S1. Severidad: CRÍTICA.

**Detalle completo + tabla SSoT 9 secciones (A-I) + workflow auditor verbatim + ejemplos cross-brand mirror + engine edit detection + pre-commit freshness gate + anti-patterns + casos origen:** `docs/rules-detail/auditor-downstream-regression.md` + tabla en `docs/rules-detail/auditor-downstream-targets.md`. Auditores leen on-demand vía Read tool durante Step `downstream_regression_scope`.

## Regla cardinal

Cuando auditor reviewing PR toca código `core/luana-core-*/` (engine), brand extension (`{brand}/backend/src/modules/{brand}/...`), o módulo con consumers cross-brand conocidos, MUST:

1. **Engine edit detection** — verificar promotion proposal (si toca `core/luana-core-*/src/`). Ausente → FAIL.
2. **Cross-brand mirror scan** — detectar duplicación (si toca brand extension). Match → FAIL automático.
3. **Downstream test run** — ejecutar tests cross-consumer per tabla SSoT (`docs/rules-detail/auditor-downstream-targets.md`).

**Convención:** `${WS}` = workspace root. `${BRANDS}` = `{vitalia, nicolify, comunify, lupulo}`.

## Workflow auditor (Step `downstream_regression_scope`)

```
1. git diff HEAD~N..HEAD --name-only
2. Per path infer scope:
   - core/luana-core-X/src/  → scope=ENGINE → verify proposal docs/promotion-protocol/proposals/*-X-*.md
                                              con state ∈ {accepted, migrated}
                                              + lookup downstream en tabla SSoT
   - {brand}/backend/src/modules/{brand}/{copilot,sales_agent}/  → cross-brand mirror scan ∀ otro brand
   - {brand}/.claude/rules/  → brand overlay scope (verify no contradiction con root rules)
3. Lookup downstream_test_targets en docs/rules-detail/auditor-downstream-targets.md (Read on-demand)
4. Si gate-output.json scope no cubre → spawn gate-runner adicional scoped
5. Verdict per cat appropriate (Cat 10 Tests, Cat 12 anti-duplication)
```

## Cross-brand mirror detection (algoritmo verbatim)

```bash
WS=/home/chalreme/Proyectos/luana-platform
BRAND_A=<brand inferido>
BASENAME=$(basename "$TARGET_PATH")

for OTHER_BRAND in vitalia nicolify comunify lupulo; do
  [ "$OTHER_BRAND" = "$BRAND_A" ] && continue
  find ${WS}/$OTHER_BRAND/backend/src -name "$BASENAME" 2>/dev/null
done
```

Match con diff conceptual >50% → **FAIL AUTOMÁTICO**: "Pattern debe vivir en `core/luana-core-*/`. Escalar `/pm-luana` proposal `docs/promotion-protocol/proposals/{date}-lift-{pattern}.md`."

## Engine edit detection (verificación obligatoria)

```bash
PKG=$(echo "$TARGET_PATH" | sed -nE 's#^core/luana-core-([^/]+)/.*#\1#p')
grep -E '^state:\s*(accepted|migrated)' docs/promotion-protocol/proposals/*${PKG}*.md
```

Sin proposal accepted → **FAIL**: "Engine edit sin promotion proposal. Escalar `/pm-luana`."

## Pre-commit freshness gate

Hook `scripts/git-hooks/pre-commit` Section 4 detecta nuevos archivos en:
- `^core/luana-core-[^/]+/src/luana_core_[^/]+/.+\.py$` → require row en tabla SSoT
- `^[a-z]+/backend/src/shared/.+\.py$` → require row + cross-brand mirror check
- `^backend/src/shared/.+\.py$` → LEGACY pre-multibrand, BLOQUEA + redirect a `core/luana-core-*/`

Escapes: agregar row a tabla SSoT, o `# downstream-regression-na: <reason>` magic comment.

## Enforcement layers

| Layer | Mecanismo | Owner |
|---|---|---|
| 1 Auditor agent | Step `downstream_regression_scope` MANDATORY post `consume_gate_output` | `auditor-{backend,agentic}` |
| 2 /auditor SKILL | Step 2 prompt sub-auditor referencia esta rule + reference doc | `/auditor` skill |
| 3 Reviews | T-{n}-review.md sección "Downstream regression" obligatoria | sub-auditor |
| 4 Self-audit | Si caso origen D4 reproduce — verdict FAIL automático | sub-auditor |

## Anti-patterns prohibidos (top 5)

- ❌ APPROVED PR `core/luana-core-observability/` sin run downstream tests engine + ∀ brand consumer
- ❌ APPROVED PR `core/luana-core-llm/` sin run consumers cross-engine + cross-brand
- ❌ APPROVED PR enum `core/luana-core-platform/.../enums/` sin grep importers + run tests
- ❌ APPROVED PR `core/luana-core-*/src/` sin verificar promotion proposal accepted/migrated
- ❌ APPROVED PR `{brand_A}/.../modules/{brand_A}/` con código que mirrorea `{brand_B}/.../modules/{brand_B}/`

Lista completa anti-patterns (11 items) + ejemplos CORRECTO/INCORRECTO + brand overlay scope: `docs/rules-detail/auditor-downstream-regression.md`.

## Referencias

- `docs/rules-detail/auditor-downstream-regression.md` — **detalle completo** (workflow verbatim, examples, scopes, layers)
- `docs/rules-detail/auditor-downstream-targets.md` — **tabla SSoT secciones A-I** (load on-demand por auditor)
- `.claude/rules/anti-duplication.md` — inventario shared abstractions engine
- `.claude/rules/anti-default-flip-audit.md` — Step 1 grep tests path viejo
- `docs/promotion-protocol/README.md` — workflow brand→core lift gate
- `docs/portfolio/PORTFOLIO.md` — vista master 11 universos
