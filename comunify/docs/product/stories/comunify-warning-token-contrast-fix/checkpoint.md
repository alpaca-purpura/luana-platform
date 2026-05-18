---
brand: comunify
story_id: comunify-warning-token-contrast-fix
state: idea
created: 2026-05-18
last_updated: 2026-05-18
parallel_safe: true
owner: /pm-comunify
next_handoff: /po-ux (cuando Chris ratifique)
surface: [frontend, design-system]
estimated_size: S
origin: spawned by auditor-frontend audit of comunify-design-system-cement (WCAG AA contrast WARN)
---

# Comunify — Warning token contrast fix (WCAG AA)

## Spark

Auditor `auditor-frontend` audit de `comunify-design-system-cement` flagged 1 WARN (no bloqueante de APPROVED):

`text-white` sobre `bg-comunify-warning` (HSL 45 100% 48% ≈ yellow) yields **~1.80:1** contrast ratio en `dunning-active-banner.tsx:31` + `community-moderation-card.tsx:22`. WCAG AA requiere ≥4.5:1 para body text.

Pre-cement baseline (`bg-orange-600 text-white`) era ~3.6:1 — semantic warning swap aplicó SSoT 1:1 honrando mapping, pero el HSL `--comunify-warning: 45 100% 48%` es demasiado claro para combinar con texto blanco. Fix pertenece al SSoT `design-system.md`, no al consumer.

## Why now

- Compliance accesibilidad creator economy — coaches/educators con clientela diversa (incluye usuarios baja visión)
- Banner Dunning (cobranza fallida) visible regularmente en planes premium tier — tipo de mensaje de alta importancia que debe ser legible
- Fix de 1 token + 2 archivos consumers = scope mínimo (S)
- Bloquea futura story compliance audit accesibilidad WCAG AAA

## Scope hint (probable, /po-ux refina)

### Opción A (recomendada) — Revisar warning HSL más oscuro

- Actualizar `--comunify-warning` en `design-system.md` §1 + `globals.css`: HSL `45 100% 48%` → `45 100% 35%` (oscurece luminance ~30%)
- Contrast ratio resultante: ~4.7:1 (PASS AA con `text-white`)
- Side-effect: bg amarillo más mostaza, menos brillante — verificar visualmente que mantiene legibilidad warning

### Opción B — Componer con `text-comunify-text` en vez de white

- Documentar en `design-system.md` §6 component recipes: warning banner usa `bg-comunify-warning text-comunify-text` (no text-white)
- Contrast resultante: `text-comunify-text` (HSL 226 49% 9%) sobre `bg-comunify-warning` (HSL 45 100% 48%) → ~9.8:1 (PASS AAA)
- Migrar consumers: `dunning-active-banner.tsx:31` + `community-moderation-card.tsx:22` cambian `text-white` → `text-comunify-text`
- No toca SSoT HSL — solo recipe pattern

### Opción C — Dual approach (warning-strong + warning-soft)

- Dejar `--comunify-warning` actual (45 100% 48%) para usos sutiles (badges, icons)
- Agregar `--comunify-warning-strong` (45 100% 35%) para combinaciones con text-white (banners, CTAs)
- Más complejo pero más flexible

## Acceptance hint

- `design-system.md` actualizado (opción elegida)
- `globals.css` actualizado si opción A o C
- 2 consumers migrados si opción B o C
- WCAG AA pair `<warning-bg> + <text-color>` ≥ 4.5:1 verificado en arch fitness o smoke test
- 0 regresión arch fitness anti-stock-palette ratchet

## Out of scope

- Audit completo WCAG todas las parejas tokens (story `comunify-accessibility-audit` futura)
- Lift de tokens accesibilidad a `core/luana-core-platform/design-tokens/` cross-brand
- Dark mode considerations

## Open questions

1. **Qué opción** — A/B/C? Trade-off visual (banner más oscuro) vs consistency (text-white estándar UI) vs flexibility (más tokens).
2. **¿Auditar otras parejas?** — quizás `text-white` sobre `bg-comunify-stable` (HSL 152 80% 43%) tiene problema similar. Spot-check antes de scope.

## Referencias

- `comunify/docs/product/stories/comunify-design-system-cement/CHECKPOINTS.md` §C4 (WARN origen)
- `comunify/docs/product/stories/comunify-design-system-cement/REVIEW.md` (detalle)
- `comunify/docs/architecture/design-system.md` (SSoT a modificar)
- `comunify/frontend/src/features/comunify/components/dunning-active-banner.tsx` (consumer)
- `comunify/frontend/src/features/comunify/components/community-moderation-card.tsx` (consumer)

## Next action

Chris dice "refinemos comunify-warning-token-contrast-fix" → `/pm-comunify` transition state=idea→refining + handoff `/po-ux`. Considera bundlear con `comunify-accessibility-audit` si decide hacer audit comprehensive.
