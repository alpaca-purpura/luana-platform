# fixia/.claude/skills/README.md
# Brand skills overlay — Fixia (Servicios Hogar + Oficios)
# bootstrap brand topology — 2026-05-15
#
# Skills overlay brand-specific (raro — la mayoría de skills son globales en `.claude/skills/`).
# Aplican SOLO a sesiones trabajando en la vertical Fixia.

## Skills globales relevantes para Fixia

Los siguientes skills globales (en `.claude/skills/`) aplican directamente a Fixia:

- `/pm-fixia` — PM de la vertical Fixia. SSoT: `fixia/docs/product/`.
- `/architect` — Diseño técnico de features. Produce ready package (03-arch, 04-validators, 05-guidelines, 06-tickets).
- `/dev-team` — Build autónomo contra validators.
- `/auditor` — Revisión de código + spec + arquitectura.
- `/po` — Service-stories (no UI). Spec Gherkin.
- `/po-ux` — Stories con UI. Gherkin + wireframes inline.

## Skills brand-específicos (este directorio)

Actualmente no hay skills brand-específicos para Fixia.
Si se necesita un skill especializado (ej. `dispatch-expert`, `field-quotation-expert`),
crearlo aquí como `fixia/.claude/skills/{slug}/SKILL.md`.

## Carga automática

Las reglas en `fixia/.claude/rules/` se cargan automáticamente cuando el contexto
incluye archivos bajo `fixia/`. Ver `fixia/.claude/rules/README.md`.
