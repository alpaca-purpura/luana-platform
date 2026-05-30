# Auditor Self-Fix Policy (paradigm v4.2 cement 2026-05-28)

**Origen:** v4.1 2026-05-19 (híbrido por naturaleza del fix). **v4.2 2026-05-28:** rediseño a **3 carriles por NATURALEZA DE LA VERIFICACIÓN** (no por tamaño). Motivo: el round-trip auditor→dev-team→re-audit pagaba ~80-110k tokens Opus por finding estructural (el sumidero real es el re-spawn full del sub-auditor), cuando el auditor (Opus) ya tiene el contexto cargado y los **gates mecánicos (lint/mypy/arch-fitness/coverage/jscpd) son verificación independiente y determinista**. Auditoría: `docs/process/audits/2026-05-28-agentic-machinery-audit.md` § 1.

**Consumed by:** `.claude/skills/auditor/SKILL.md` Step 3 + sub-auditores `auditor-{backend,frontend,agentic}` (ahora con tool `Edit` para Carril A).

**Detalle completo (carriles verbatim + NEVER list + workflow Step 3 + spawn templates + documentación T-{n}-review.md schema + caps):** `docs/rules-detail/auditor-self-fix-policy.md`.

## Insight cardinal (v4.2)

El riesgo del self-fix **NO es de capacidad del modelo** (Opus 4.8 no lo cambia) — es **estructural**: el mismo agente que detecta y arregla no puede verificarse a sí mismo (sesgo de confirmación). **PERO** los gates (lint, mypy strict, arch-fitness ratchet, coverage, jscpd dup-detection, tests EXISTENTES) son verificación independiente del actor. Entonces:

> El sesgo de confirmación solo muerde donde la corrección **requiere un test NUEVO** (comportamiento no cubierto). Si el fix está totalmente verificado por gates + tests existentes → self-fix + re-correr gates ES verificación independiente. **Esa es la línea correcta — no el tamaño del fix.**

## Regla cardinal — decision tree (3 carriles)

```
¿El fix requiere ESCRIBIR un test NUEVO? (comportamiento NO cubierto por un test existente)
├─ SÍ  → CARRIL B: SPAWN dev-team (TDD RED→GREEN). Auditor NUNCA escribe tests.
└─ NO  → ¿Categoría STAKE-ASIMÉTRICO? (security/auth/tenant_id/PII/migration/
         prompt-slot/eval-goldens/state-machine/engine core/cross-brand/meta-paradigm)
        ├─ SÍ  → CARRIL C: ESCALATE Chris (o dev-team, o 2º auditor independiente)
        └─ NO  → CARRIL A: SELF-FIX gate-verified.
                 Aplicar fix → re-correr gate-runner COMPLETO (mecánico, independiente).
                 ALL GREEN → audit-passed (SIN re-spawn full del sub-auditor).
                 RED tras cap → CARRIL B.
```

**Cambio clave vs v4.1:** se eliminó la rama "≥3 archivos O lógica de negocio → spawn" y el cap duro "≤2 files/≤10 líneas". El criterio de Carril A ya NO es el tamaño — es **"¿lo verifica un gate/test existente?"**. El tamaño era un proxy malo (un fix de 1 línea puede ser un branch crítico; un fix de 30 líneas en 3 archivos puede estar 100% cubierto por tests existentes).

## Carril A — gate-verified self-fix (el sub-auditor mismo, con Edit)

Aplica cuando **TODAS**:
1. NO hace falta un test nuevo — el comportamiento afectado YA está ejercitado por un test existente (el auditor lo cita: `path::test_fn`). Si no encuentra el test que lo cubre → NO es Carril A → va a B.
2. NO es categoría stake-asimétrico (ver Carril C).
3. El fix vive en el surface del sub-auditor (BE/FE/agentic) — NUNCA cross-surface.

Verificación = **gate-runner completo re-corrido** (lint + format + mypy + arch-fitness + coverage + jscpd + tests asociados). El sub-auditor NO se re-audita a sí mismo categoría-por-categoría (eso era el desperdicio): los gates son el verificador independiente.

Ejemplos típicos Carril A (antes iban a round-trip caro): empty/error-state UI faltante con test de componente existente · condición invertida cubierta por test que ejercita ambas ramas · `response_model=` no cableado con DTO ya definido en spec · off-by-one cubierto por test de borde · import/lint/format/typo/docstring/spanish-neutro/currency-locale (todo lo de la ex-whitelist v4.1).

**Caveat AGENTIC (auditor-agentic conservador):** Carril A en agentic se limita a **mecánico** (lint/format/typo/import/docstring/observability-write faltante con `try/except`). TODO lo que toque comportamiento del agente — prompt slots, eval goldens, state machine, tool logic, voice — va a **Carril B (builder-agentic)**. Razón: los "gates" agénticos (eval goldens, pass^k) son **no-deterministas** → un self-fix podría sobre-ajustar el golden al fix.

## Carril B — needs-new-test (spawn dev-team)

Cuando el fix requiere un test nuevo (comportamiento no cubierto) → spawn dev-team `mode: AUDITOR_AUTO_FIX_LOOP`. dev-team es dueño del TDD: escribe el test RED→GREEN + el fix. Preserva la disciplina RED→GREEN y la **calidad del test** (un test escrito por quien aprobó el código se diseña al fix, no al spec → confirmation bias). También entra acá cualquier refactor estructural genuino que ningún test existente cubra.

## Carril C — stake-asimétrico (escalate)

NUNCA self-fix (la consecuencia de equivocarse es asimétrica y los gates no la capturan del todo):
security/auth · `tenant_id` filter · PII (`response_model` que expone) · migrations · prompt slots · eval goldens · state machine agéntica · `core/luana-core-*/src/` (→ `/pm-luana` lift gate) · `{other_brand}/...` (→ /pm-luana) · `.claude/{skills,rules}/` o `docs/{process,architecture,specs}/` (meta-paradigma). Acción: ESCALATE Chris. Opción para findings de seguridad/arquitectura: **2º auditor Opus independiente** como verifier (el costo se justifica por el stake).

## Caps absolutos (v4.2)

| Métrica | Cap | Acción al exceder |
|---|---|---|
| `self_fix_iter` (Carril A) por ticket | 5 | → Carril B (spawn dev-team) |
| `audit_iterations` totales por ticket | 4 | ESCALATE Chris |
| Tiempo wall-clock audit cycle | 30 min | escalate "stuck" |
| ~~Files/líneas por iter~~ | **ELIMINADO** | el verificador es el gate, no el tamaño |

## Por qué esto da más confianza (no menos)

- **Verificación independiente preservada** donde importa: los gates mecánicos no son cómplices del auditor. Y donde los gates NO bastan (test nuevo, seguridad) → sigue el round-trip / escalate.
- **Menos round-trips** = menos pérdida de información (el finding comprimido en `T-{n}-review.md` siempre pierde el modelo mental del auditor) + menos costo (~30-60% por finding) + más rápido.
- **El sub-auditor Opus produce mejor fix** que el dev-team Sonnet en findings que ya tiene en su modelo mental — sin re-acquirir contexto.

## Anti-patterns (top 6)

- ❌ Auditor escribe un test nuevo (cualquier `.test.*`/`.spec.*`/`test_*.py`) — viola identidad TDD del dev-team (Carril B siempre)
- ❌ Carril A sin citar el test existente que verifica el fix (si no existe → es Carril B)
- ❌ Carril A en categoría stake-asimétrico (security/tenant/PII/migration/prompt/engine/cross-brand)
- ❌ auditor-agentic self-fix de prompt slot / eval golden / state machine (→ builder-agentic)
- ❌ Re-spawn full del sub-auditor en Carril A (los gates son la verificación — desperdicio ~40-50k Opus)
- ❌ Auditor edita `core/luana-core-*/` o `{other_brand}/` (HARD BAN permanente)

## Referencias

- `docs/rules-detail/auditor-self-fix-policy.md` — **detalle completo** (carriles + NEVER + workflow + templates)
- `.claude/skills/auditor/SKILL.md` Step 3 — consume esta rule
- `.claude/agents/auditor-{backend,frontend,agentic}.md` — sub-auditores con Edit (Carril A)
- `.claude/skills/dev-team/SKILL.md` Step 2C — recibe handoff `mode: AUDITOR_AUTO_FIX_LOOP` (Carril B)
- `.claude/rules/tdd-mandatory.md` · `.claude/rules/story-closure-gate.md` (Fase B/C)
- `docs/process/audits/2026-05-28-agentic-machinery-audit.md` § 1 — análisis costo/tensión
- `docs/architecture/luana-platform/ADR-007-paradigm-v4.1-autonomy.md` — decisión v4.1 (base)
