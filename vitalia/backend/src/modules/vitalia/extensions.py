"""Vitalia Extension SDK registration — single entry point.

Story 11 T-extensions-1 (R23 Opus 4.7 production AGENTIC code).

Per 03-arch.md § 4.1 + 03-arch-agentic.md § 3.2 + 02-design-agentic.md § 18.3 — single
`register_all(registry)` function mounts the entire Vitalia brand surface onto the
Luana platform via Extension SDK EP-1..EP-18.

Pattern reference: apps/test-brand/src/test_brand/extensions.py (Story 8 cement).

NOTE on design vs implementation reconciliation:

The architectural pseudo-code (02-design-agentic § 18.3 + 03-arch § 4.1) shows
`ExtensionPointRegistry.register_all(brand_slug=..., config={dict})` as a single
classmethod. The actual SDK (Story 9 cement, frozen by `core/luana-core-extension-sdk/`)
exposes 18 individual `register_*` methods per EP — there is NO `register_all` classmethod
on the registry, and per CC-5 inmutable post-startup the SDK cannot grow new public
methods. The "single entry point" semantics are preserved by THIS module-level
`register_all(registry)` function that mounts everything in one call — same intent,
same single-call interface, contract-compliant with the Story 9 frozen SDK.

This is the test-brand precedent pattern (apps/test-brand/src/test_brand/extensions.py).

═══════════════════════════════════════════════════════════════════════════════
PHASE / SCOPE — T-extensions-1 is MOUNTING SCAFFOLDING ONLY
═══════════════════════════════════════════════════════════════════════════════

This ticket creates the wiring SHELL. Tool handlers, extractor implementations,
workflow graph definitions, KB pack chunks, guardrail check functions and channel
adapter send/receive callables are PLACEHOLDERS that raise NotImplementedError when
invoked. Real implementations land in later tickets:

  T-tools-1..4         → EP-3 tool handlers (prepaid_payment_check, etc.)
  T-extractors-1,2     → EP-7 extractors (MedicalKBExtractor, DentalHistoryExtractor)
  T-workflow-1         → EP-4 TreatmentFollowupWorkflow LangGraph definition
  T-kb-1..3            → EP-14 KB pack chunks + Qdrant ingestion
  T-guards-1..3        → EP-13 guardrail check callables
  T-prompts-1          → Slot 4 MEDICAL_SAFETY_RAILS prompt layer (NOT an EP)
  later (post-bootstrap) → EP-8 channel adapter send/receive, EP-16 signup handler

Later tickets replace placeholders by re-registering with mode='override' (EP-17, EP-18)
or by editing this file directly and bumping the relevant EP-3..EP-14 registration to
the real callable. All names use the 'vitalia.' prefix per CC-4 namespace.

═══════════════════════════════════════════════════════════════════════════════

Decisions honored:
  D1  — Vitalia subdir at luana-platform/vitalia/ (no separate repo)
  D5  — Slot 4 MEDICAL_SAFETY_RAILS (architecture phase reserves slot; prompt MD
        lands in T-prompts-1, not registered here)
  D7  — compliance_level=hipaa_lite (Q6=B; see brand.yaml + KbPackDef.metadata)
  D8  — voice_cloning_enabled=false (see brand.yaml; no SDK surface)
  D9  — Spanish neutro LatAm tuteo for chrome UI (sales_agent voice respects tenant)

Anti-duplication audit per .claude/rules/anti-duplication.md § 0:
  - SDK contract cement is `luana_core_extension_sdk.extension_points.ExtensionPointRegistry`.
    This module IS the brand-side consumer, not a shared/ abstraction. NO mirror risk.
  - test-brand precedent verified at apps/test-brand/src/test_brand/extensions.py.
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

# T-ag-tools-2 — Adrián 3 Slice 1 MVP tools (real callables, brand-extension).
from src.modules.vitalia.compliance.guardrails.medical_disclaimer_required import (
    guardrail_check_disclaimer_required,
)
from src.modules.vitalia.compliance.guardrails.medical_safety_no_diagnosis import (
    guardrail_check_no_diagnosis,
)
from src.modules.vitalia.compliance.guardrails.medical_safety_no_prescription import (
    guardrail_check_no_prescription,
)
from src.modules.vitalia.compliance.guardrails.prompt_injection_block_reuse import (
    guardrail_check_prompt_injection,
)

# ════════════════════════════════════════════════════════════════════════════
# T-infra-2 — 5 NEW Vitalia brand-internal registries (referenced by EP-3 tools
# + EP-8 channel adapters + EP-12 asset templates). These are NOT new engine
# EPs; they are brand-specific dispatch tables consumed at runtime by the
# corresponding EP handlers. Slice 2 lift candidates documented in
# `vitalia/docs/product/stories/vitalia-ux-discovery/delta-arch-notes.md`.
# ════════════════════════════════════════════════════════════════════════════
from src.modules.vitalia.connections.appointment_origin import (
    APPOINTMENT_ORIGIN_REGISTRY,
)
from src.modules.vitalia.connections.conversation_initiation import (
    CONVERSATION_INITIATION_REGISTRY,
)
from src.modules.vitalia.connections.fiscal import (
    FISCAL_PROVIDER_REGISTRY,
)
from src.modules.vitalia.connections.payment import (
    PAYMENT_PROVIDER_REGISTRY,
)
from src.modules.vitalia.connections.print_method import (
    PRINT_METHOD_REGISTRY,
)

# T-ag-tools-1 — Valeria 4 wizard tools (real callables — replace placeholders).
# Real LangChain @tool decorated async fns, Pydantic v2 args_schema, tenant-scoped.
from src.modules.vitalia.copilot.tools import (
    complete_onboarding,
    confirm_slot,
    extract_tenant_context,
    simulate_personality,
)
from src.modules.vitalia.sales_agent.tools import (
    reschedule_appointment,
    screening_questions,
    send_payment_link,
)

# Module-level smoke: each registry exposes at least one slot (Slice 1 floor).
# This guarantees `register_all` can dispatch through any of the 5 surfaces
# without an empty-registry runtime KeyError. The actual count invariants live
# in `tests/test_extensions.py` Part A.
assert PAYMENT_PROVIDER_REGISTRY, "vitalia payment registry must have ≥1 slot"
assert FISCAL_PROVIDER_REGISTRY, "vitalia fiscal registry must have ≥1 slot"
assert APPOINTMENT_ORIGIN_REGISTRY, "vitalia appointment_origin registry must have ≥1 slot"
assert CONVERSATION_INITIATION_REGISTRY, "vitalia conversation_initiation registry must have ≥1 slot"
assert PRINT_METHOD_REGISTRY, "vitalia print_method registry must have ≥1 slot"

# ════════════════════════════════════════════════════════════════════════════
# CC-4 namespace prefix
# ════════════════════════════════════════════════════════════════════════════

_BRAND_SLUG = "vitalia"


def _ns(suffix: str) -> str:
    """Prepend 'vitalia.' namespace per CC-4 enforcement."""
    return f"{_BRAND_SLUG}.{suffix}"


# ════════════════════════════════════════════════════════════════════════════
# Placeholder handler used until later tickets land real implementations
# ════════════════════════════════════════════════════════════════════════════


def _not_implemented_yet(extension_point: str, owner_ticket: str):
    """Build a placeholder callable that fails clearly when invoked.

    Registry stores the callable; invoking it raises NotImplementedError with a
    pointer to the ticket that will provide the real implementation.

    Per `tessl__graceful-degradation` rule 2: explicit fallback message tells caller
    exactly where to look for the real handler.
    """

    def _placeholder(*args: Any, **kwargs: Any) -> Any:
        raise NotImplementedError(
            f"{extension_point} handler is a placeholder — real implementation "
            f"lands in {owner_ticket}. Story 11 T-extensions-1 scope is mounting only."
        )

    return _placeholder


# ════════════════════════════════════════════════════════════════════════════
# register_all — single entry point
# ════════════════════════════════════════════════════════════════════════════


def register_all(registry: ExtensionPointRegistry) -> None:
    """Register Vitalia brand surface across EP-1..EP-18.

    Called by FastAPI lifespan at startup (Story 11 BE composition root) per
    Story 8 test-brand pattern. After register_all, the brand app calls
    registry.close() (CC-3 lock).

    All names use 'vitalia.' prefix (CC-4). EP-17 + EP-18 use mode='override'
    (CC-2 — Vitalia replaces core tier + wizard defaults). All other EPs use
    mode='append' (default).

    Real handlers land in later tickets — placeholders raise NotImplementedError
    when invoked. See module docstring SCOPE section.
    """

    # ───────────────────────────────────────────────────────────────────────
    # EP-1 — field_override (Callable, mode='append')
    # ───────────────────────────────────────────────────────────────────────
    # Vitalia does NOT override any specific core fields in Story 11 — the medical
    # vertical uses the standard offer/brand fields. This handler always returns
    # None so the registry has ≥1 EP-1 record (smoke surface).
    # Real medical field overrides (e.g. patient_age min/max, medical_id format)
    # land in a future ticket when offer-studio medical preset materializes.

    def _vitalia_field_override(field: FieldDef, ctx: BrandContext) -> Optional[FieldOverride]:
        # Placeholder — no-op until real overrides ratified. Returning None means
        # "no override for this field" — registry.resolve_field_override moves on.
        return None

    registry.field_override(
        _vitalia_field_override,
        name=_ns("medical_field_overrides"),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-2 — offer_preset_pack_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # brand.yaml::offer_studio.preset_pack = "medical_services_v1"
    # Real preset content materializes when offer-studio Medical wizard lands.

    registry.offer_preset_pack_register(
        PresetPack(
            name=_ns("medical_services_v1"),
            presets=(),  # populated later — offer-studio Medical preset ticket
            applies_to_brand=_BRAND_SLUG,
            description="Vitalia medical services offer preset (consultas + procedures + treatments)",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-3 — sales_agent_tool_register (DataClass + Callable)
    # ───────────────────────────────────────────────────────────────────────
    # 4 medical tools per brand.yaml::agentic_tools + 03-arch-agentic § 4.
    # Handlers are placeholders — real impl in T-tools-1..4.

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("prepaid_payment_check"),
            description=(
                "Verify payment_status pre-confirm booking. Read-only query — "
                "use BEFORE confirming booking OR sending 'treatment starts' reminder."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "booking_id": {"type": "string", "format": "uuid"},
                },
                "required": ["booking_id"],
            },
            handler=_not_implemented_yet("EP-3 vitalia.prepaid_payment_check", "T-tools-1"),
            tool_groups=("payment", "booking"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("treatment_followup_check"),
            description=(
                "Check adherence current treatment step + record patient response. "
                "Called by TreatmentFollowupWorkflow node (cron + patient-response triggered)."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "treatment_id": {"type": "string", "format": "uuid"},
                    "action": {
                        "type": "string",
                        "enum": [
                            "initial_d5_ping",
                            "initial_d14_ping",
                            "initial_d90_ping",
                            "record_d5_response",
                            "record_d14_response",
                            "record_d90_response",
                            "snapshot_status",
                        ],
                    },
                    "response_text": {"type": ["string", "null"]},
                },
                "required": ["treatment_id", "action"],
            },
            handler=_not_implemented_yet("EP-3 vitalia.treatment_followup_check", "T-tools-4"),
            tool_groups=("treatment_followup", "workflow"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("medical_consent_request"),
            description=(
                "Generate consent capture URL + send delivery via WhatsApp/email. "
                "Used BEFORE prepaid_payment_check when offer marks requires_consent=true."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "booking_id": {"type": ["string", "null"], "format": "uuid"},
                    "patient_id": {"type": "string", "format": "uuid"},
                    "consent_template_slug": {"type": "string"},
                    "delivery_channel": {
                        "type": "string",
                        "enum": ["whatsapp", "email", "both"],
                        "default": "both",
                    },
                },
                "required": ["patient_id", "consent_template_slug"],
            },
            handler=_not_implemented_yet("EP-3 vitalia.medical_consent_request", "T-tools-2"),
            tool_groups=("consent", "compliance"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("appointment_reschedule_with_doctor"),
            description=(
                "Reschedule appointment with doctor availability lock (advisory locks). "
                "4 actions: lookup_slots, hold, confirm_swap, release. Idempotent per action."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "string", "format": "uuid"},
                    "action": {
                        "type": "string",
                        "enum": ["lookup_slots", "hold", "confirm_swap", "release"],
                    },
                    "target_slot_id": {"type": ["string", "null"]},
                    "hold_ttl_seconds": {"type": ["integer", "null"]},
                },
                "required": ["appointment_id", "action"],
            },
            handler=_not_implemented_yet("EP-3 vitalia.appointment_reschedule_with_doctor", "T-tools-3"),
            tool_groups=("scheduling", "rescheduling"),
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-3 — Valeria wizard tools (4 NEW per T-ag-tools-1, real callables)
    # ───────────────────────────────────────────────────────────────────────
    # Per 03-arch-agentic.md § 4.1 + 05-guidelines.md § 1.18 — Valeria copilot
    # tools surface via EP-3 (sales_agent_tool_register is the unified tool
    # dispatch surface for both agents per Story 9 SDK cement; copilot uses the
    # same registry method, dispatched at runtime via tool_groups filter).
    #
    # These 4 are REAL callables (LangChain @tool decorated, async, Pydantic v2
    # args_schema). Replace the placeholder pattern used by the sales_agent
    # treatment_* tools above. Tool handler is the @tool-decorated async fn
    # itself; Extension SDK passes it through to the LangGraph supervisor at
    # binding time.

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("extract_tenant_context"),
            description=(
                "Extract clinic configuration (name, vertical, location) from a URL, "
                "pasted text, or short audio. Orchestrates website scraper + document "
                "extractor + Whisper STT. NEVER processes PHI."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "draft_id": {"type": "string", "format": "uuid"},
                    "tenant_id": {"type": "string", "format": "uuid"},
                    "url": {"type": ["string", "null"]},
                    "text_content": {"type": ["string", "null"]},
                },
                "required": ["draft_id", "tenant_id"],
            },
            handler=extract_tenant_context,
            tool_groups=("wizard", "copilot", "onboarding"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("confirm_slot"),
            description=(
                "Mark a wizard slot as user-confirmed. Bumps confidence to 1.0, sets "
                "confirmed_at, and persists via OnboardingDraftService.update_slot."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "draft_id": {"type": "string", "format": "uuid"},
                    "tenant_id": {"type": "string", "format": "uuid"},
                    "slot_id": {"type": "string", "minLength": 1, "maxLength": 128},
                    "value": {"type": ["string", "object", "null"]},
                    "source": {
                        "type": "string",
                        "enum": ["user_text", "user_correction"],
                        "default": "user_text",
                    },
                },
                "required": ["draft_id", "tenant_id", "slot_id", "value"],
            },
            handler=confirm_slot,
            tool_groups=("wizard", "copilot", "onboarding"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("simulate_personality"),
            description=(
                "Generate a personality-aligned sample text for live wizard preview. "
                "Throttled 5 calls/min/tenant + cached 10 min TTL by combination of "
                "(profile_partial, scenario)."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "tenant_id": {"type": "string", "format": "uuid"},
                    "profile_partial": {"type": "object"},
                    "scenario": {"type": "string", "minLength": 1, "maxLength": 64},
                },
                "required": ["tenant_id", "profile_partial", "scenario"],
            },
            handler=simulate_personality,
            tool_groups=("wizard", "copilot", "personality_preview"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("complete_onboarding"),
            description=(
                "Finalize Valeria wizard onboarding: compile full personality profile, "
                "commit brand profile, activate tenant, write audit_log SYNC, emit "
                "TenantOnboardedEvent via outbox."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "draft_id": {"type": "string", "format": "uuid"},
                    "tenant_id": {"type": "string", "format": "uuid"},
                    "user_id": {"type": "string", "format": "uuid"},
                },
                "required": ["draft_id", "tenant_id", "user_id"],
            },
            handler=complete_onboarding,
            tool_groups=("wizard", "copilot", "onboarding"),
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-3 — Adrián sales_agent 3 MVP tools (NEW per T-ag-tools-2 Slice 1)
    # ───────────────────────────────────────────────────────────────────────
    # Per 03-arch-agentic.md § 4.2 + 02-design-agentic.md § 2.3 — 3 Slice 1
    # MVP per Q1 default (send_template_confirmation + retract_last_message
    # deferred Slice 2). Real LangChain @tool decorated async fns,
    # Pydantic v2 args_schema, tenant + clinic dual filter cardinal.

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("screening_questions"),
            description=(
                "Apply medical screening to a lead before booking. Loads vertical-specific "
                "questions from YAML SSoT, calls LLM nano classifier, sanitizes PHI, persists "
                "LeadScreeningEvent (tenant+clinic dual filter), writes audit log SYNC. "
                "Outcomes: ok_proceed | derivar_doctor | derivar_emergencia | awaiting_response."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "lead_id": {"type": "string", "format": "uuid"},
                    "vertical": {
                        "type": "string",
                        "enum": ["dental", "estetica", "psicologia", "fertilidad", "otro"],
                    },
                    "tenant_id": {"type": "string", "format": "uuid"},
                    "clinic_id": {"type": "string", "format": "uuid"},
                    "lead_response": {"type": ["string", "null"]},
                    "user_id": {"type": ["string", "null"], "format": "uuid"},
                },
                "required": ["lead_id", "vertical", "tenant_id", "clinic_id"],
            },
            handler=screening_questions,
            tool_groups=("sales_agent", "vertical_medical", "screening"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("send_payment_link"),
            description=(
                "Create + dispatch a MercadoPago deposit payment link. ChannelGuard validates "
                "BEFORE any send (BlockedChannelError aborts pre-send). Writes payment_events "
                "with idempotency key (appointment_id, deposit_percent). Sync audit log."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "lead_id": {"type": "string", "format": "uuid"},
                    "appointment_id": {"type": "string", "format": "uuid"},
                    "deposit_percent": {"type": "integer", "minimum": 1, "maximum": 100},
                    "channel": {"type": "string", "minLength": 1, "maxLength": 64},
                    "tenant_id": {"type": "string", "format": "uuid"},
                    "clinic_id": {"type": "string", "format": "uuid"},
                    "amount": {"type": "number", "minimum": 0.0},
                    "to_phone": {"type": "string"},
                    "currency": {"type": "string", "minLength": 3, "maxLength": 3},
                    "template_name": {"type": "string"},
                    "user_id": {"type": ["string", "null"], "format": "uuid"},
                },
                "required": [
                    "lead_id",
                    "appointment_id",
                    "deposit_percent",
                    "channel",
                    "tenant_id",
                    "clinic_id",
                ],
            },
            handler=send_payment_link,
            tool_groups=("sales_agent", "vertical_medical", "payment", "booking"),
        ),
    )

    registry.sales_agent_tool_register(
        ToolDef(
            name=_ns("reschedule_appointment"),
            description=(
                "Reschedule an existing appointment to a new slot. Delegates to "
                "AppointmentService (validates professional availability + cross-clinic "
                "filter). Emits appointment_rescheduled outbox event. Sync audit log."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "appointment_id": {"type": "string", "format": "uuid"},
                    "new_starts_at": {"type": "string", "format": "date-time"},
                    "reason": {"type": "string", "maxLength": 500},
                    "tenant_id": {"type": "string", "format": "uuid"},
                    "clinic_id": {"type": "string", "format": "uuid"},
                    "user_id": {"type": ["string", "null"], "format": "uuid"},
                },
                "required": [
                    "appointment_id",
                    "new_starts_at",
                    "reason",
                    "tenant_id",
                    "clinic_id",
                ],
            },
            handler=reschedule_appointment,
            tool_groups=("sales_agent", "vertical_medical", "scheduling", "rescheduling"),
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-4 — copilot_workflow_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # 1 workflow per brand.yaml::workflows. Steps will be LangGraph nodes per
    # 03-arch-agentic § 6. Placeholder = empty steps tuple until T-workflow-1.

    registry.copilot_workflow_register(
        WorkflowDef(
            name=_ns("treatment_followup_workflow"),
            description=(
                "5-state LangGraph state machine for D5/D14/D90 treatment adherence. "
                "Triggered by treatment-start event + cron ticks. Persisted via RedisSaver."
            ),
            steps=(),  # populated T-workflow-1 (LangGraph StateGraph definition)
            trigger_event="vitalia.treatment.started",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-5 — scheduling_booking_policy_register (DataClass + Callable)
    # ───────────────────────────────────────────────────────────────────────
    # brand.yaml::booking.requires_consent_when_offer_marks=true → policy guards
    # booking confirmation: if offer requires consent AND no consent on file → deny.

    def _requires_consent_policy(booking: Any, ctx: BrandContext) -> BookingResult:
        # Placeholder — real consent lookup lands in scheduling integration ticket.
        # For now: allow all (placeholder) but log so we can detect mis-wiring.
        return BookingResult(
            allowed=True,
            reason="placeholder — real consent lookup in scheduling integration ticket",
        )

    registry.scheduling_booking_policy_register(
        BookingPolicy(
            name=_ns("requires_consent_when_offer_marks"),
            can_confirm=_requires_consent_policy,
            priority=100,  # High priority — runs before generic policies
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-6 — sidebar_routes_register (DataClass, signature-only v0.1.0)
    # ───────────────────────────────────────────────────────────────────────

    registry.sidebar_routes_register(
        SidebarRouteDef(
            slug=_ns("treatment_followups"),
            label="Seguimientos",
            icon="activity",
            order=20,
            role_required="clinic_admin",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-7 — extractor_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # 2 extractors per brand.yaml::extractors + 03-arch-agentic § 5.

    registry.extractor_register(
        ExtractorDef(
            name=_ns("medical_kb_extractor"),
            target_module="brand",  # extends BaseExtractionOrchestrator on brand context
            wave_position=10,
            prompt_template_ref="vitalia/medical_kb_extractor.j2",
            output_schema_ref="MedicalKBExtractorOutput",
        ),
    )

    registry.extractor_register(
        ExtractorDef(
            name=_ns("dental_history_extractor"),
            target_module="brand",
            wave_position=11,
            prompt_template_ref="vitalia/dental_history_extractor.j2",
            output_schema_ref="DentalHistoryExtractorOutput",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-8 — channel_adapter_register (DataClass + Callables)
    # ───────────────────────────────────────────────────────────────────────
    # 3 payment-channel adapters per brand.yaml::payment_gateways.
    # send/receive/format_for_channel are placeholders until payment integration tickets.

    for gateway_slug, label in [
        ("mercadopago", "MercadoPago LatAm"),
        ("stripe_connect", "Stripe Connect US/EU"),
        ("tokenized_recurring", "Tokenized recurring (treatment installments)"),
    ]:
        registry.channel_adapter_register(
            ChannelAdapterDef(
                channel_slug=_ns(gateway_slug),
                send=_not_implemented_yet(f"EP-8 {_ns(gateway_slug)} send", "future payment integration ticket"),
                receive=_not_implemented_yet(f"EP-8 {_ns(gateway_slug)} receive", "future payment integration ticket"),
                format_for_channel=_not_implemented_yet(
                    f"EP-8 {_ns(gateway_slug)} format_for_channel",
                    "future payment integration ticket",
                ),
                target_agent_runtime="vertical_brand",
                webhook_handler=_not_implemented_yet(
                    f"EP-8 {_ns(gateway_slug)} webhook_handler",
                    "future payment integration ticket",
                ),
            ),
        )

    # ───────────────────────────────────────────────────────────────────────
    # EP-9 — metric_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────

    registry.metric_register(
        MetricDef(
            name=_ns("treatment_adherence_score"),
            module="analytics",
            aggregation="avg",
            unit="ratio",
            currency_aware=False,
            stage_assignment="nurture",
            refresh_freq="daily",
            python_compute=_not_implemented_yet(
                "EP-9 vitalia.treatment_adherence_score compute",
                "future analytics integration ticket",
            ),
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-10 — landing_template_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────

    registry.landing_template_register(
        LandingTemplateDef(
            template_id=_ns("medical_consult_landing"),
            vertical_hint="medical",
            sections_schema={
                "sections": [
                    "hero_medical",
                    "service_list",
                    "doctor_credentials",
                    "patient_testimonials",
                    "booking_cta_prepaid",
                ],
            },
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-11 — campaign_template_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────

    registry.campaign_template_register(
        CampaignTemplateDef(
            template_id=_ns("treatment_followup_drip"),
            channel="whatsapp",
            steps=(
                CampaignStepDef(
                    step_id="d5_ping",
                    delay_seconds=5 * 24 * 3600,
                    template_ref="vitalia/d5_followup.j2",
                ),
                CampaignStepDef(
                    step_id="d14_ping",
                    delay_seconds=14 * 24 * 3600,
                    template_ref="vitalia/d14_followup.j2",
                ),
                CampaignStepDef(
                    step_id="d90_ping",
                    delay_seconds=90 * 24 * 3600,
                    template_ref="vitalia/d90_followup.j2",
                ),
            ),
            trigger_event="vitalia.treatment.started",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-12 — asset_template_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────

    registry.asset_template_register(
        AssetTemplateDef(
            template_id=_ns("medical_consent_pdf"),
            asset_type="pdf",
            placeholders={
                "patient_full_name": "str",
                "treatment_description": "str",
                "doctor_full_name": "str",
                "clinic_name": "str",
                "consent_date": "date",
                "patient_signature_url": "str",
            },
            source_path="vitalia/templates/medical_consent_v1.pdf",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-13 — sales_agent_guardrail_register (DataClass + Callables)
    # ───────────────────────────────────────────────────────────────────────
    # 4 guardrails per brand.yaml::guardrails + 03-arch-agentic § 10.
    # T-ag-tools-2 (Slice 1) — REAL callables replace Story 11 placeholders.
    # Canonical regex/keyword detection lives at vitalia/agentic/guardrails/;
    # compliance/guardrails/ shims expose SDK-compatible callables that wrap
    # the canonical detection. Async + classifier paths live in canonical
    # module and are invoked by sales_agent orchestrator pipeline, NOT
    # through EP-13 dispatch (different surface).

    _EP13_GUARDS: list[tuple[str, int, str, Any, Any]] = [
        (
            "medical_safety_no_diagnosis",
            10,
            "block",
            guardrail_check_no_diagnosis,
            guardrail_check_no_diagnosis,
        ),
        (
            "medical_safety_no_prescription",
            10,
            "block",
            guardrail_check_no_prescription,
            guardrail_check_no_prescription,
        ),
        (
            "medical_disclaimer_required",
            20,
            "rewrite",
            guardrail_check_disclaimer_required,
            guardrail_check_disclaimer_required,
        ),
        (
            "prompt_injection_block",
            5,
            "block",
            guardrail_check_prompt_injection,
            guardrail_check_prompt_injection,
        ),
    ]

    for guard_name, priority, mode_kind, pre_send, pre_receive in _EP13_GUARDS:
        registry.sales_agent_guardrail_register(
            GuardrailDef(
                name=_ns(guard_name),
                pre_send_check=pre_send,
                pre_receive_check=pre_receive,
                priority=priority,
                mode=mode_kind,  # type: ignore[arg-type]
            ),
        )

    # ───────────────────────────────────────────────────────────────────────
    # EP-14 — copilot_kb_pack_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────
    # 3 brand-scoped medical KB packs per brand.yaml::medical_kb_packs.
    # Real Qdrant ingestion lands in T-kb-1..3. tenant_scope='brand' means
    # cross-tenant share (medical reference content, not per-tenant secrets).

    for pack_id, label in [
        ("medical_kb_dental_v1", "Dental procedures + post-op care"),
        ("medical_kb_psychology_v1", "Psychology session boundaries + ethics"),
        ("medical_kb_psychiatry_v1", "Psychiatry safety + medication compliance disclaimers"),
    ]:
        registry.copilot_kb_pack_register(
            KbPackDef(
                pack_id=_ns(pack_id),
                documents_path=f"vitalia/data/kb/{pack_id}/",
                embedding_model_ref="text-embedding-3-large",
                qdrant_collection_name=f"vitalia_{pack_id}",
                tenant_scope="brand",  # cross-tenant medical reference content (D7 hipaa_lite OK)
                metadata={
                    "compliance_level": "hipaa_lite",  # D7
                    "label": label,
                },
            ),
        )

    # ───────────────────────────────────────────────────────────────────────
    # EP-15 — crm_lifecycle_stage_register (DataClass)
    # ───────────────────────────────────────────────────────────────────────

    registry.crm_lifecycle_stage_register(
        LifecycleStageDef(
            stage_id=_ns("pending_consent"),
            label="Pendiente consentimiento",
            after_stage="lead",
            before_stage="booking",
        ),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-16 — iam_signup_handler (Callable)
    # ───────────────────────────────────────────────────────────────────────

    def _vitalia_medical_clinic_signup(clerk_user: Any, ctx: BrandContext) -> SignupResult:
        # Medical clinic signup requires manual approval until clinic verification
        # automation lands. Placeholder returns pending_review.
        return SignupResult(
            status="pending_review",
            metadata={
                "reason": "medical_clinic_verification_required",
                "compliance_level": "hipaa_lite",
            },
        )

    registry.iam_signup_handler(
        _vitalia_medical_clinic_signup,
        name=_ns("medical_clinic_signup"),
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-17 — tenant_plan_tier_register (DataClass, mode='override' allowed)
    # ───────────────────────────────────────────────────────────────────────
    # 3 tiers per brand.yaml::plan_tiers. mode='override' per CC-2 — Vitalia
    # replaces core defaults with medical-vertical pricing.

    registry.tenant_plan_tier_register(
        PlanTierDef(
            tier_id=_ns("solo_doctor"),
            label="Solo Doctor",
            price_monthly=49.0,
            currency="USD",
            features=(
                "brand_studio_simplified",
                "offer_studio_medical",
                "booking_prepaid",
                "sales_agent_vertical_medical",
            ),
            limits={"max_doctors": 1},
        ),
        mode="override",
    )

    registry.tenant_plan_tier_register(
        PlanTierDef(
            tier_id=_ns("clinic"),
            label="Clinic",
            price_monthly=199.0,
            currency="USD",
            features=(
                "brand_studio_simplified",
                "offer_studio_medical",
                "booking_prepaid",
                "sales_agent_vertical_medical",
                "copilot_medical_extractors",
                "treatment_followup_workflow",
            ),
            limits={"max_doctors": 10},
        ),
        mode="override",
    )

    registry.tenant_plan_tier_register(
        PlanTierDef(
            tier_id=_ns("multi_site"),
            label="Multi-site",
            price_monthly=599.0,
            currency="USD",
            features=(
                "all_clinic_features",
                "multi_site_backend",
                "multi_currency",
            ),
            limits={"max_doctors": 50},
        ),
        mode="override",
    )

    # ───────────────────────────────────────────────────────────────────────
    # EP-18 — onboarding_wizard_steps_register (DataClass, mode='override' allowed)
    # ───────────────────────────────────────────────────────────────────────

    registry.onboarding_wizard_steps_register(
        WizardStepDef(
            step_id=_ns("medical_intake"),
            title="Datos de la clínica",
            component_ref="VitaliaMedicalIntakeStep",
        ),
        mode="override",
    )
