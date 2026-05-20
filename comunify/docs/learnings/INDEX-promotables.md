---
brand: comunify
type: promotables-queue
last_updated: 2026-05-20
ssot_owner: /pm-comunify
consumer: /pm-luana (Modo Core Engineering)
---

# Comunify — Promotables queue para `/pm-luana`

> Index pointer-first de learnings comunify con `promotable: yes` o `promotable: candidate` pendientes de evaluación cross-brand. `/pm-luana` lee este file en su próximo bootstrap (o cuando corra `make scan-promotables`) y decide si abre promotion proposal en `docs/promotion-protocol/proposals/`.

## Pending promotables (6)

| Learning | Slug | Applies to | Target | Rationale 1-line |
|---|---|---|---|---|
| `2026-05-18-tailwind-v4-postcss-wiring-gap.md` | tailwind-v4-postcss-wiring-gap | vitalia + 6 brands futuras | `_pm-brand-template/` scaffold rule | Tailwind v4 requiere `@tailwindcss/postcss` plugin + `postcss.config.*` o las utility classes NO se emiten en bundle (descubierto silencioso en comunify, fix en hot-fix tailwind-v4-tokens v0.2.1) |
| `2026-05-17-named-volume-staleness-post-pyproject-bump.md` | named-volume-staleness-post-pyproject-bump | todas las brands con stack Docker dev | addendum a `docs/process/docker-dev-multibrand.md` (no es package) | `docker compose up -d --build` NO repobla named volumes ya populados — `.venv` queda stale post `pyproject.toml` bump. Síntoma: `ModuleNotFoundError`. Workaround: `docker volume rm {brand}_backend_venv`. |
| `2026-05-17-playwright-runner-parity-gap.md` | playwright-runner-parity-gap | vitalia + 6 brands futuras | `_pm-brand-template/` scaffold (frontend package.json devDeps) | Stories bootstrap brand shipped `playwright.config.ts` + fixtures + specs pero olvidaron declarar `@playwright/test` en devDeps. Nicolify es el único brand con setup completo. Fix-forward sweep: vitalia + lupulo. |
| `(pending learning write)` | camino-b-outline-button-pattern | todas las brands | `_pm-brand-template/` design-system scaffold + `core/luana-core-platform/design-tokens/` futura | Camino B = outline button pattern `bg-X/10 border border-X text-X-text hover:bg-X/20` para a11y WCAG AA. Origen comunify a11y-contrast-cement v0.3.0. Resuelve combinatoria fg/bg sin tocar HSL paleta principal. |
| `(pending learning write)` | arch-fitness-anti-low-contrast | todas las brands con design system | `core/luana-core-platform/design-tokens/` cuando 2+ brands lo necesiten | Test pattern para bloquear pares WCAG fail en commit — 6 patterns HARD + allowlist `[]` + magic comment escape `// a11y-allow:`. Híbrido opción C (blockea críticos, libera UI/large marginales). |
| `(pending learning write)` | linux-live-verification-replacement | todas las brands FE | platform outcome — replacement de chrome-devtools-verify deprecated | 4to ciclo consecutivo sin alternativa live verification para Linux Mint nativo. Bloquea cierre clean de stories FE que requieren live E2E (Story 12 Clerk env, design-system-cement, tailwind-v4-tokens, a11y-contrast-cement). Candidate: stack DOM-test runner alterno o headless browser-mcp Linux-native. |

## Cross-brand impact

Los 3 learnings apuntan al **mismo root cause meta:** el scaffold `_pm-brand-template/` no es exhaustivo. Brands que bootstrappean copiando vitalia/comunify pattern heredan los gaps silenciosos.

**Recomendación a `/pm-luana`:** evaluar abrir 1 outcome platform `bootstrap-brand-template-hardening` que agrupe los 3 gaps + sweep en vitalia + lupulo + actualización `_pm-brand-template/`. Saves 3 incidents idénticos × 6 brands futuras = 18 incidents-evitados.

## Otros learnings comunify (no promotables ahora)

- `2026-05-16-capabilities-inventory-recovery.md` (promotable: no — cross-skill override one-off para gap originado en vitalia/nicolify, ya documentado en `docs/promotion-protocol/proposals/2026-05-16-capability-inventory-enforcement.md`)

## Workflow

1. `/pm-luana` bootstrap incluye lectura de este file
2. Por cada row con `promotable: yes`, `/pm-luana` decide:
   - **Open proposal:** crear `docs/promotion-protocol/proposals/{date}-lift-{slug}.md`
   - **Defer:** mark `promotable: deferred` con razón
   - **Reject:** mark `promotable: no` con razón
3. Cuando proposal `state >= accepted`, este row se mueve a sección "Processed" (no se elimina, audit trail)
4. `/pm-comunify` solo añade nuevos rows, nunca edita verdict (jurisdicción `/pm-luana`)

## Processed

_(none yet)_
