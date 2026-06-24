# Proposal: Component Usage Index

**Date:** 2026-06-24
**Status:** proposed
**Owner:** /pm-luana
**Scope:** cross-brand

## Qué

Script `scripts/generate_component_usage_index.py` + target `make component-index` que genera
`{brand}/docs/architecture/COMPONENT-USAGE-INDEX.md` (tabla componente→features que lo usan→story en kit sí/no).

## Por qué

Con la doctrina §5.bis (kit-only para ≥2 usos o genérico cross-brand), el criterio de PROMOTE
necesita evidencia objetiva: ¿cuántas features usan este componente?
El índice lo responde sin grep manual ni browsear Storybook.

## Cómo

- Fuente: `git grep` sobre `{brand}/frontend/src/features/**` buscando imports de `@luana/ui-kit` y `components/`
- Output: MD gitignored (R3 — fuente=código, NUNCA editar manual)
- Trigger: `make component-index BRAND=nicolify` (o por marca)
- Cross-brand: correr una vez por marca activa

## Consecuencias

- Promotion decisions con evidencia cuantitativa (cuenta de usos reales)
- El auditor puede verificar "≥2 usos" con `make component-index` en vez de grep ad-hoc
- /pm-luana tiene el índice antes de la phase de lift proposal

## Referencias

- `docs/architecture/luana-platform/design-system-canon.md §5.bis` — criterio de entrada al kit
- `docs/promotion-protocol/README.md` — workflow lift brand→core
