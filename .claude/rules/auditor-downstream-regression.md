# Auditor Downstream Regression Scope (Multibrand)

> **Slim stub (context-rot pass 2026-05-30).** Detalle operativo completo (workflow pseudocode 8 pasos verbatim, tabla SSoT secciones A-I, ejemplos CORRECTO/INCORRECTO, brand overlay scope, pre-commit freshness gate, enforcement layers, penalizaciones) en `docs/rules-detail/auditor-downstream-regression.md` + `docs/rules-detail/auditor-downstream-targets.md` — load on-demand. **Origen:** PI-12 S1 Story A T-1 (2026-05-04). Severidad: CRÍTICA.

## Regla cardinal

Cuando auditor reviewing PR toca `core/luana-core-*/` (engine), brand extension `{brand}/backend/src/modules/{brand}/...`, o módulo con consumers cross-brand conocidos, MUST ejecutar 3 checks en orden:

1. **Engine edit detection** — verificar promotion proposal accepted/migrated (si toca `core/luana-core-*/src/`). Ausente → FAIL.
2. **Cross-brand mirror scan** — detectar duplicación (si toca brand extension). Match diff >50% → FAIL automático.
3. **Downstream test run** — ejecutar tests cross-consumer per tabla SSoT (`auditor-downstream-targets.md`).

**Algoritmos rápidos (completos en el detalle):**

```bash
# Engine edit detection
PKG=$(echo "$TARGET_PATH" | sed -nE 's#^core/luana-core-([^/]+)/.*#\1#p')
grep -E '^state:\s*(accepted|migrated)' docs/promotion-protocol/proposals/*${PKG}*.md

# Cross-brand mirror scan
BASENAME=$(basename "$TARGET_PATH")
for OTHER_BRAND in vitalia nicolify comunify lupulo; do
  [ "$OTHER_BRAND" = "$BRAND_A" ] && continue
  find ${WS}/$OTHER_BRAND/backend/src -name "$BASENAME" 2>/dev/null
done
```

## Cuándo carga el detalle

- Lookup de `downstream_test_targets` por surface tocada (tabla SSoT secciones A-I)
- Workflow completo pseudocode 8 pasos (infer BRAND, scope=ENGINE vs BRAND, spawn gate-runner adicional)
- Ejemplos verbatim CORRECTO (caso origen D4 observability) + CORRECTO (cross-brand mirror scheduler_tool)

## Anti-patterns (top 3 — lista completa 11 items en el detalle)

- ❌ APPROVED PR `core/luana-core-*/src/` sin verificar promotion proposal accepted/migrated
- ❌ APPROVED PR `{brand_A}/.../modules/{brand_A}/` con código que mirrorea `{brand_B}/.../modules/{brand_B}/`
- ❌ APPROVED PR engine (observability/llm/platform enums) sin run downstream tests ∀ brand consumer

## Referencias

- `docs/rules-detail/auditor-downstream-regression.md` — **detalle completo** (workflow, ejemplos, scopes, layers)
- `docs/rules-detail/auditor-downstream-targets.md` — **tabla SSoT secciones A-I** (load on-demand por auditor)
- `.claude/rules/anti-duplication.md` — inventario shared abstractions engine
- `docs/promotion-protocol/README.md` — workflow brand→core lift gate
