---
slug: luana
kind: core
status: active
last_updated: 2026-05-15
ssot_live:
  - docs/product/
  - docs/core-modules/
  - docs/promotion-protocol/
  - docs/architecture/luana-platform/
owner: /pm-luana
---

# Luana — core engine

> El núcleo compartido del portfolio. NO es brand consumidora — es la "constitución" sobre la que las 10 brands construyen.

## Razón de existir

Acelerar dev cross-brand. Cada brand aporta aprendizaje → core captura abstracciones reutilizables → nuevas brands arrancan ya con superpoderes acumulados.

## Surfaces

| Tipo | Path | Descripción |
|---|---|---|
| Engine packages | [`core/luana-core-*`](../../core/) | 26 paquetes Python + TS publicables |
| Extension SDK | `core/luana-core-extension-sdk/` | EP-1..EP-18 contracts |
| Cross-cutting concerns | [`docs/core-modules/`](../core-modules/) | 22 transversales (tenant isolation, locale, observability, etc.) |
| Promotion protocol | [`docs/promotion-protocol/`](../promotion-protocol/) | brand→core lift gate |

## State

- **26 packages extraídos** (avance Sem 1-3 del plan original adelantado)
- **3 brands consumidoras shipped** (Nicolify, Vitalia, Comunify)
- **1 placeholder** (Lupulo)
- **6 pendientes bootstrap** (SaaSora, InmoFlow, Retailly, Fixia, Guestly, FitFlow)

## Ownership

- `/pm-luana` (skill) — owner promotion gate, semver, breaking changes
- `/pm` (master) — orquesta visibility cross-portfolio

## Próximas acciones

Drill-down en SSoT vivo:
- Roadmap: `docs/product/outcomes/` (cuando se pueblen)
- Promotion candidates abiertas: `docs/promotion-protocol/proposals/`
- Plan multibrand original: `docs/architecture/luana-platform/01-core-audit.md`
