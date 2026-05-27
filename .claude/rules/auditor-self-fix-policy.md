# Auditor Self-Fix Policy (paradigm v4.1 cement 2026-05-19)

**Origen:** Conv 2026-05-19. Híbrido por NATURALEZA DEL FIX (no tamaño). **Consumed by:** `.claude/skills/auditor/SKILL.md` Step 3.

**Detalle completo (whitelist 17 categorías verbatim + NEVER list 16 items verbatim + workflow Step 3 Caso B/C/D con spawn templates verbatim + documentación T-{n}-review.md schema + justificación decision tree + caps absolutos detail):** `docs/rules-detail/auditor-self-fix-policy.md`.

## Regla cardinal — decision tree

```
¿El fix requiere ESCRIBIR un nuevo test (TDD RED→GREEN)?
├─ SÍ  → SPAWN dev-team. Auditor NUNCA escribe tests.
└─ NO  → ¿Toca ≥3 archivos O cambia lógica de negocio?
        ├─ SÍ  → SPAWN dev-team.
        └─ NO  → ¿Está en WHITELIST?
                ├─ SÍ  → SELF-FIX (cap 4 iter).
                └─ NO  → ESCALATE Chris (o /pm-luana si cross-brand/engine).
```

Cap absoluto **3 audit_iterations** totales por ticket → después ESCALATE.

## Whitelist self-fix permitido (17 categorías — top resumen)

1. Lint auto-fix (ruff/eslint) | 2. Format (ruff format/prettier) | 3. Import ordering
4. Typo en string user-facing | 5. Comentario decorativo eliminar | 6. Type annotation trivial faltante
7. Off-by-one en bound check | 8. Signo invertido en condición obvia
9. Default value incorrecto (spec lo cita) | 10. Log message corrección | 11. Magic comment add
12. Docstring trivial faltante | 13. Spanish neutro fix verbatim (per glosario)
14. Currency hardcoded → tenant_locale | 15. Missing `response_model=` con DTO existente
16. Import inutilizado eliminar | 17. Variable renombrada sin propagar 2-3 sites (no refactor estructural)

**HARD límite por iter:** MÁX 2 archivos + MÁX 10 líneas. Excede → spawn dev-team.

## NUNCA self-fix (16 items — top categorías)

1. **Escribir nuevo test** (cualquier `.test.*`, `.spec.*`, `test_*.py`) — TDD vive en dev-team
2. Cambiar/agregar branch lógico (`if/else/match/elif`)
3. Refactor 2+ archivos
4. Modificar SQL query / SQLAlchemy `select(...)` / migration / Pydantic DTO field / prompt slot
5. Modificar React Query keys/invalidation / Zod schema fields
6. Modificar wireframe / spec gherkin scenario
7. Security fix (auth, PII, tenant_id filter) — ESCALATE Chris
8. Architecture refactor — ESCALATE Chris
9. Touch `core/luana-core-*/src/` — requires `/pm-luana` promotion gate
10. Touch `{other_brand}/...` — cross-brand outcome /pm-luana
11. Touch `.claude/{skills,rules}/` o `docs/{process,architecture,specs}/` — meta-paradigm

Lista completa (16 items) + ejemplos: `docs/rules-detail/auditor-self-fix-policy.md`.

## Caps absolutos

| Métrica | Cap | Acción al exceder |
|---|---|---|
| `self_fix_iter` por ticket | 4 | Spawn dev-team Caso B |
| `audit_iterations` por ticket | 3 | ESCALATE Chris |
| Files modificados por self-fix iter | 2 | Refactor camuflado → spawn dev-team |
| Líneas modificadas por self-fix iter | 10 | idem |
| Tiempo wall-clock audit cycle | 30 min | escalate "stuck" |

## Workflow Step 3 — 3 casos

**Caso B (CHANGES_REQUESTED estructural):** spawn dev-team con prompt `mode: AUDITOR_AUTO_FIX_LOOP`, findings cited verbatim. Re-audit cuando dev-team termina. Cap 3 iter totales.

**Caso C (Self-fix whitelisted):** apply edit + re-run validators. GREEN → APPROVED. RED → escala Caso B. Cap 4 iter.

**Caso D (ESCALATED):** security/arch drift/cross-brand/engine sin proposal/spec ambiguity → STOP, `state: blocked`.

Spawn template Caso B + documentación T-{n}-review.md schema obligatorio (cada iter): ver detail doc.

## Documentación obligatoria en T-{n}-review.md

Cada audit iter MUST documentar: Verdict + Findings (N items con path:line + categoría) + Action taken + Re-audit cycle. Schema verbatim en detail doc.

## Anti-patterns (top 5)

- ❌ Auditor escribe un test (cualquier `.test.*` o `test_*.py`) — viola identidad TDD del dev-team
- ❌ Auditor "rápido fix" que toca 4 archivos porque "es trivial" — refactor camuflado
- ❌ Auditor self-fix de security/auth/tenant_id sin escalate
- ❌ Auditor edita `core/luana-core-*/` o `{other_brand}/` (HARD BAN)
- ❌ Auditor cap_reached (3 iter) sin escalate explícito

Lista completa (10 items): detail doc.

## Justificación clave

- **Whitelist por categoría (no tamaño)**: 1-line change puede ser branch lógico crítico O typo. Naturaleza define riesgo.
- **Auditor nunca escribe tests**: TDD discipline (RED→GREEN puro). Auditor tests = confirmation bias.
- **Cap 4 self-fix (vs 2 anterior)**: forward motion autonomy. Whitelist verbatim restringe scope.
- **Cap 3 audit_iterations**: >3 vueltas indica problema estructural → ESCALATE para refinar spec.

## Referencias

- `docs/rules-detail/auditor-self-fix-policy.md` — **detalle completo** (whitelist + NEVER + workflow + templates + justificación)
- `.claude/skills/auditor/SKILL.md` Step 3 — consume esta rule
- `.claude/skills/dev-team/SKILL.md` Step 2C — recibe handoff `mode: AUDITOR_AUTO_FIX_LOOP`
- `.claude/rules/tdd-mandatory.md` — TDD discipline
- `.claude/rules/story-closure-gate.md` — Fase B AUDIT + Fase C FIX-LOOP
- `docs/architecture/luana-platform/ADR-007-paradigm-v4.1-autonomy.md` — decisión cementada
