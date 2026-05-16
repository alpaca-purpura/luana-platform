---
brand: comunify
vertical: "Creator Economy + Educación"
status: shipped
last_updated: 2026-05-16
active_outcomes: []
active_stories: []
ssot_owner: /pm-comunify
---

# Comunify — checkpoint

> Estado actual del brand. Actualizado por `/pm-comunify` en cada transición.

## Estado funcional shipped (2026-05-16 inventory)

Story 12 (`luana-comunify-bootstrap`, mergeada 2026-05-15) shipped **17 capabilities en 11 módulos** — backend completo + frontend dashboard + 4-step onboarding wizard + voice cloning pipeline (D8 ON, NEW vs Vitalia) + 3 fixtures LATAM creator (Anabella AR / Trini CL / Pablo MX) + community moderation rails + recurring subscriptions + Dunning workflow embedded. Ver `comunify/docs/product/capabilities/` para detalle por módulo.

**Test coverage:** 102 backend tests (15 unit + 12 integration + 9 architecture + 3 infrastructure + 6 e2e + 55 agentic_evals — workflows + tools + smoke + voice_cloning + kb_pack + cache + cost_budget + compliance).

**Plan tiers activos:** creator (29 USD) · pro (99 USD) · agency (299 USD) — D20 cement.

**Distintivos vs Vitalia:**
- `voice_cloning_enabled: true` (D8 — pipeline 4-wave distillation 50+ chats → CompiledVoice v2)
- `compliance_level: creator_economy` (D7 — NO hipaa_lite vs Vitalia)
- Auto-approve signup (vs Vitalia clinic `pending_review`)
- 4-level offer ladder explícito (lead_magnet → tripwire → core → premium) vs Vitalia preset médico
- DunningWorkflow embedded en CohortEnrollmentWorkflow (4-state per D19)
- 4 community moderation rails (spam + nsfw + doxxing + prompt_injection)

**Diferidos a Story 12.bis (per `comunify/config/brand.yaml`):**
- `discord_circle_bridge: false` (Q3=B defer)
- `live_streaming: false`
- `gamification: false`
- `leaderboard: false`
- `multi_account_creator_switcher: false` (Q2=B defer)

## Bitácora

- 2026-05-15: brand topology bootstrap (F0 reorg multimarca) — Story 12 `luana-comunify-bootstrap` shipped
- 2026-05-16: capability inventory recovery — 17 caps YAMLs escritas en `comunify/docs/product/capabilities/` desde archive (10 caps `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/capabilities/comunify/`) + código vivo (7 caps nuevas detectadas: coaching-offers-preset, creator-onboarding-4step, community-engagement-workflow, cohort-enrollment-workflow, creator-economy-agentic-tools, creator-public-landing, creator-signup-handler). Gap idéntico al detectado en vitalia 2026-05-16 (ver `vitalia/docs/learnings/2026-05-16-capabilities-inventory-gap.md` + promotion proposal aceptada `docs/promotion-protocol/proposals/2026-05-16-capability-inventory-enforcement.md`). Coverage check verde: `.venv/bin/python scripts/reconcile_capabilities.py --require-capabilities-exist --brand comunify` PASS. **Cross-skill override:** ejecutado por `/pm-luana` con autorización explícita Chris (mismo plan que cerró gap nicolify carve-out audit + vitalia learning promotion). Devolución de jurisdicción a `/pm-comunify` para próximas iteraciones.
