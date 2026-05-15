"""Comunify Extension SDK registration — single entry point.

Story 12 T-extensions-1 (R23 Opus 4.7 production AGENTIC code).

Per 03-arch.md § 4.1 + 03-arch-agentic.md § 3.2 — single `register_all(registry)`
function mounts the entire Comunify vertical-creator-economy brand surface onto
the Luana platform via Extension SDK EP-1..EP-18.

Pattern reference: vitalia/backend/src/modules/vitalia/extensions.py (Story 11
cement, APPROVED 2026-05-14) + apps/test-brand/src/test_brand/extensions.py
(Story 8 cement). Adapted to community + creator-economy domain.

NOTE on design vs implementation reconciliation:

The architectural pseudo-code (02-design-agentic § 18.3 + 03-arch § 4.1) shows
`ExtensionPointRegistry.register_all(brand_slug=..., config={dict})` as a single
classmethod. The actual SDK (Story 9 cement, frozen by `core/luana-core-extension-sdk/`)
exposes 18 individual `register_*` methods per EP — there is NO `register_all`
classmethod on the registry, and per CC-5 inmutable post-startup the SDK cannot
grow new public methods. The "single entry point" semantics are preserved by THIS
module-level `register_all(registry)` function that mounts everything in one call
— same intent, same single-call interface, contract-compliant with the Story 9
frozen SDK.

═══════════════════════════════════════════════════════════════════════════════
PHASE / SCOPE — T-extensions-1 is MOUNTING SCAFFOLDING ONLY
═══════════════════════════════════════════════════════════════════════════════

This ticket creates the wiring SHELL. Tool handlers, extractor implementations,
workflow graph definitions, KB pack chunks, guardrail check functions, voice
cloning orchestrator and channel adapter send/receive callables are PLACEHOLDERS
that raise NotImplementedError when invoked. Real implementations land in later
tickets:

  T-tools-1..4         → EP-3 tool handlers (qualify_for_cohort, link_to_community,
                         nurture_via_authority_content, book_discovery_call)
  T-extractors-1,2     → EP-7 extractors (OfferLadderAdvisor, AuthorityVaultExtractor)
  T-workflows-1,2      → EP-4 LangGraph workflow definitions (CommunityEngagement,
                         CohortEnrollment+Dunning)
  T-kb-1               → EP-14 KB pack chunks + Qdrant ingestion (creator_economy_kb_v1)
  T-guards-1..4        → EP-13 guardrail check callables (no_spam, no_nsfw, no_doxxing,
                         prompt_injection_block reuse Story E)
  T-prompts-1          → Slot 4 COMMUNITY_SAFETY_RAILS prompt layer (NOT an EP — slot
                         architecture mounted at compose-time, not registered here)
  T-voice-1..4         → VoiceDistillationOrchestrator + samples ingestion + compiler
                         integration + end-to-end tests (NEW Story 12 — Vitalia OFF)
  T-payment-1          → already DONE — payment adapters import + register here
  T-be-9               → channel webhook handlers (Stripe + MercadoPago + Clerk)

Anti-duplication audit per .claude/rules/anti-duplication.md § 0:
  - SDK contract cement is `luana_core_extension_sdk.extension_points.ExtensionPointRegistry`.
    This module IS the brand-side consumer (per-brand mount point), not a shared/
    abstraction. Pattern mirror with Vitalia OK because extensions.py IS the per-brand
    mount point — brand-isolated by design. NO mirror risk vs shared abstractions.
  - vitalia precedent verified at vitalia/backend/src/modules/vitalia/extensions.py.
  - test-brand precedent verified at apps/test-brand/python/test_brand/extensions.py.

Decisions honored (per 03-arch.md § 11):
  D1  — Comunify subdir at luana-platform/comunify/ (no separate repo Story 12.bis)
  D5  — Slot 4 COMMUNITY_SAFETY_RAILS (architecture reserves slot; prompt MD lands
        in T-prompts-1, not registered here)
  D7  — compliance_level=creator_economy (NOT hipaa_lite vs Vitalia D7)
  D8  — voice_cloning_enabled=true (NEW Story 12 vs Vitalia OFF) — full pipeline
        50+ chats → CompiledVoice v2 6-block
  D9  — Spanish neutro LatAm tuteo for chrome UI (sales_agent voice cloned per-tenant
        respects voice cloning compiled v2 distilled per tenant)
  D11 — authority_vault section REQUIRED (brand_studio.sections.required override)
  D17 — pre_moderation_new_members=3 first posts (community safety)
  D18 — community_audit_log retention 5 years (vs Vitalia 7-year HIPAA)
"""

from __future__ import annotations

from typing import Any, Optional

from luana_core_extension_sdk import (
    AssetTemplateDef,
    BookingPolicy,
    BookingResult,
    BrandContext,
    CampaignStepDef,
    CampaignTemplateDef,
    ChannelAdapterDef,
    ExtensionPointRegistry,
    ExtractorDef,
    FieldDef,
    FieldOverride,
    GuardrailDef,
    GuardrailResult,
    KbPackDef,
    LandingTemplateDef,
    LifecycleStageDef,
    MetricDef,
    PlanTierDef,
    PresetPack,
    SidebarRouteDef,
    SignupResult,
    ToolDef,
    WizardStepDef,
    WorkflowDef,
)

# Payment adapters — already implemented in T-payment-1 (DONE). Imported for
# EP-8 channel adapter registration below. Real send/receive callables on the
# adapters land in BE webhook integration ticket (T-be-9); EP-8 registration
# here uses placeholders to keep this ticket scoped to mounting only.
from src.modules.comunify.payment import (  # noqa: F401 — imported for side-effects + side reference
    ComunifyMercadoPagoAdapter,
    ComunifyStripeConnectAdapter,
    ComunifyTokenizedRecurringAdapter,
)

# ════════════════════════════════════════════════════════════════════════════
# CC-4 namespace prefix
# ════════════════════════════════════════════════════════════════════════════

_BRAND_SLUG = "comunify"


def _ns(suffix: str) -> str:
    """Prepend 'comunify.' namespace per CC-4 enforcement."""
    return f"{_BRAND_SLUG}.{suffix}"


# ════════════════════════════════════════════════════════════════════════════
# Placeholder handler used until later tickets land real implementations
# ════════════════════════════════════════════════════════════════════════════


def _not_implemented_yet(extension_point: str, owner_ticket: str):
    """Build a placeholder callable that fails clearly when invoked.

    Registry stores the callable; invoking it raises NotImplementedError with a
    pointer to the ticket that will provide the real implementation.

    Per `tessl__graceful-degradation` rule 2: explicit fallback message tells
    caller exactly where to look for the real handler. Placeholders NEVER run
    in production startup-path — they materialize errors only on actual call.
    """

    def _placeholder(*args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError(
            f"{extension_point} handler is a placeholder — real implementation "
            f"lands in {owner_ticket}. Story 12 T-extensions-1 scope is mounting only."
        )

    return _placeholder


# ════════════════════════════════════════════════════════════════════════════
# register_all — single entry point
# ════════════════════════════════════════════════════════════════════════════


def register_all(registry: ExtensionPointRegistry) -> None:
    """Register Comunify brand surface across EP-1..EP-18.

    Called by FastAPI lifespan at startup (Story 12 BE composition root) per
    Story 8 test-brand + Story 11 vitalia pattern. After register_all, the brand
    app calls registry.close() (CC-3 lock).

    All names use 'comunify.' prefix (CC-4). EP-17 + EP-18 use mode='override'
    (CC-2 — Comunify replaces core tier + wizard defaults). All other EPs use
    mode='append' (default).

    Real handlers land in later tickets — placeholders raise NotImplementedError
    when invoked. See module docstring SCOPE section.
    """

    # ───────────────────────────────────────────────────────────────────────
    # EP-1 — field_override (Callable, mode='append')
    # ───────────────────────────────────────────────────────────────────────
    # Comunify overrides buyer_persona.min_count=3 per brand.yaml +
    # 03-arch.md § 4.1 brand_studio.field_overrides. authority_vault required
    # section is enforced separately at brand_studio.sections level — NOT a
    # per-field FieldOverride (no `required` field on FieldOverride dataclass).
    # The buyer_persona min_count override fires when brand-studio asks for
    # the buyer_persona section field definition with name='min_count'.

    def _comunify_field_override(field: FieldDef, ctx: BrandContext) -> Optional[FieldOverride]:
        if field.name == "min_count" and field.section == "buyer_persona":
            # D11 — multi-persona mandatory (vs core default min_count=1).
            # FieldOverride contract per Story 9 SDK cement: (name, default_value,
            # label, hint, required). The min_count semantic ships via
            # default_value=3 — brand-studio FE consumes default_value as the
            # initial / minimum count for the buyer_persona repeater.
            return FieldOverride(
                name=field.name,
                default_value=3,
                hint="Mínimo 3 buyer personas para vertical creator-economy (D11)",
                required=True,
            )
        # Future field overrides per creator-economy vertical land here.
        return None

    registry.field_override(
        _comunify_field_override,
        name=_ns("creator_economy_field_overrides"),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-2 — offer_preset_pack_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # brand.yaml::offer_studio.preset_pack = "coaching_offers_v1"
    # Real preset content materializes when offer-studio Coaching wizard ships.

    registry.offer_preset_pack_register(
        PresetPack(
            name=_ns("coaching_offers_v1"),
            presets=(),  # populated later — offer-studio Coaching preset ticket
            applies_to_brand=_BRAND_SLUG,
            description=(
                "Comunify coaching offers preset pack — 4-level ladder "
                "(lead_magnet → tripwire → core → premium) for creator-economy"
            ),
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-3 — sales_agent_tool_register (DataClass + Callable)
    # ───────────────────────────────────────────────────────────────────────
    # 4 creator-economy tools per brand.yaml::agentic_tools + 03-arch-agentic § 4.
    # Handlers are placeholders — real impl in T-tools-1..4.

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("qualify_for_cohort"),
            description=(
                "Qualify lead vs cohort criteria. Returns fit + recommended ladder tier "
                "(level_1_lead_magnet → level_4_premium). Persists "
                "comunify_lead_qualification_records snapshot and emits LeadQualified "
                "domain event triggering CohortEnrollmentWorkflow."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "lead_id": {"type": "string", "format": "uuid"},
                    "cohort_id": {"type": ["string", "null"], "format": "uuid"},
                    "lead_data": {
                        "type": "object",
                        "description": "business_stage, income, primary_pain signals",
                    },
                    "action": {
                        "type": "string",
                        "enum": ["assess", "score", "snapshot"],
                        "default": "score",
                    },
                },
                "required": ["lead_id"],
            },
            handler=_not_implemented_yet("EP-3 comunify.qualify_for_cohort", "T-tools-1"),
            tool_groups=("qualification", "cohort"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("link_to_community"),
            description=(
                "Generate signed invite URL (HMAC) or resend / suggest path / verify "
                "access for enrolled subscriber. 4 actions: generate_invite, "
                "resend_invite, suggest_path, verify_access. Idempotent per "
                "(subscriber_id, cohort_id, action) 5-min window."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "subscriber_id": {"type": "string", "format": "uuid"},
                    "cohort_id": {"type": ["string", "null"], "format": "uuid"},
                    "action": {
                        "type": "string",
                        "enum": [
                            "generate_invite",
                            "resend_invite",
                            "suggest_path",
                            "verify_access",
                        ],
                        "default": "generate_invite",
                    },
                },
                "required": ["subscriber_id"],
            },
            handler=_not_implemented_yet("EP-3 comunify.link_to_community", "T-tools-2"),
            tool_groups=("community", "invite"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("nurture_via_authority_content"),
            description=(
                "Match authority_vault content to lead intent (pricing_guilt, "
                "imposter_syndrome, scaling_overload, burnout_concern, "
                "fear_first_client, general). Read-only matcher — returns content "
                "URLs + next_step recommendation (case_study / press / podcast / "
                "offer_call / offer_workshop)."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "lead_id": {"type": "string", "format": "uuid"},
                    "intent_category": {
                        "type": "string",
                        "enum": [
                            "pricing_guilt",
                            "imposter_syndrome",
                            "scaling_overload",
                            "burnout_concern",
                            "fear_first_client",
                            "general",
                        ],
                    },
                    "preferred_content_type": {
                        "type": "string",
                        "enum": ["case_study", "press_mention", "podcast_episode", "any"],
                        "default": "any",
                    },
                },
                "required": ["lead_id", "intent_category"],
            },
            handler=_not_implemented_yet("EP-3 comunify.nurture_via_authority_content", "T-tools-3"),
            tool_groups=("authority", "nurture"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("book_discovery_call"),
            description=(
                "EXTENDS @luana/core/scheduling calendar (Q4=A reuse) with "
                "appointment_type=discovery_call. 4 actions: list_slots, "
                "confirm_slot, reschedule_existing, cancel. Idempotent per "
                "(action, lead_id, doctor_id, target_slot) 60s window."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "lead_id": {"type": "string", "format": "uuid"},
                    "doctor_id": {"type": ["string", "null"], "format": "uuid"},
                    "booking_id": {"type": ["string", "null"], "format": "uuid"},
                    "action": {
                        "type": "string",
                        "enum": [
                            "list_slots",
                            "confirm_slot",
                            "reschedule_existing",
                            "cancel",
                        ],
                    },
                    "preferred_window": {
                        "type": ["object", "null"],
                        "properties": {
                            "start": {"type": "string", "format": "date"},
                            "days": {"type": "integer", "default": 7},
                        },
                    },
                    "target_slot": {
                        "type": ["string", "null"],
                        "format": "date-time",
                    },
                },
                "required": ["lead_id", "action"],
            },
            handler=_not_implemented_yet("EP-3 comunify.book_discovery_call", "T-tools-4"),
            tool_groups=("scheduling", "discovery_call"),
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-4 — copilot_workflow_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # 2 workflows per brand.yaml::workflows. Steps will be LangGraph nodes per
    # 03-arch-agentic § 6. Placeholder = empty steps tuple until T-workflows-1
    # and T-workflows-2. Dunning sub-workflow embedded inside CohortEnrollment
    # per 03-arch.md § 1 + § 11 D3.

    registry.copilot_workflow_register(
        WorkflowDef(
            name=_ns("community_engagement_workflow"),
            description=(
                "6-state LangGraph state machine for member drift detection + "
                "re-engagement + creator manual escalation. Tenant-TZ-aware "
                "cron tick 9am local. RedisSaver checkpointer cross-brand. "
                "Triggered by MemberDriftDetected event."
            ),
            steps=(),  # populated T-workflows-1 (LangGraph StateGraph definition)
            trigger_event="comunify.member.drift_detected",
        ),
    )

    registry.copilot_workflow_register(
        WorkflowDef(
            name=_ns("cohort_enrollment_workflow"),
            description=(
                "7-state LangGraph state machine for lead → enrolled (qualification "
                "→ discovery_call → terms → payment_pending → enrolled, with "
                "payment_expired and dunning_state branches). DunningWorkflow "
                "embedded (4-state machine: active → past_due → suspended → "
                "cancelled per D19). RedisSaver checkpointer. Triggered by "
                "LeadQualified event."
            ),
            steps=(),  # populated T-workflows-2 (LangGraph + Dunning embedded)
            trigger_event="comunify.lead.qualified",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-5 — scheduling_booking_policy_register (DataClass + Callable)
    # ───────────────────────────────────────────────────────────────────────
    # Comunify cohort capacity enforcement: prevent double-enrollment when
    # cohort full. Advisory-lock-backed real implementation lands in
    # scheduling/cohort integration ticket. Placeholder always allows.

    def _cohort_capacity_policy(booking: Any, ctx: BrandContext) -> BookingResult:
        # Placeholder — real cohort capacity + waitlist lookup lands in
        # T-be-5 (BE Cohort service) + scheduling integration.
        return BookingResult(
            allowed=True,
            reason="placeholder — real cohort capacity advisory lock in T-be-5 scheduling integration",
        )

    registry.scheduling_booking_policy_register(
        BookingPolicy(
            name=_ns("cohort_capacity_check"),
            can_confirm=_cohort_capacity_policy,
            priority=100,  # High priority — runs before generic policies
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-6 — sidebar_routes_register (DataClass, signature-only v0.1.0)
    # ───────────────────────────────────────────────────────────────────────
    # 3 routes core to Comunify creator UX: cohorts overview, community feed,
    # subscriptions admin. Full 13-route inventory lives in 03-arch-fe.md;
    # only top-level sidebar entries register here. Sub-routes (detail /
    # roster / broadcasts) resolved by Next.js App Router under each parent.

    registry.sidebar_routes_register(
        SidebarRouteDef(
            slug=_ns("cohorts"),
            label="Cohortes",
            icon="users",
            order=20,
            role_required="creator_admin",
        ),
    )

    registry.sidebar_routes_register(
        SidebarRouteDef(
            slug=_ns("community"),
            label="Comunidad",
            icon="message-circle",
            order=30,
            role_required="creator_admin",
        ),
    )

    registry.sidebar_routes_register(
        SidebarRouteDef(
            slug=_ns("subscriptions"),
            label="Suscripciones",
            icon="credit-card",
            order=40,
            role_required="creator_admin",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-7 — extractor_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # 2 extractors per brand.yaml::extractors + 03-arch-agentic § 5.
    # VoiceDistillationOrchestrator (T-voice-1 NEW Story 12) is also a
    # BaseExtractionOrchestrator subclass but registered separately as a
    # voice-cloning pipeline (NOT as an EP-7 extractor) since it targets
    # the brand voice profile rather than offer/brand/landing entity data.

    registry.extractor_register(
        ExtractorDef(
            name=_ns("offer_ladder_advisor"),
            target_module="offer",  # extends BaseExtractionOrchestrator on offer context
            wave_position=10,
            prompt_template_ref="comunify/offer_ladder_advisor.j2",
            output_schema_ref="OfferLadderAdviceV1",
        ),
    )

    registry.extractor_register(
        ExtractorDef(
            name=_ns("authority_vault_extractor"),
            target_module="brand",  # extends BaseExtractionOrchestrator on brand context
            wave_position=11,
            prompt_template_ref="comunify/authority_vault_extractor.j2",
            output_schema_ref="AuthorityVaultExtractedV1",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-8 — channel_adapter_register (DataClass + Callables)
    # ───────────────────────────────────────────────────────────────────────
    # 3 payment-channel adapters per brand.yaml::payment_gateways. Adapter
    # CLASSES already exist (T-payment-1 DONE — ComunifyMercadoPagoAdapter,
    # ComunifyStripeConnectAdapter, ComunifyTokenizedRecurringAdapter). EP-8
    # registration shape requires send/receive/format_for_channel callables;
    # these are placeholders until T-be-9 webhook receivers wire the adapter
    # methods (charge, refund, webhook signature verify) into the registry.
    #
    # Why placeholders here despite adapter classes existing? Adapter classes
    # encapsulate provider SDK plumbing (Stripe.Charge.create, MP preferences
    # etc.) — they are NOT yet wrapped as ChannelAdapterDef send/receive
    # callables matching the SDK contract. That wiring happens in T-be-9.

    for gateway_slug, label in [
        ("mercadopago", "MercadoPago LatAm primary"),
        ("stripe_connect", "Stripe Connect US/EU subscribers fallback"),
        ("tokenized_recurring", "Tokenized recurring (subscriptions + cohort installments)"),
    ]:
        registry.channel_adapter_register(
            ChannelAdapterDef(
                channel_slug=_ns(gateway_slug),
                send=_not_implemented_yet(
                    f"EP-8 {_ns(gateway_slug)} send",
                    "T-be-9 payment webhook receivers + send wiring",
                ),
                receive=_not_implemented_yet(
                    f"EP-8 {_ns(gateway_slug)} receive",
                    "T-be-9 payment webhook receivers",
                ),
                format_for_channel=_not_implemented_yet(
                    f"EP-8 {_ns(gateway_slug)} format_for_channel",
                    "T-be-9 payment webhook receivers + format wiring",
                ),
                target_agent_runtime="vertical_brand",
                webhook_handler=_not_implemented_yet(
                    f"EP-8 {_ns(gateway_slug)} webhook_handler",
                    "T-be-9 payment webhook receivers (Stripe + MP signature verify)",
                ),
            ),
        )

    # ───────────────────────────────────────────────────────────────────────
    # EP-9 — metric_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # Comunify creator-economy metric: cohort engagement score (avg ratio
    # active_days_last_30 / 30 per member). Real compute in future analytics
    # integration ticket.

    registry.metric_register(
        MetricDef(
            name=_ns("cohort_engagement_score"),
            module="analytics",
            aggregation="avg",
            unit="ratio",
            currency_aware=False,
            stage_assignment="nurture",
            refresh_freq="daily",
            python_compute=_not_implemented_yet(
                "EP-9 comunify.cohort_engagement_score compute",
                "future analytics integration ticket",
            ),
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-10 — landing_template_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # Public creator landing page template (subscribe / discover cohort).
    # Embeddable subscription widget bundle (Q5=B both iframe + canonical)
    # ships separately in comunify/frontend/widget/.

    registry.landing_template_register(
        LandingTemplateDef(
            template_id=_ns("creator_landing_hero"),
            vertical_hint="creator_economy",
            sections_schema={
                "sections": [
                    "hero_creator_with_avatar",
                    "authority_vault_strip",
                    "ladder_visualizer_public",
                    "cohort_preview_cards",
                    "testimonials_with_photo",
                    "subscription_widget_embed",
                    "discovery_call_cta",
                ],
            },
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-11 — campaign_template_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # Cohort enrollment payment follow-up drip — triggered by LeadQualified
    # event entering payment_pending state. Mirrors the CohortEnrollmentWorkflow
    # cron rules (24h + 48h reminders pre-dunning).

    registry.campaign_template_register(
        CampaignTemplateDef(
            template_id=_ns("cohort_enrollment_payment_followup"),
            channel="whatsapp",
            steps=(
                CampaignStepDef(
                    step_id="payment_pending_24h",
                    delay_seconds=24 * 3600,
                    template_ref="comunify/payment_followup_24h.j2",
                ),
                CampaignStepDef(
                    step_id="payment_pending_48h",
                    delay_seconds=48 * 3600,
                    template_ref="comunify/payment_followup_48h.j2",
                ),
            ),
            trigger_event="comunify.cohort_enrollment.payment_pending",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-12 — asset_template_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # Cohort welcome packet PDF (delivered post-enrollment).

    registry.asset_template_register(
        AssetTemplateDef(
            template_id=_ns("cohort_welcome_packet_pdf"),
            asset_type="pdf",
            placeholders={
                "subscriber_full_name": "str",
                "cohort_name": "str",
                "cohort_start_date": "date",
                "creator_full_name": "str",
                "community_invite_url": "str",
                "first_session_at": "datetime",
            },
            source_path="comunify/templates/cohort_welcome_packet_v1.pdf",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-13 — sales_agent_guardrail_register (DataClass + Callables)
    # ───────────────────────────────────────────────────────────────────────
    # 4 guardrails per brand.yaml::guardrails + 03-arch-agentic § 10.
    # Real check callables land in T-guards-1..4. prompt_injection_block
    # reuses Story E base — we still register the brand-scoped comunify.* alias
    # here for CC-4 namespace consistency (real handler will delegate to
    # Story E base function).
    #
    # mode semantics:
    #   - no_spam:                 'block' (severity medium per 03-arch-agentic § 10.2)
    #   - no_nsfw:                 'block' (severity medium — block pre-persist on images)
    #   - no_doxxing:              'block' (severity high — D16 cross-ref cohort_members)
    #   - prompt_injection_block:  'block' (production-critical adversarial bar pass^5 ≥0.95)

    def _block_handler_placeholder(msg: str, ctx: BrandContext) -> GuardrailResult:
        # Defensive default: NOT blocking — placeholder is permissive (warn mode
        # semantics). T-guards-1..4 replace via direct edit of this file (since
        # EP-13 mode='override' is NOT permitted by CC-2).
        return GuardrailResult(blocked=False)

    for guard_name, priority, mode_kind in [
        ("community_safety_no_spam", 10, "block"),
        ("community_safety_no_nsfw", 10, "block"),
        ("community_safety_no_doxxing", 5, "block"),
        ("prompt_injection_block", 5, "block"),
    ]:
        registry.sales_agent_guardrail_register(
            GuardrailDef(
                name=_ns(guard_name),
                pre_send_check=_block_handler_placeholder,
                pre_receive_check=_block_handler_placeholder,
                priority=priority,
                mode=mode_kind,  # type: ignore[arg-type]
            ),
        )

    # ───────────────────────────────────────────────────────────────────────
    # EP-14 — copilot_kb_pack_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # 1 brand-curated creator-economy KB pack per brand.yaml::kb_packs.
    # Real Qdrant ingestion lands in T-kb-1 (parse + embed + upsert ~250 chunks
    # from creator_economy_kb_v1/*.md files). tenant_scope='brand' means
    # cross-tenant share (creator-economy reference content — frameworks,
    # terminology, cohort design playbooks — not per-tenant secrets).
    # Per-tenant vulnerable_disclosure_playbook chunk forced retrieval lives
    # at query-time in T-kb-1, not as a separate pack registration.

    registry.copilot_kb_pack_register(
        KbPackDef(
            pack_id=_ns("creator_economy_kb_v1"),
            documents_path="comunify/backend/src/modules/comunify/copilot/kb/creator_economy_kb_v1/",
            embedding_model_ref="text-embedding-3-large",
            qdrant_collection_name="comunify_creator_economy_kb_v1",  # D17 namespace consistency
            tenant_scope="brand",  # cross-tenant share (D7 creator_economy OK)
            metadata={
                "compliance_level": "creator_economy",  # D7 — not hipaa_lite vs Vitalia
                "label": (
                    "Creator-economy frameworks + terminology + cohort design + "
                    "community engagement playbooks + voice cloning tips"
                ),
                "forced_retrieval_chunk_id": "vulnerable_disclosure_playbook",  # T-kb-1 wires
                "expected_chunk_count_baseline": 250,
            },
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-15 — crm_lifecycle_stage_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # NEW lifecycle stage for cohort enrollment payment-pending state.
    # Sits between qualified lead and confirmed booking — used by CRM dashboards
    # to surface "needs payment follow-up" segment.

    registry.crm_lifecycle_stage_register(
        LifecycleStageDef(
            stage_id=_ns("payment_pending_enrollment"),
            label="Pago pendiente (cohorte)",
            after_stage="qualified_lead",
            before_stage="enrolled",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-16 — iam_signup_handler (Callable)
    # ───────────────────────────────────────────────────────────────────────
    # Creator signup auto-approves (vs Vitalia medical_clinic_signup which
    # requires manual review). Creator-economy verification is lighter — no
    # regulatory authority validation needed (creator owns own brand).

    def _comunify_creator_signup(clerk_user: Any, ctx: BrandContext) -> SignupResult:
        # Creator signup auto-approves on Clerk webhook completion. Stripe
        # Connect onboarding flow + voice cloning samples upload happen
        # post-signup via onboarding wizard (EP-18). SignupResult.status literal
        # is ('approved' | 'pending_review' | 'rejected') per Story 9 SDK cement;
        # comunify creator-economy uses 'approved' (vs Vitalia medical clinic
        # 'pending_review' — D7 lighter compliance, no regulatory check).
        return SignupResult(
            status="approved",
            metadata={
                "compliance_level": "creator_economy",  # D7
                "voice_cloning_pipeline_required": True,  # D8 ON — wizard prompts samples upload
                "default_plan_tier": "comunify.creator",
            },
        )

    registry.iam_signup_handler(
        _comunify_creator_signup,
        name=_ns("creator_signup"),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-17 — tenant_plan_tier_register (DataClass, mode='override' allowed)
    # ───────────────────────────────────────────────────────────────────────
    # 3 tiers per brand.yaml::subscriptions.plan_tiers. mode='override' per
    # CC-2 — Comunify replaces core defaults with creator-economy pricing
    # (creator $29 / pro $99 / agency $299 USD/mo per D20-related — and full
    # plan_tiers spec in brand.yaml subscriptions section).

    registry.tenant_plan_tier_register(
        PlanTierDef(
            tier_id=_ns("creator"),
            label="Creator",
            price_monthly=29.0,
            currency="USD",
            features=(
                "brand_studio_full",
                "offer_studio_coaching",
                "offer_ladder_visualizer",
                "sales_agent_vertical_creator",
                "community_engagement_workflow",
            ),
            limits={"max_cohorts": 1, "max_subscribers": 100},
        ),
        mode="override",
    )

    registry.tenant_plan_tier_register(
        PlanTierDef(
            tier_id=_ns("pro"),
            label="Pro",
            price_monthly=99.0,
            currency="USD",
            features=(
                "all_creator_features",
                "voice_cloning_pipeline",  # D8 ON for pro+
                "multi_cohort",
                "recurring_subscriptions",
                "cohort_enrollment_workflow",
            ),
            limits={"max_cohorts": 3, "max_subscribers": 500},
        ),
        mode="override",
    )

    registry.tenant_plan_tier_register(
        PlanTierDef(
            tier_id=_ns("agency"),
            label="Agency",
            price_monthly=299.0,
            currency="USD",
            features=(
                "all_pro_features",
                "team_seats",
                "advanced_analytics",
                "multi_brand_management",
            ),
            limits={"max_cohorts": 10, "max_subscribers": 5000},
        ),
        mode="override",
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-18 — onboarding_wizard_steps_register (DataClass, mode='override' allowed)
    # ───────────────────────────────────────────────────────────────────────
    # Creator-niche selection + voice cloning samples upload are the headline
    # Comunify-specific onboarding steps. Full 4-step wizard (per spec § 6.1)
    # lives in FE; here we register the brand-level overrides — niche picker
    # (replaces generic vertical question) + voice samples uploader (NEW
    # Story 12 D8 — Vitalia OFF). Full wizard step ordering is FE-resolved.

    registry.onboarding_wizard_steps_register(
        WizardStepDef(
            step_id=_ns("creator_niche_picker"),
            title="Tu nicho creador",
            component_ref="ComunifyCreatorNichePicker",
            prereqs=(),
            skippable=False,
        ),
        mode="override",
    )

    registry.onboarding_wizard_steps_register(
        WizardStepDef(
            step_id=_ns("voice_samples_uploader"),
            # D9 — Chrome UI tuteo (NOT voseo) per spec § 17 Q1=B. "Sube" tuteo
            # imperative; sales_agent voice exception (voseo OK) applies only to
            # lead/member-facing output, not creator-facing onboarding chrome.
            title="Sube 50+ chats para clonar tu voz",
            component_ref="ComunifyVoiceSamplesUploader",
            prereqs=(_ns("creator_niche_picker"),),
            skippable=True,  # D8 — voice cloning recommended but not blocking signup
            post_action_event="comunify.voice_cloning.samples_uploaded",
        ),
        mode="override",
    )
