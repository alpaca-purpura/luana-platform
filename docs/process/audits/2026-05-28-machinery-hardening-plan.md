# Plan de implementación — machinery hardening (post-auditoría 2026-05-28)

> Deriva de `docs/process/audits/2026-05-28-agentic-machinery-audit.md` § 6.
> **Worktree:** in-sitio `wip/vitalia` (Fase solo-bootstrap, `SCOPE_GATE_SKIP=1` + razón en commit). El worktree `protocol` prolijo requeriría primero merge vitalia→main (49 commits ahead) — decisión aparte de Chris.
> **Ratificado por Chris:** 2026-05-28 ("todo el plan, secuencial").
> **Naturaleza:** cross-cutting (`.claude/`, `docs/`, `scripts/`).

## Secuencia (6 fases · 11 items)

| Fase | Items | Severidad | Gate de avance | Estado |
|---|---|---|---|---|
| **0 — Quick-wins** | 1 atomics→scenarios (3 rules) · 2 greps multibrand (2 skills) · 3 contradicción Caso B | 🔴 CRÍTICO | grep limpio | ✅ DONE |
| **1 — Architect handoff** | 4 bloque `assignment` + dispatch-plan-template + reconcile CONTRACT/03-arch · 11 stale T-result + chrome-devtools | 🟠/🟡 | template valida | 🔄 en curso |
| **2 — Self-fix auditor** | 5 rediseño 3-carriles + Edit a sub-auditores + sin re-spawn | 🟠 | **RATIFICAR Chris** | ⏸ pausa |
| **3 — Rigor builder** | 9 skill `test-design-doctrine` (primero) · 6 step `technical_design` + gate orden TDD | 🟠 | builder agents actualizados | ⏳ |
| **4 — Punteros cap↔código** | 7 builders leen cap YAML + `# cap:` headers · 10 `// cap:` en 562 FE | 🟠/🟡 | validator cc3 verde | ⏳ |
| **5 — Anti-drift lock-in** | 8 `validate_templates_vs_rules.py` + lint paths skills + pre-commit | 🟡 | corre sobre todo lo anterior | ⏳ |

## Razón del orden
- **0 primero** — landmines vivos hoy (atomics auto-load alucina, NO-NEW-LAYER no-op).
- **1 antes de 5** — los templates deben estar correctos antes de construir el validador que los chequea.
- **9 antes de 6** — el step `technical_design` referencia la doctrina de testing.
- **2 con pausa** — cambio de política (no mecánico); Chris da forma al diseño antes de codear.
- **8 al final** — lock-in que valida todo + previene regresión futura (el drift template↔rule fue el bug-class #1 de esta auditoría).

## Criterios de aceptación por fase
- **0:** `grep -i atomic` en rules auto-load solo devuelve notas "MUERTO"; greps de architect resuelven en filesystem; guardrail Caso B condicional al motivo del spawn. ✅
- **1:** cada ticket del template tiene bloque `assignment`; existe `dispatch-plan-template.md`; T-result-template sin `git push origin development` ni paths PI-N; chrome-devtools-verify resuelto.
- **2:** política reescrita a 3 carriles; sub-auditores con Edit + policy; carril A re-corre gates sin re-spawn full; agentic conservador documentado.
- **3:** skill/rule test-design-doctrine existe; los 3 builders tienen step `technical_design` con gate; auditor verifica 1ª entrada bitácora = RED.
- **4:** builder Step 1 lee cap YAML del cap_target; builders agregan headers; 562 FE stampeados; cc3 verde.
- **5:** `validate_templates_vs_rules.py` falla ante drift sintético; lint de paths corre en pre-commit; suite verde.

## Tracking
Tasks #1-#6 en el task list de la sesión.
