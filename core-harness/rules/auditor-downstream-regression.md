# Auditor Downstream Regression Scope (Multibrand)

> **Slim stub (context-rot pass 2026-05-30).** Detalle operativo completo (workflow pseudocode 8 pasos verbatim, tabla SSoT secciones A-I, ejemplos CORRECTO/INCORRECTO, brand overlay scope, pre-commit freshness gate, enforcement layers, penalizaciones) en `docs/rules-detail/auditor-downstream-regression.md` + `docs/rules-detail/auditor-downstream-targets.md` — load on-demand. **Origen:** PI-12 S1 Story A T-1 (2026-05-04). Severidad: CRÍTICA. **tier: core (W5b 2026-06-09)** — la doctrina downstream-regression (engine-edit-detection · mirror-scan · downstream-tests) es agnóstica; los paths del engine + la lista de brands se escriben como `{slot}` (`{engine_prefix.python_glob}`, `{brands.active}`, resueltos del seam `project.config.yaml`). El bash verbatim + la tabla de targets (stack-specific) viven en `docs/rules-detail/`.

## Regla cardinal

Cuando auditor reviewing PR toca `{engine_prefix.python_glob}/` (engine), brand extension `{brand}/backend/src/modules/{brand}/...`, o módulo con consumers cross-brand conocidos, MUST ejecutar 3 checks en orden:

1. **Engine edit detection** — verificar promotion proposal accepted/migrated (si toca `{engine_prefix.python_glob}/src/`). Ausente → FAIL.
2. **Cross-brand mirror scan** — detectar duplicación (si toca brand extension). Match diff >50% → FAIL automático.
3. **Downstream test run** — ejecutar tests cross-consumer per tabla SSoT (`auditor-downstream-targets.md`).

**Algoritmos rápidos (el bash verbatim — sed del path del engine + loop sobre las brands — vive en el detalle):**

- **Engine edit detection** — extraé el paquete del path del engine (`{engine_prefix.python_glob}`) y verificá que su promotion proposal esté `accepted`/`migrated` en `docs/promotion-protocol/proposals/`. Ausente → FAIL.
- **Cross-brand mirror scan** — para **cada brand de `{brands.active}`** (≠ la del PR), buscá un archivo con el mismo `basename` bajo `{brand}/backend/src`. Match → posible mirror. (Brands resueltas del seam `project.config.yaml` vía `scripts/harness_config.py`; el `sed`/`for`/`find` exacto está en `docs/rules-detail/auditor-downstream-regression.md`.)

## Cuándo carga el detalle

- Lookup de `downstream_test_targets` por surface tocada (tabla SSoT secciones A-I)
- Workflow completo pseudocode 8 pasos (infer BRAND, scope=ENGINE vs BRAND, spawn gate-runner adicional)
- Ejemplos verbatim CORRECTO (caso origen D4 observability) + CORRECTO (cross-brand mirror scheduler_tool)

## Anti-patterns (top 3 — lista completa 11 items en el detalle)

- ❌ APPROVED PR `{engine_prefix.python_glob}/src/` sin verificar promotion proposal accepted/migrated
- ❌ APPROVED PR `{brand_A}/.../modules/{brand_A}/` con código que mirrorea `{brand_B}/.../modules/{brand_B}/`
- ❌ APPROVED PR engine (observability/llm/platform enums) sin run downstream tests ∀ brand consumer

## Referencias

- `docs/rules-detail/auditor-downstream-regression.md` — **detalle completo** (workflow, ejemplos, scopes, layers)
- `docs/rules-detail/auditor-downstream-targets.md` — **tabla SSoT secciones A-I** (load on-demand por auditor)
- `.claude/rules/anti-duplication.md` — inventario shared abstractions engine
- `docs/promotion-protocol/README.md` — workflow brand→core lift gate
