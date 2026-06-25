---
brand: nicolify
date: 2026-06-25
slug: fe-be-enum-drift-only-live-verify-catches
promotable: candidate
applies_to_other_brands_potentially: [vitalia, comunify, lupulo]
target_core_package: n/a (process/test-design lesson — contract-guard test pattern)
applied: applied
---

# Un enum FE que no espeja el enum BE = 422 invisible al verde — solo lo caza la live-verify (write real)

**Qué aprendimos:** El `<Select>` de "poder de decisión" del buyer de abel ofrecía valores genéricos (`high|medium|low|influencer`) que el BE **nunca** acepta — el enum BE (`DecisionPower`, modelo MEDDIC/SPIN) es `decisor_economico|champion|influencer_tecnico|aprobador|usuario|bloqueador`. Seleccionar cualquier opción → `PATCH /buyer/{id}` **422**. El bug vivió **shipped y verde** todo el ciclo: 344 tests FE GREEN, /auditor APPROVED, una live-verify previa "substancial" — porque **ningún test ejercía el write real del Select contra el BE** (los tests mockeaban el patch; la live-verify previa ejerció create/set-primary/mark-ready pero NO una selección de decision_power + su autosave). Lo cazó la live-verify de esta sesión (Chrome MCP, write real → 422 en los logs).

**Origen:** story `nicolify-r1-abel-icp-buyer`, live-verify 2026-06-25. Fix `a279e14e` (FE `DecisionPower` + zod `decisionPowerEnum` + `DECISION_POWER_OPTIONS` alineados al BE + **contract-guard test** que falla en tsc+runtime si la FE deja de cubrir un valor del BE). Era PRE-EXISTENTE (el `<select>` nativo, anterior a la kit-alignment, tenía el mismo mismatch — la kit-alignment es limpia).

**Why:** Es la **2ª vez** del mismo patrón (1ª: vitalia `embudo` — `2026-06-04-embudo-imagined-contract-never-integrated`). Un campo FE con un set de valores **imaginado** que no espeja el contrato BE pasa todos los gates de aislamiento (unit FE verde, unit BE verde, tipos FE coherentes consigo mismos) y solo rompe **cuando se cruzan de verdad** — el write real contra el BE. El verde es necesario, no suficiente (`verification-real-not-200` · `dod-live-verify` #37). Extiende [[verification-real-not-200]] · [[dod-live-verify]] y el caso embudo de vitalia.

**How to apply:**
- **Todo campo FE de tipo enum/select que mapea a un enum del BE** lleva un **contract-guard test** que ancla los valores FE al set del BE (hardcodeado con puntero al `domain/*.py::Enum`, type-level + runtime) → falla si divergen. Barato, mecánico, mata la clase entera.
- La **live-verify (#37) DEBE ejercer al menos un write por cada control que envía un valor de dominio** (selects/enums), no solo "create + un patch genérico" — el happy-path de cada control, mirando el log (no GET 200).
- Gap de harness candidato: un **contract-test FE↔BE generado** del OpenAPI del BE (los enums + shapes) que falle el gate si la FE manda algo fuera de schema — cerraría esta clase sin depender de que alguien se acuerde del guard (ver `HB-42`). Flag a `/pm-luana`.
