# Comunify — Brand overlay

> **Auto-cargado** cuando cwd cae dentro `comunify/...` o worktree `~/Proyectos/luana-comunify*/`. Coexiste con root `CLAUDE.md`.

**Brand:** Comunify. **Vertical:** Creator Economy + Educación (escalera de valor, bóveda autoridad, motor comunidades, embudos venta).

**Status:** ✅ shipped (post bootstrap Story 12 — 196/196 tests GREEN).

## Product vision (pointer)

→ `comunify/docs/product/vision.md` (TBD si no existe — generar análogo a vitalia desde `/pm-comunify`).

**TL;DR:** SaaS para creators (info-product, coaches, cursos online) y educadores que monetizan vía cohorts/comunidades/membresías. Diferenciador: offer ladder builder (lead magnet → tripwire → core offer → upsell → recurring), authority vault, voice cloning para outreach.

## Verticales target

| Vertical | Modelo |
|---|---|
| Coaches life/business/health | High-ticket (USD 2K-15K programa) |
| Cursos online (info-product) | Mid-ticket (USD 200-1500) + comunidad |
| Cohort-based courses | High-ticket cohorts cíclicos (USD 800-3K) |
| Membresías recurring | LTV alto (USD 30-150/mes) |
| Consultoría productizada | Mid (USD 500-5K paquete) |

## Brand-specific gates

- Stripe + Mercado Pago suscripciones (recurring mandatory)
- Manejo refunds/cancellations granular (cohort vs membresía vs one-shot)
- Voice cloning compliance (consent explícito creator + outputs marcados)
- Authority vault assets propietarios (no scrape sin consent)

### Brand-specific anti-patterns

- ❌ Voice clone sin consent log auditable
- ❌ Cobro recurring sin cancel self-service (rompe consumer law LatAm)
- ❌ Importar testimonios sin consent del cliente
- ❌ Asumir 1 creator = 1 negocio (creators tienen múltiples products/cohorts)

## Brand-specific commands

```bash
WS=$(git rev-parse --show-toplevel)

make dev-comunify                              # BE :8003 + FE :3003
cd ${WS}/comunify/backend && ${WS}/.venv/bin/pytest tests/modules/comunify/{module}/ -v
cd ${WS}/comunify/frontend && E2E_BASE_URL=http://localhost:3003 npx playwright test --project=smoke
docker exec luana-comunify-backend-dev alembic upgrade head
curl http://127.0.0.1:8003/health
```

## Brand-specific skills

- `/pm-comunify` — owner SSoT
- `/po-ux`, `/po`, `/ux-agentico` — refining
- `/architect`, `/dev-team`, `/auditor` (con `<brand>: comunify`)
- `offer-expert` / `offer-type-preset-expert` — escalera ofertas

## Cross-brand learning sources

| Source | Cuándo |
|---|---|
| `nicolify/` (principal) | SIEMPRE — patterns + CRM + facturación |
| `vitalia/` | Si pattern HIPAA-lite (consent + retention) aplica creator + alumnos |
| `core/luana-core-offer-studio/` | Catálogos ofertas |
| `comunify/docs/learnings/` | Learnings propios |

## Voz comunify

Spanish neutro LatAm + tono entusiasta (creator economy). Sales_agent respeta voz tenant (creator decide).

## Referencias

- `comunify/docs/product/vision.md`
- `nicolify/` (prior-art source)
- `.claude/rules/claude-md-overlay.md`
