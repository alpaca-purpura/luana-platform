---
id: ADR-nicolify-003
title: Protocolo mockup-base reusable (_shared.css + wrapper verbatim + visual golden) — gate pre-/architect
status: Superseded
superseded_by: "Storybook = SSoT visual — design-system-canon.md § 5 (2026-06-22, ratificado Chris)"
date: 2026-06-15
deciders: [Chris, /po-ux, /pm-nicolify]
brand: nicolify
supersedes: []
mirrors: vitalia/docs/architecture/ADR-vitalia-003-shell-mockup-per-component-protocol.md
references:
  - nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md
  - nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md
  - docs/architecture/luana-platform/design-system-canon.md
  - docs/architecture/luana-platform/ADR-014-design-system-homologation.md
  - nicolify/docs/product/stories/nicolify-r0-design-system-adoption/mockups/_shared.css
---

# ADR-nicolify-003 — Protocolo mockup-base reusable (cero alucinación UI)

> **Mirror brand de [ADR-vitalia-003](../../../vitalia/docs/architecture/ADR-vitalia-003-shell-mockup-per-component-protocol.md)**, adaptado a nicolify (sin PHI · con guardrails agénticos). Ratificado por Chris 2026-06-15 tras revisar el sistema de vitalia. **Patrón cross-brand → candidate lift `/pm-luana`** a `.claude/rules/` raíz cuando ≥2 brands lo corran (vitalia + nicolify ya).

## Contexto

Chris reportó (2026-06-15): los mockups de nicolify se componían "a ojo" (estilos inline, sin base reusable) → cada mockup driftea + el código implementado puede divergir del mockup. En vitalia el problema está **resuelto** por un sistema concreto: un `_shared.css` reusable + un shell wrapper portado verbatim + un gate que vuelve el mockup un contrato ejecutable. Esta ADR trae ese sistema a nicolify.

## Decisión

**Todo mockup HTML de nicolify se compone de una BASE CANÓNICA reusable, obligatoriamente.** Tres piezas:

### 1 · `_shared.css` (la base — fuente única)

- **SSoT:** `nicolify/docs/product/stories/nicolify-r0-design-system-adoption/mockups/_shared.css`.
- Contiene: tokens (espejo HSL de `globals.css` — NO inventar) + átomos + moléculas + layout-primitives + shell wrapper, todo compuesto del `design-system-canon.md §6` + `@luana/ui-kit` 0.4.1.
- **Todo mockup hace `<link rel="stylesheet" href="_shared.css">`** y SOLO escribe su `.panel-content` (la hoja). Cero estilo inline de layout. Cero arbitrary-value.
- Stories nuevas copian/portan `_shared.css` verbatim a su `mockups/` (self-contained para `http.server`); si la base evoluciona, se actualiza el canónico + se repropaga.

### 2 · Shell wrapper portado VERBATIM

- El wrapper (Luana sidebar + Ribbon N1 + SubTabs N2 + EntitySubNavBar N3) es **idéntico cross-mockup** — vive en `_shared.css`, portado verbatim de `nicolify/docs/product/stories/nicolify-r0-shell-organism/mockups/shell.html` (el SSoT visual del shell).
- **Prohibido reinventarlo simplificado** (genera falsos regression-flags + colores grisáceos en vez de tokens de marca). Solo cambia `.panel-content`.

### 3 · Visual golden = contrato ejecutable

- El `01-spec.md § Visual Goldens` mapea `mockup HTML → golden snapshot → componente React (@luana/ui-kit o feature) → canon ref`.
- `/dev-team` genera Playwright visual golden side-by-side mockup-vs-componente (`maxDiffPixelRatio: 0.001`). El mockup deja de ser doc → es contrato anti-drift. Ratchet shrink-only (re-ratificación explícita de Chris para cambiarlo).

## Gate (bloqueante pre-/architect)

Toda story nicolify con UI nueva (sub-tab `abel-*`/`brenda-*`/`christian-*`/`sara-*`/`norvil-*`/`config-*`, o componente del shell):

1. `/po-ux` compone el mockup de `_shared.css` (link + solo `.panel-content`) + wrapper verbatim.
2. Chris ratifica visual (`ratified_visual_by_chris: true`, `mockup_final_signed: true`).
3. `01-spec.md § Visual Goldens` mapea mockup→golden→React→canon.
4. **`/architect` REFUSE arrancar** si `mockups/` no linkea `_shared.css`, o el wrapper no es verbatim, o `mockup_final_signed != true`.

## Excepciones (NO aplica)

- Service-only (sin UI · ej. `nicolify-r0-dev-stack`).
- Agentic-conversacional pura (flujo Luana → `/ux-agentico`).
- Componentes atómicos aislados (un swatch, un toggle) que se ratifican sin shell.
- La propia `nicolify-r0-shell-organism` (origen del wrapper) y esta `nicolify-r0-design-system-adoption` (origen de la base).

## Guardrails agénticos (adaptación vs vitalia)

Donde vitalia pone PHI/dual-filter, nicolify pone **guardrails de autonomía** (`agent-revenue-engine.md`): un mockup de superficie que un agente opera (Brenda kill-switch, Christian outbound) muestra el **audit/consentimiento** en la hoja. Sin PHI.

## Consecuencias

**Positivas:** cero alucinación UI · "lo que veo = lo que programo" mecanizado · drift se caza en `/po-ux` (no en auditor post-merge) · el wrapper pre-ratificado se hereda en cada hoja nueva. **Negativas:** el loop `/po-ux` se extiende (mockups + ratificación); mantener `_shared.css` espejo de `globals.css`.

## Changelog

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-06-15 | Decisión inicial — Chris ratifica tras revisar el sistema de vitalia. Base `_shared.css` cementada en `nicolify-r0-design-system-adoption`. |
