# Auditor Self-Fix Policy (paradigm v4.2 cement 2026-05-28)

> **Slim stub (context-rot pass 2026-05-30).** Detalle operativo completo (whitelist v4.1 17 categorías, NEVER list, workflow Step 3 Casos B/C/D, spawn templates, T-{n}-review.md schema, caps, justificación) en `docs/rules-detail/auditor-self-fix-policy.md` — load on-demand. **Origen:** v4.1 2026-05-19 (híbrido por naturaleza). **v4.2 cement 2026-05-28:** 3 carriles por NATURALEZA DE LA VERIFICACIÓN (no tamaño).

## Regla cardinal — decision tree (3 carriles)

```
¿El fix requiere ESCRIBIR un test NUEVO? (comportamiento NO cubierto)
├─ SÍ  → CARRIL B: SPAWN dev-team (TDD RED→GREEN). Auditor NUNCA escribe tests.
└─ NO  → ¿Categoría STAKE-ASIMÉTRICO?
         (security/auth/tenant_id/PII/migration/prompt-slot/eval-goldens/
          state-machine/engine core/cross-brand/meta-paradigm)
        ├─ SÍ  → CARRIL C: ESCALATE Chris
        └─ NO  → CARRIL A: SELF-FIX gate-verified.
                 Fix → re-correr gate-runner COMPLETO. ALL GREEN → audit-passed.
                 RED tras cap (5 iter) → CARRIL B.
```

**Caveat AGENTIC:** Carril A solo para mecánico (lint/format/typo/import). Todo lo que toca comportamiento del agente (prompt slots, eval goldens, state machine, voice) → Carril B siempre.

**Caps v4.2:** `self_fix_iter` ≤ 5 (Carril A) · `audit_iterations` ≤ 4 total · wall-clock ≤ 30 min.

## Cuándo carga el detalle

- Sub-auditor necesita la whitelist de 17 categorías v4.1 (subconjunto válido de Carril A)
- NEVER list completa (16 categorías de categorías prohibidas al self-fix)
- Spawn templates Carril B (prompt `mode: AUDITOR_AUTO_FIX_LOOP` verbatim)
- T-{n}-review.md schema + documentación obligatoria por iter

## Anti-patterns (top 3 — lista completa en el detalle)

- ❌ Auditor escribe un test nuevo (`.test.*`/`.spec.*`/`test_*.py`) — viola TDD del dev-team (Carril B siempre)
- ❌ Carril A sin citar el test existente que verifica el fix (si no existe → es Carril B)
- ❌ Carril A en categoría stake-asimétrico (security/tenant/PII/migration/prompt/engine/cross-brand)

## Referencias

- `docs/rules-detail/auditor-self-fix-policy.md` — **detalle completo** (v4.1 whitelist + v4.2 carriles + workflow + templates)
- `.claude/skills/auditor/SKILL.md` Step 3 — consume esta rule
- `.claude/agents/auditor-{backend,frontend,agentic}.md` — sub-auditores con Edit (Carril A)
- `.claude/skills/dev-team/SKILL.md` Step 2C — recibe handoff `mode: AUDITOR_AUTO_FIX_LOOP` (Carril B)
- `.claude/rules/tdd-mandatory.md` · `.claude/rules/story-closure-gate.md`
- `docs/process/audits/2026-05-28-agentic-machinery-audit.md` § 1 — análisis costo/tensión
