---
brand: comunify
story_id: comunify-design-system-a11y-contrast-cement
state: refined
phase: SPEC_RATIFIED
created: 2026-05-18
last_updated: 2026-05-20
parallel_safe: true
owner: /po-ux → /architect (next handoff)
surface: [frontend, design-system]
estimated_size: S+ (medium-small)
hot_fix: false
supersedes: comunify-warning-token-contrast-fix
ratified_by_chris: true
ratified_at: 2026-05-20
next_action: "/architect lee 01-spec.md → produce ready package (state=refined → ready)"
---

# Comunify — Design System a11y Contrast Cement — checkpoint

## State transitions

- 2026-05-18 → state=idea (spawned by auditor-frontend WARN of comunify-design-system-cement)
- 2026-05-20 → state=idea → refining (Chris ratificó refinement con scope expandido "auditar TODAS las parejas")
- 2026-05-20 → state=refining → **refined** (spec ratificada 3 batches loop, Chris autorizó "continúa hasta llegar al done")

## Scope cementado

- Slug renombrado: `comunify-warning-token-contrast-fix` → `comunify-design-system-a11y-contrast-cement`
- 10 pares WCAG AA failed identificados (6 críticos + 4 marginales)
- 5 tokens nuevos `*-text` para foreground sobre light bg (HSL principales del brandbook intactos)
- Camino B universal en botones (moderation card + dunning banner) — outline pattern bg/10 + border + text-{X}-text
- Arch fitness test bloquea 6 patrones HARD (opción C híbrida — critical y blue libres)
- 10 archivos a editar (~190 LOC added, ~25 modified)

## Spec ratificada — características

| Sección | Estado |
|---|---|
| 4 scenarios base (happy + negative + edge + adversarial) | ✅ |
| Sub-categoría mandatory accessibility | ✅ cubierta por SC-01..04 + axe |
| Sub-categorías NO aplicables declaradas | ✅ ratified_by_chris: true |
| Wireframes ASCII antes/después | ✅ moderation card + dunning banner |
| Estados visuales (idle/hover/focus/active/disabled) | ✅ |
| Componentes (0 nuevos) | ✅ solo migración Tailwind classes |
| Data flow | ✅ no aplica (CSS-only) |
| Microcopy | ✅ sin cambios |
| Responsive | ✅ sin cambios |
| Accessibility section | ✅ |
| Graders (4 tipos: e2e + axe + arch_fitness + visual_state) | ✅ |
| playwright_required en cada scenario funcional | ✅ |

## Refined gate checklist (v4.1)

- [x] 4 scenarios base
- [x] Sub-categoría a11y cubierta (mandatory para UI surface)
- [x] 6 sub-categorías NO aplicables declaradas con razón ratificada
- [x] Scenarios funcionales con `playwright_required: true`
- [x] Then verbs verificables (no vagos)
- [x] Graders declarados (4 tipos)
- [x] Wireframes inline ASCII
- [x] Estados visuales
- [x] Microcopy Spanish neutro (NO cambia — preserva baseline)
- [x] Componentes reuse > new (0 nuevos)
- [x] Responsive declarado (sin cambios)
- [x] Accessibility section presente

**Gate PASS ✅** — transition refining→refined ratificada.

## Bitácora

- 2026-05-18: spawned por auditor-frontend (WARN 1.80:1 `text-white` sobre `bg-comunify-warning` en cement)
- 2026-05-20 AM: tailwind-v4-tokens merged → story unblocked (utility classes ya emiten en bundle)
- 2026-05-20 PM: Chris invocó /po-ux con scope expandido "auditar TODAS las parejas"
  - Audit técnico ejecutado (22 pares calculados, 10 failed)
  - Batch 1 ratificado: objetivo "audit + cementar pares + arch fitness", Camino B en moderation buttons, tokens secundarios -text
  - Batch 2 ratificado: Camino B universal (también en dunning button), arch híbrido opción C
  - Batch 3 propuesta integral → Chris "Apruebo todo, continúa hasta llegar al done"
  - Slug renombrado, 01-spec.md escrito, state=refined

## Next

`/architect <brand>: comunify` lee 01-spec.md → produce ready package.
