---
story_id: nicolify-r0-storybook-inventory
brand: nicolify
type: ui-story                        # cross-cutting design-system (como ds-adoption) — UI components 1:1 en Storybook
state: idea                          # nace de la conversación de diseño 2026-06-24 (status+plan storybook inventory)
release: R0                          # Fundación — inventario completo ANTES de crecer hoja por hoja
map_zone: infraestructura            # atributo de calidad (inventario navegable de la UI) · derivada SYSTEM-MAP::zones
map_box: plataforma-tecnica
map_area: design-system
module: design-system                # bucket code:design-system
architecture_pattern: ADR-nicolify-001   # toca shell components (Storybook-first G1 post-HB-103)
cap_target: design-system/nicolify-storybook-inventory   # tentativo — /architect confirma cap + change_type al ready
# cap_change_type: NO se declara en idea (el cap YAML se crea en Fase F.3 al merge) — /architect lo fija (extiende nicolify-ui-homologation)
route: null                          # cross-cutting — no es una hoja con ruta
demo_required: true                  # storybook navegable + componentes render fiel
depends_on:
  - "Fase 0 · HB-103 (doctrina Storybook-first de nicolify) — EN CURSO sesión aparte 2026-06-24. Prerequisito DURO: refinar esta story DESPUÉS de que Fase 0 commitee."
related_stories:
  - "nicolify-r0-design-system-adoption (homologación — la base que esto inventaría · en G AWAIT_CHRIS_VERIFY)"
blocked_on:
  - "Fase 0 sin commitear (sesión paralela edita la doctrina del DS en el hub)"
last_modified: 2026-06-24
next_action: "EN idea (handoff). Prerequisito: Fase 0 (HB-103) commiteada + las 2 stories abiertas (ds-adoption G, abel reviewing) destrabadas o no compitiendo el bucket. Luego refinar vía intake-handshake /pm-nicolify → /po-ux. El handoff completo (findings + plan 4 fases + decisiones) vive en 00-research.md."
intake_handshake: "La conversación de diseño (zona/caja + extiende-o-nuevo + prior-art) ocurrió en sesión 2026-06-24 — ver 00-research.md § Intake + chris-input.md. La story NACE de esa conversación."
---

# nicolify-r0-storybook-inventory — Inventario 1:1 de la UI en Storybook

> **Idea (handoff durable 2026-06-24).** Esta story es el **hogar de usuario** del plan "todo lo de UI sale del Storybook" (Chris no quiso ADR — es trabajo de producto, no arquitectura permanente). El research completo (findings de 3 subagentes + plan de 4 fases + decisiones) está en `00-research.md`.

## Qué resuelve (en una línea)

Que **todo componente UI de nicolify viva en un Storybook navegable** (compartido `@luana/ui-kit` + brand-local), de modo que (a) los mockups se compongan partiendo de componentes reales, (b) `/architect` le diga a `/dev-team` el átomo/molécula/token exacto, y (c) Chris pueda saber **todos los componentes de su solución que tendría que modificar** ante un cambio de UI.

## Alcance de ESTA story (Fase 1 del plan)

- Escribir las **stories `.stories.tsx`** de los componentes brand-local existentes de nicolify (Abel ICP + shell wiring + intake + avatares) en `nicolify/frontend/.storybook` (infra YA montada, 0 stories hoy).
- Subir `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` a **inventario 1:1 completo** (cada componente → path + props + estado + link a story + kit-consumido vs brand-local).

## Fuera de scope (otras fases — ver 00-research.md)

- **Fase 0** (doctrina Storybook-first) → harness, EN CURSO (HB-103, sesión aparte).
- **Fase 2** (loop activo) → emergente, no es trabajo discreto.
- **Fase 3** (manifiesto machine-readable consultable) → **CORE/cross-brand → `/pm-luana`** (no esta story).
