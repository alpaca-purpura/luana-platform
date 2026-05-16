# Comunify — modules

Per-module narrativa brand-specific. Solo módulos que Comunify consume o extiende vía Extension SDK (EP-1..EP-18).

Listado canónico módulos core: `docs/core-modules/`.

## Módulos activos (post Story 12, 2026-05-16 inventory)

| Module | Capabilities | Caps live | EPs consumidos | Notas |
|---|---|---|---|---|
| `brand_studio` | authority-vault, voice-cloning-pipeline | 2 | EP-1, EP-7 | D11 authority_vault required + D8 voice cloning ON |
| `cohorts` | cohort-management | 1 | n/a (brand-internal) | Advisory locks PG previene double-enrollment |
| `agentic` | community-moderation-rails, agentic-eval-creator-economy, creator-economy-agentic-tools | 3 | EP-3, EP-13 | 4 guardrails + 4 tools + rubric MD v1 + 8 personas |
| `copilot` | creator-economy-kb-rag, community-engagement-workflow, cohort-enrollment-workflow | 3 | EP-4, EP-14 | KB pack ~180 chunks + 2 LangGraph workflows |
| `offer_studio` | offer-ladder-advisor, coaching-offers-preset | 2 | EP-2, EP-7 | 4-level ladder + preset pack `coaching_offers_v1` |
| `payment` | recurring-subscriptions-dunning | 1 | EP-17 | MercadoPago + Stripe Connect + tokenized recurring + DunningWorkflow embedded |
| `platform` | vertical-creator-economy-extension-sdk | 1 | EP-1..EP-18 | Mount point `extensions.py::register_all` |
| `fixtures` | 3-creator-fixture-latam | 1 | n/a | Anabella AR + Trini CL + Pablo MX |
| `onboarding` | creator-onboarding-4step | 1 | EP-18 (override) | Niche picker + voice samples uploader (D8) + Stripe Connect + ladder seed |
| `public_landing` | creator-public-landing | 1 | EP-10 | Template `creator_landing_hero` + widget UMD embed |
| `iam` | creator-signup-handler | 1 | EP-16 | Auto-approve (D7 vs Vitalia pending_review) |

**Total:** 17 capabilities en 11 módulos.

## Extension SDK consumption matrix (EP-1..EP-18)

| EP | Comunify usa? | Capability mapping |
|---|---|---|
| EP-1 field_override | Sí | brand_studio (buyer_persona.min_count=3 override D11) |
| EP-2 offer_preset_pack | Sí | offer_studio/coaching-offers-preset |
| EP-3 sales_agent_tool | Sí | agentic/creator-economy-agentic-tools (4 tools) |
| EP-4 copilot_workflow | Sí | copilot/community-engagement-workflow + copilot/cohort-enrollment-workflow |
| EP-5 scheduling_booking_policy | Sí | cohort_capacity_check (placeholder hoy) |
| EP-6 sidebar_routes | Sí | 3 routes: cohorts + community + subscriptions |
| EP-7 extractor_register | Sí | offer_ladder_advisor + authority_vault_extractor |
| EP-8 channel_adapter | Sí | 3 payment adapters (MP + Stripe Connect + tokenized) — placeholder webhook wire T-be-9 |
| EP-9 metric_register | Sí | cohort_engagement_score |
| EP-10 landing_template | Sí | public_landing/creator-public-landing |
| EP-11 campaign_template | Sí | cohort_enrollment_payment_followup (WhatsApp drip) |
| EP-12 asset_template | Sí | cohort_welcome_packet_pdf |
| EP-13 sales_agent_guardrail | Sí | agentic/community-moderation-rails (4 rails) |
| EP-14 copilot_kb_pack | Sí | copilot/creator-economy-kb-rag (~180 chunks Qdrant) |
| EP-15 crm_lifecycle_stage | Sí | payment_pending_enrollment |
| EP-16 iam_signup_handler | Sí | iam/creator-signup-handler (auto-approve D7) |
| EP-17 tenant_plan_tier | Sí (mode=override) | 3 tiers: creator/pro/agency |
| EP-18 onboarding_wizard_steps | Sí (mode=override) | onboarding/creator-onboarding-4step (2 steps brand-scoped) |

**18/18 EPs mounted.** Coverage completa cross-extension-points.
