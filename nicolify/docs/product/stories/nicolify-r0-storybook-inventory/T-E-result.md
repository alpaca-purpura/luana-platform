# T-E-result — Doctrina design-system reusable-only cementada

**Date:** 2026-06-24
**Story:** nicolify-r0-storybook-inventory
**Task:** Cementar criterio §5.bis (kit-only para ≥2 usos o genérico cross-brand)

## Archivos editados (doctrina)

1. `docs/architecture/luana-platform/design-system-canon.md` — §5.bis nuevo + §índice de uso (en §4) + ref ADR-014
2. `docs/architecture/luana-platform/ADR-014-design-system-homologation.md` — ref a §5.bis (en la fila Storybook=SSoT del enforcement)
3. `.claude/rules/frontend-visual-fidelity.md` — criterio single-use explícito (en § Storybook)
4. `.claude/skills/frontend-expert/references/visual-fidelity.md` — excepción D0 single-use
5. `.claude/agents/auditor-frontend.md` — NO CHANGES_REQUESTED por single-use sin story (Cat 16)
6. `.claude/agents/builder-frontend.md` — criterio reusable primero en technical_design D1
7. `.claude/skills/architect/SKILL.md` — excepción single-use en 03-arch (Storybook=SSoT gate)
8. `.claude/skills/po-ux/SKILL.md` — single-use → feature-local sin PROMOTE (canon checklist Step 5)
9. `.claude/skills/nicolify-design-system/SKILL.md` — golden solo para kit (paso 8 Tests)
10. `.claude/skills/vitalia-design-system/SKILL.md` — idem (paso 8 Tests)
11. `nicolify/.claude/rules/shell-mockup-per-component.md` — aplica a reusables
12. `vitalia/.claude/rules/shell-mockup-per-component.md` — idem
13. `.claude/skills/pm-luana/SKILL.md` — Design System promotion criteria §5.bis (sección nueva)

## SSoT nuevo

`docs/architecture/luana-platform/design-system-canon.md §5.bis` — criterio de entrada al kit (reusable-only):
- (a) ≥2 usos reales cross-feature O (b) primitiva genérica cross-brand → kit + story obligatoria.
- single-use (1 pantalla / 1 módulo) → `features/{m}/components/` con átomos del kit, sin story, sin PROMOTE, sin rechazo del auditor.
- reutilizable-dentro-de-marca pero brand-specific (PHI/dominio) → molécula interna, SIN story (Storybook es kit-only).
- "qué toco si cambio X" lo responde el Índice de Uso, no browsear stories.

## Script creado

`scripts/generate_component_usage_index.py` — genera `{brand}/docs/architecture/COMPONENT-USAGE-INDEX.md`
(tabla componente→features que lo usan→story en kit sí/no + señal de promoción ≥2 usos). Stdlib + subprocess.
Si `{brand}/frontend/src/features/` no existe → reporta "skipped" + exit 0. Output gitignored (R3, fuente=código).
Target Makefile: `make component-index BRAND=nicolify` (default nicolify).

## Proposal

`docs/promotion-protocol/proposals/2026-06-24-component-usage-index.md` (status: proposed)

## Resultado machinery-check

`make machinery-check` → **72 checks · 0 fallos · 0 advisory · ✓ machinery consistente — sin drift** (exit 0).
(El script de machinery es `scripts/validate_machinery_consistency.py`; el `validate_machinery.py` mencionado en la tarea
no existe con ese nombre exacto — el SSoT real es `_consistency`, corrido vía `make machinery-check`.)

## Resultado script

- `make component-index BRAND=nicolify` → genera `nicolify/docs/architecture/COMPONENT-USAGE-INDEX.md` sin error (exit 0).
  Detecta imports reales de `@luana/ui-kit` + `components/` en `features/`; marca "Story en kit" Sí/No por presencia de `*.stories.tsx`.
- `--brand vitalia` → genera el índice de vitalia OK (exit 0).
- `--brand lupulo` (placeholder, sin frontend) → reporta "skipped" + exit 0 (no fatal).
- Output verificado **gitignored** (`git check-ignore` ✓ · no aparece en `git status`).

## Notas

- NO se tocó `frontend/src` ni `.storybook` (solo `.claude/`, `docs/`, `scripts/`, `Makefile`, `.gitignore`).
- NO se commiteó — cambios quedan en el working tree.
- Los cambios en `core/@luana/ui-kit/**` y `*/frontend/src/components/shared/**` que aparecen en `git status`
  son PRE-EXISTENTES (de otra sesión / el trabajo de inventario de la story), NO de esta tarea.

---

done -> T-E-result.md (13 archivos doctrina + SSoT canon §5.bis + índice-uso script)
