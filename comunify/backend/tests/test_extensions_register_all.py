"""TDD unit tests — Story 12 T-extensions-1: extensions.py register_all EP-1..EP-18.

Acceptance criteria (per 06-tickets.yaml Textensions1):
  A1 — register_all succeeds without exception
  A2 — Docs extension_points.md completeness arch fitness GREEN (V-NF-13 — separate
       test file in core/tests/architecture/test_docs_extension_points_completeness.py;
       verified externally via V-NF-13 cmd).

These tests verify the mounting scaffolding ONLY. Tool / extractor / workflow /
guardrail / channel adapter / voice_cloning handler implementations are placeholder
stubs that raise NotImplementedError when invoked (real impls deferred to
T-tools-*, T-extractors-*, T-workflows-*, T-guards-*, T-voice-*, T-kb-1).

Pattern reference:
  - vitalia/backend/tests/unit/test_extensions_register_all.py (Story 11 cement,
    APPROVED 2026-05-14)
  - apps/test-brand/python/test_brand/tests/ (Story 8 cement)

Adapted to comunify creator-economy + Story 12 specifics:
  - vertical_kind='creator-economy' (vs Vitalia 'medical')
  - 4 tools (qualify_for_cohort, link_to_community, nurture_via_authority_content,
    book_discovery_call)
  - 2 workflows (community_engagement, cohort_enrollment) vs Vitalia 1
  - 1 KB pack (creator_economy_kb_v1) vs Vitalia 3 medical packs
  - 4 guardrails (no_spam, no_nsfw, no_doxxing, prompt_injection_block)
  - 3 plan tiers (creator/pro/agency) at different prices vs Vitalia solo_doctor/clinic/multi_site
  - voice_cloning ON (D8 NEW Story 12) — voice_samples_uploader wizard step
"""

from __future__ import annotations

from uuid import uuid4

import pytest
from luana_core_extension_sdk import (
    BrandContext,
    ExtensionPointRegistry,
)
from luana_core_extension_sdk.exceptions import (
    NamespaceViolationError,
)

# ─── helpers ────────────────────────────────────────────────────────────────


def _make_fresh_registry() -> ExtensionPointRegistry:
    """Construct an empty registry (adapters=None — Story 8 smoke pattern)."""
    return ExtensionPointRegistry(
        sales_agent_tool_registry_adapter=None,
        copilot_workflow_registry_adapter=None,
    )


def _make_comunify_ctx() -> BrandContext:
    """Construct a Comunify BrandContext for dispatch tests.

    9 frozen fields per Story 9 checkpoint §7.5.2 D3.
    vertical_kind='creator-economy' (Comunify vertical — distinct from Vitalia 'medical').
    pii_policy='creator' (creator-economy lighter compliance than 'medical').
    """
    return BrandContext(
        tenant_id=uuid4(),
        brand_slug="comunify",
        plan_tier="comunify.creator",
        locale="es-AR",
        feature_flags={
            "voice_cloning_pipeline": True,  # D8 ON
            "community_engagement_workflow": True,
            "cohort_enrollment_workflow": True,
            "recurring_subscriptions": True,
        },
        tenant_profile_id=uuid4(),
        vertical_kind="creator-economy",
        compliance_flags={
            "creator_economy": True,  # D7 — vs Vitalia hipaa_lite
        },
        pii_policy="creator",
    )


# ─── A1: register_all happy path ────────────────────────────────────────────


def test_register_all_succeeds() -> None:
    """A1 — register_all completes without exception on a fresh registry."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    # No exception = pass. Smoke verification.


def test_register_all_populates_all_18_eps() -> None:
    """A1 — every EP-1..EP-18 has at least one registration after register_all.

    Comunify mounts the full SDK surface (signature parity with Vitalia + test-brand).
    """
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    for ep_num in range(1, 19):
        ep_id = f"EP-{ep_num}"
        records = registry.get_all(ep_id)
        assert len(records) >= 1, f"{ep_id} has no registrations after register_all"


def test_register_all_idempotent_on_fresh_registry() -> None:
    """A1 — calling register_all twice on different registries yields same per-EP count."""
    from src.modules.comunify.extensions import register_all

    r1 = _make_fresh_registry()
    r2 = _make_fresh_registry()
    register_all(r1)
    register_all(r2)

    for ep_num in range(1, 19):
        ep_id = f"EP-{ep_num}"
        assert len(r1.get_all(ep_id)) == len(r2.get_all(ep_id)), (
            f"{ep_id} registration count diverges between two fresh registries"
        )


# ─── CC-4 namespace enforcement (all names prefixed `comunify.`) ────────────


def test_all_registrations_use_comunify_namespace() -> None:
    """Every registration name MUST start with 'comunify.' prefix (CC-4 namespace)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    for ep_num in range(1, 19):
        ep_id = f"EP-{ep_num}"
        records = registry.get_all(ep_id)
        for rec in records:
            assert rec.name.startswith("comunify."), (
                f"{ep_id} registration {rec.name!r} violates CC-4 — name MUST be namespaced 'comunify.{{x}}'"
            )
            assert rec.brand_slug == "comunify", (
                f"{ep_id} registration {rec.name!r} has brand_slug={rec.brand_slug!r}, expected 'comunify'"
            )


# ─── Per-EP counts cement (per architecture brand.yaml + 03-arch.md § 4.1) ──


def test_ep1_field_override_count_one() -> None:
    """EP-1: exactly 1 field_override callback (creator_economy_field_overrides) handles
    buyer_persona.min_count=3 per D11."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-1")
    assert len(records) == 1, f"Expected 1 EP-1 field_override, got {len(records)}"
    assert records[0].name == "comunify.creator_economy_field_overrides"


def test_ep2_offer_preset_pack_count_one() -> None:
    """EP-2: exactly 1 PresetPack (coaching_offers_v1) per brand.yaml offer_studio.preset_pack."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-2")
    assert len(records) == 1, f"Expected 1 EP-2 PresetPack, got {len(records)}"
    assert records[0].name == "comunify.coaching_offers_v1"


def test_ep3_sales_agent_tools_count_four() -> None:
    """EP-3: exactly 4 creator-economy tools per brand.yaml agentic_tools."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-3")
    assert len(records) == 4, f"Expected 4 EP-3 ToolDef, got {len(records)}"

    names = {r.name for r in records}
    expected = {
        "comunify.qualify_for_cohort",
        "comunify.link_to_community",
        "comunify.nurture_via_authority_content",
        "comunify.book_discovery_call",
    }
    assert names == expected, f"EP-3 tool names mismatch: {names} != {expected}"


def test_ep4_copilot_workflows_count_two() -> None:
    """EP-4: exactly 2 workflows (community_engagement + cohort_enrollment)
    per brand.yaml workflows — distinct from Vitalia's 1 workflow."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-4")
    assert len(records) == 2, f"Expected 2 EP-4 WorkflowDef, got {len(records)}"

    names = {r.name for r in records}
    expected = {
        "comunify.community_engagement_workflow",
        "comunify.cohort_enrollment_workflow",
    }
    assert names == expected, f"EP-4 workflow names mismatch: {names} != {expected}"


def test_ep5_booking_policy_cohort_capacity() -> None:
    """EP-5: cohort_capacity_check policy registered (per spec § 5 + cohort enrollment race)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-5")
    assert len(records) >= 1, "EP-5 must have ≥1 BookingPolicy"
    names = {r.name for r in records}
    assert "comunify.cohort_capacity_check" in names


def test_ep6_sidebar_routes_creator_admin_top_level() -> None:
    """EP-6: top-level sidebar routes (cohorts + community + subscriptions) registered."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-6")
    slugs = {r.name for r in records}
    expected = {
        "comunify.cohorts",
        "comunify.community",
        "comunify.subscriptions",
    }
    assert expected.issubset(slugs), (
        f"EP-6 sidebar slugs missing expected entries — got {slugs}, expected superset of {expected}"
    )


def test_ep7_extractors_count_two() -> None:
    """EP-7: exactly 2 extractors (OfferLadderAdvisor + AuthorityVaultExtractor).

    Note: VoiceDistillationOrchestrator is NOT an EP-7 extractor — it's a brand
    voice pipeline registered separately (see voice_cloning_pipeline feature
    flag in brand.yaml). EP-7 here is offer/brand domain extractors only.
    """
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-7")
    assert len(records) == 2, f"Expected 2 EP-7 ExtractorDef, got {len(records)}"

    names = {r.name for r in records}
    expected = {
        "comunify.offer_ladder_advisor",
        "comunify.authority_vault_extractor",
    }
    assert names == expected, f"EP-7 extractor names mismatch: {names} != {expected}"


def test_ep8_channel_adapters_count_three() -> None:
    """EP-8: exactly 3 payment-channel adapters per brand.yaml payment_gateways."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-8")
    assert len(records) == 3, f"Expected 3 EP-8 ChannelAdapterDef, got {len(records)}"

    names = {r.name for r in records}
    expected = {
        "comunify.mercadopago",
        "comunify.stripe_connect",
        "comunify.tokenized_recurring",
    }
    assert names == expected, f"EP-8 channel adapter names mismatch: {names} != {expected}"


def test_ep9_metric_count_at_least_one() -> None:
    """EP-9: ≥1 metric registered (cohort_engagement_score creator-economy specific)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-9")
    assert len(records) >= 1
    names = {r.name for r in records}
    assert "comunify.cohort_engagement_score" in names


def test_ep10_landing_template_creator_specific() -> None:
    """EP-10: creator_landing_hero template registered (public landing per creator_handle)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-10")
    assert len(records) >= 1
    names = {r.name for r in records}
    assert "comunify.creator_landing_hero" in names


def test_ep11_campaign_template_payment_followup() -> None:
    """EP-11: cohort_enrollment_payment_followup drip template (24h + 48h)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-11")
    assert len(records) >= 1
    names = {r.name for r in records}
    assert "comunify.cohort_enrollment_payment_followup" in names


def test_ep12_asset_template_cohort_welcome_pdf() -> None:
    """EP-12: cohort_welcome_packet_pdf asset template (post-enrollment delivery)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-12")
    assert len(records) >= 1
    names = {r.name for r in records}
    assert "comunify.cohort_welcome_packet_pdf" in names


def test_ep13_guardrails_count_four() -> None:
    """EP-13: exactly 4 creator-economy guardrails per brand.yaml guardrails."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-13")
    assert len(records) == 4, f"Expected 4 EP-13 GuardrailDef, got {len(records)}"

    names = {r.name for r in records}
    expected = {
        "comunify.community_safety_no_spam",
        "comunify.community_safety_no_nsfw",
        "comunify.community_safety_no_doxxing",
        "comunify.prompt_injection_block",
    }
    assert names == expected, f"EP-13 guardrail names mismatch: {names} != {expected}"


def test_ep13_guardrails_all_block_mode() -> None:
    """EP-13: all 4 creator-economy guardrails mode='block' per 03-arch-agentic § 10
    (community safety + adversarial bar pass^5 ≥0.95)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-13")
    for rec in records:
        guard = rec.payload
        assert guard.mode == "block", (
            f"EP-13 guard {guard.name!r} mode={guard.mode!r} — Comunify community-safety "
            f"guardrails enforce mode='block' per D7 (creator-economy compliance) + "
            f"03-arch-agentic § 10.1 pipeline order"
        )


def test_ep14_kb_packs_count_one() -> None:
    """EP-14: exactly 1 KB pack (creator_economy_kb_v1) per brand.yaml kb_packs.

    Distinct from Vitalia's 3 medical packs — Comunify ships one consolidated
    creator-economy KB with ~250 chunks (frameworks + terminology + cohort design
    + community engagement playbooks + voice cloning tips per 03-arch-agentic § 7.3).
    """
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-14")
    assert len(records) == 1, f"Expected 1 EP-14 KbPackDef, got {len(records)}"

    pack = records[0].payload
    assert records[0].name == "comunify.creator_economy_kb_v1"
    assert pack.qdrant_collection_name == "comunify_creator_economy_kb_v1", (
        f"D17 — Qdrant collection name MUST be 'comunify_creator_economy_kb_v1' "
        f"(per-brand prefix consistency with Vitalia 'vitalia_*'), got {pack.qdrant_collection_name!r}"
    )


def test_ep14_kb_pack_tenant_scope_brand() -> None:
    """EP-14: creator-economy KB pack tenant_scope='brand' (cross-tenant reference content)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-14")
    for rec in records:
        pack = rec.payload
        assert pack.tenant_scope in ("brand", "both"), (
            f"EP-14 pack {pack.pack_id!r} tenant_scope={pack.tenant_scope!r} — "
            f"creator-economy reference content MUST be brand-scoped (cross-tenant share)"
        )


def test_ep14_kb_pack_metadata_compliance_level_creator_economy() -> None:
    """EP-14: KB pack metadata compliance_level='creator_economy' per D7 (NOT hipaa_lite)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-14")
    for rec in records:
        pack = rec.payload
        assert pack.metadata.get("compliance_level") == "creator_economy", (
            f"EP-14 pack {pack.pack_id!r} compliance_level metadata="
            f"{pack.metadata.get('compliance_level')!r} — Comunify D7 dictates "
            f"creator_economy (NOT hipaa_lite vs Vitalia D7)"
        )


def test_ep15_lifecycle_stage_payment_pending() -> None:
    """EP-15: payment_pending_enrollment lifecycle stage registered (CRM segment)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-15")
    assert len(records) >= 1
    names = {r.name for r in records}
    assert "comunify.payment_pending_enrollment" in names


def test_ep16_signup_handler_creator_active() -> None:
    """EP-16: creator_signup handler auto-approves (status='approved' — lighter than Vitalia
    medical clinic 'pending_review').

    Note: registry.dispatch_signup() is signature-only in SDK v0.1.0 — invoking it
    raises NotImplementedError per Story 9 cement. We invoke the registered handler
    callable directly (it's the payload of the EP-16 _Registration) to verify the
    SignupResult shape Comunify ships.
    """
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-16")
    assert len(records) >= 1
    names = {r.name for r in records}
    assert "comunify.creator_signup" in names

    ctx = _make_comunify_ctx()
    handler = records[0].payload  # Callable[[Any, BrandContext], SignupResult]
    result = handler(object(), ctx)
    # SignupResult.status literal is ('approved' | 'pending_review' | 'rejected')
    # per Story 9 SDK cement. Comunify creator-economy auto-approves vs Vitalia
    # medical clinic 'pending_review' — D7 lighter compliance.
    assert result.status == "approved", (
        f"Comunify creator signup MUST auto-approve (status='approved') per D7 creator-economy "
        f"vs Vitalia medical clinic 'pending_review' — got status={result.status!r}"
    )
    assert result.metadata.get("compliance_level") == "creator_economy"
    assert result.metadata.get("voice_cloning_pipeline_required") is True


def test_ep17_plan_tiers_count_three() -> None:
    """EP-17: exactly 3 plan tiers (creator + pro + agency) per brand.yaml subscriptions."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-17")
    assert len(records) == 3, f"Expected 3 EP-17 PlanTierDef, got {len(records)}"

    tier_ids = {r.name for r in records}
    expected = {
        "comunify.creator",
        "comunify.pro",
        "comunify.agency",
    }
    assert tier_ids == expected, f"EP-17 plan tier ids mismatch: {tier_ids} != {expected}"


def test_ep17_plan_tiers_prices_match_brand_yaml() -> None:
    """EP-17: plan tier prices ($29 / $99 / $299 USD/mo) match brand.yaml subscriptions."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-17")
    by_id = {r.payload.tier_id: r.payload for r in records}

    assert by_id["comunify.creator"].price_monthly == 29.0
    assert by_id["comunify.creator"].currency == "USD"
    assert by_id["comunify.pro"].price_monthly == 99.0
    assert by_id["comunify.agency"].price_monthly == 299.0


def test_ep17_plan_tiers_pro_includes_voice_cloning_feature() -> None:
    """EP-17: pro+ tiers expose voice_cloning_pipeline feature flag (D8 NEW Story 12)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-17")
    by_id = {r.payload.tier_id: r.payload for r in records}

    assert "voice_cloning_pipeline" in by_id["comunify.pro"].features, (
        "D8 — voice_cloning_pipeline MUST be exposed at pro tier (creator tier excluded "
        "per brand.yaml subscriptions.plan_tiers.creator.features)"
    )


def test_ep17_plan_tiers_registered_with_override_mode() -> None:
    """EP-17 plan tiers MUST be registered with mode='override' per CC-2 (comunify replaces
    core tier defaults)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-17")
    for rec in records:
        assert rec.mode == "override", (
            f"EP-17 tier {rec.name!r} mode={rec.mode!r} — Comunify overrides core tier defaults "
            f"per CC-2 (creator-economy pricing distinct from core marketing pricing)"
        )


def test_ep18_wizard_steps_includes_voice_samples_uploader() -> None:
    """EP-18: voice_samples_uploader step registered (D8 NEW Story 12 — Vitalia OFF).

    Distinguishes Comunify onboarding from Vitalia (medical_intake step). Voice
    cloning pipeline is the headline Story 12 differentiator.
    """
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-18")
    step_ids = {r.name for r in records}

    assert "comunify.voice_samples_uploader" in step_ids, (
        f"D8 — voice_samples_uploader step MUST be registered per Story 12 NEW pipeline "
        f"(Vitalia OFF). Got step_ids={step_ids}"
    )
    assert "comunify.creator_niche_picker" in step_ids


def test_ep18_wizard_steps_registered_with_override_mode() -> None:
    """EP-18: comunify wizard steps registered with mode='override' per CC-2."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-18")
    for rec in records:
        assert rec.mode == "override", (
            f"EP-18 step {rec.name!r} mode={rec.mode!r} — Comunify overrides core wizard defaults"
        )


# ─── EP-3 ToolDef shape verification (placeholder handlers + tool_groups) ───


def test_ep3_tools_have_placeholder_handlers() -> None:
    """EP-3 tools: handlers MUST be callables (placeholder stubs OK until T-tools-*)."""
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-3")
    for rec in records:
        tool_def = rec.payload
        assert callable(tool_def.handler), f"EP-3 tool {tool_def.name!r} handler must be callable"
        assert tool_def.description, f"EP-3 tool {tool_def.name!r} must have non-empty description"


def test_ep3_placeholder_tool_handler_raises_not_implemented() -> None:
    """EP-3 tool handlers raise NotImplementedError pointing to the real-impl ticket.

    Per .claude/skills/tessl__graceful-degradation rule 2: placeholders are explicit,
    NOT silent — invoking them surfaces the missing implementation clearly.
    """
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-3")
    for rec in records:
        tool_def = rec.payload
        with pytest.raises(NotImplementedError) as exc_info:
            tool_def.handler()  # placeholder always raises
        msg = str(exc_info.value)
        assert "placeholder" in msg.lower(), (
            f"EP-3 tool {tool_def.name!r} NotImplementedError must mention 'placeholder': got {msg!r}"
        )
        # Real-impl ticket pointer required for traceability
        assert "T-tools-" in msg, f"EP-3 tool {tool_def.name!r} placeholder must cite T-tools-* ticket: got {msg!r}"


# ─── EP-1 field_override dispatch happy path ────────────────────────────────


def test_ep1_field_override_dispatchable_returns_none_or_override() -> None:
    """EP-1: resolve_field_override must NOT raise on Comunify ctx (returns None or FieldOverride)."""
    from luana_core_extension_sdk.models import FieldDef

    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    ctx = _make_comunify_ctx()

    # Unknown field returns None (no override)
    unknown_field = FieldDef(name="unknown_field_for_smoke", type_name="str")
    result = registry.resolve_field_override(unknown_field, ctx)
    assert result is None or hasattr(result, "name")

    # buyer_persona.min_count field gets override per D11 multi-persona mandatory.
    # FieldOverride contract per Story 9 SDK cement: (name, default_value, label,
    # hint, required) — min_count semantic ships via default_value=3.
    min_count_field = FieldDef(name="min_count", type_name="int", section="buyer_persona")
    override = registry.resolve_field_override(min_count_field, ctx)
    assert override is not None, "D11 — buyer_persona.min_count MUST receive override"
    assert override.default_value == 3, (
        f"D11 — multi-persona mandatory MUST set default_value=3 on min_count, "
        f"got default_value={override.default_value!r}"
    )
    assert override.required is True, "D11 — buyer_persona.min_count MUST be required=True (multi-persona mandatory)"


# ─── EP-16 signup dispatch verifies SignupResult metadata cement ────────────


def test_ep16_signup_dispatch_metadata_carries_voice_cloning_flag() -> None:
    """EP-16: signup metadata includes voice_cloning_pipeline_required=True per D8.

    Invokes the EP-16 registered handler payload directly (dispatch_signup is
    signature-only in SDK v0.1.0).
    """
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    register_all(registry)

    records = registry.get_all("EP-16")
    handler = records[0].payload  # Callable[[Any, BrandContext], SignupResult]
    ctx = _make_comunify_ctx()
    result = handler(object(), ctx)
    assert result.metadata.get("voice_cloning_pipeline_required") is True, (
        "D8 — Comunify signup MUST signal voice_cloning_pipeline_required=True to "
        "trigger samples_uploader wizard step (EP-18). Got metadata=" + repr(result.metadata)
    )


# ─── Negative test: bare name without `comunify.` prefix is forbidden ──────


def test_extensions_module_does_not_register_bare_names() -> None:
    """Defense-in-depth: re-running register_all on a registry that rejects bare names succeeds.

    If any registration in extensions.py omitted the `comunify.` prefix, the SDK
    would raise NamespaceViolationError mid-call. This test catches such regressions.
    """
    from src.modules.comunify.extensions import register_all

    registry = _make_fresh_registry()
    try:
        register_all(registry)
    except NamespaceViolationError as exc:
        pytest.fail(f"register_all introduced a bare-name registration: {exc}")
