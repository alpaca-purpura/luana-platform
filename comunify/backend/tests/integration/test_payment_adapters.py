"""Integration tests for comunify payment adapters — Story 12 T-payment-1.

Tests:
- test_comunify_overlay_application_fee_per_tier
  → creator ($29) → 5% / pro ($99) → 7% / agency ($299) → 10%
- test_country_routing_argentina_uses_mercadopago
  → subscriber_country=AR → MP preference created
- test_tokenized_recurring_3month_installment_creates_3_charges
  → 3 installments scheduled + idempotency key namespaced comunify:recurring

External HTTP mocking: httpx.MockTransport (pattern from
core/luana-core-channels/tests/payment/test_mercadopago_adapter.py).

Markers: @pytest.mark.integration (skipped when DB unavailable — HS1).
These tests do NOT require live DB, but follow integration marker convention
to allow selective skip in CI without Postgres (per pyproject.toml markers).

Per Story 12 T-payment-1 validators V-NF-1 (lint) + V-F-2 (unit tests).
"""

from __future__ import annotations

import hashlib
import hmac as hmac_mod
import json
import time
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

import httpx
import pytest

from src.modules.comunify.payment.mercadopago_adapter import (
    BackUrls,
    ComunifyMercadoPagoAdapter,
    MpPreferenceResponse,
    PayerInfo,
    PaymentStatusEnum,
    PreferenceItem,
)
from src.modules.comunify.payment.stripe_connect_adapter import (
    APPLICATION_FEE_RATES,
    ComunifyStripeConnectAdapter,
)
from src.modules.comunify.payment.tokenized_recurring_adapter import (
    COHORT_INSTALLMENT_OPTIONS,
    PLAN_KIND_COHORT_INSTALLMENTS,
    PLAN_KIND_MONTHLY_MEMBERSHIP,
    ComunifyTokenizedRecurringAdapter,
    Installment,
    RecurringPaymentSchedule,
)

if TYPE_CHECKING:
    from collections.abc import Callable

# ── HTTP mock helpers ─────────────────────────────────────────────────────────


def _make_stripe_handler(
    *,
    payment_intent_id: str = "pi_test_abc123",
    status: str = "requires_payment_method",
    client_secret: str = "pi_test_abc123_secret",
    status_code: int = 200,
    capture_requests: list[httpx.Request] | None = None,
) -> Callable[[httpx.Request], httpx.Response]:
    """Create MockTransport handler for Stripe v1/payment_intents."""

    def handler(request: httpx.Request) -> httpx.Response:
        if capture_requests is not None:
            capture_requests.append(request)
        if status_code != 200:
            return httpx.Response(status_code, json={"error": {"message": "Test error"}})
        return httpx.Response(
            200,
            json={
                "id": payment_intent_id,
                "client_secret": client_secret,
                "status": status,
                "amount": 1000,
                "currency": "usd",
            },
        )

    return handler


def _make_mp_preference_handler(
    *,
    preference_id: str = "pref_test_abc123",
    init_point: str = "https://www.mercadopago.com/checkout/test",
    status_code: int = 201,
    capture_requests: list[httpx.Request] | None = None,
) -> Callable[[httpx.Request], httpx.Response]:
    """Create MockTransport handler for MP /checkout/preferences."""

    def handler(request: httpx.Request) -> httpx.Response:
        if capture_requests is not None:
            capture_requests.append(request)
        if status_code != 201:
            return httpx.Response(status_code, json={"message": "Test error"})
        return httpx.Response(
            status_code,
            json={
                "id": preference_id,
                "init_point": init_point,
                "sandbox_init_point": "https://sandbox.mercadopago.com/checkout/test",
            },
        )

    return handler


# ── APPLICATION FEE PER TIER TESTS ───────────────────────────────────────────


class TestComunifyOverlayApplicationFeePerTier:
    """Verify application_fee computed correctly per plan_tier from brand.yaml rates."""

    @pytest.mark.parametrize(
        "plan_tier,amount_usd,expected_rate",
        [
            ("creator", Decimal("29.00"), 0.05),  # 5%
            ("pro", Decimal("99.00"), 0.07),  # 7%
            ("agency", Decimal("299.00"), 0.10),  # 10%
        ],
    )
    async def test_application_fee_rate_per_plan_tier(
        self,
        plan_tier: str,
        amount_usd: Decimal,
        expected_rate: float,
    ) -> None:
        """application_fee_amount = floor(amount_cents * rate) per plan_tier."""
        adapter = ComunifyStripeConnectAdapter(
            secret_key="sk_test_dummy",
            plan_tier=plan_tier,
        )
        amount_cents = int(amount_usd * 100)
        fee_cents = adapter._application_fee_amount(amount_cents=amount_cents)
        expected_fee_cents = int(amount_cents * expected_rate)
        assert fee_cents == expected_fee_cents, (
            f"plan_tier={plan_tier}: expected fee {expected_fee_cents}, got {fee_cents}"
        )

    def test_application_fee_rates_catalog_matches_brand_yaml(self) -> None:
        """APPLICATION_FEE_RATES matches brand.yaml plan_tiers section."""
        # brand.yaml: creator=5%, pro=7%, agency=10%
        assert APPLICATION_FEE_RATES["creator"] == 0.05
        assert APPLICATION_FEE_RATES["pro"] == 0.07
        assert APPLICATION_FEE_RATES["agency"] == 0.10

    async def test_creator_tier_fee_injected_in_stripe_payload(self) -> None:
        """creator tier: fee sent as application_fee_amount in Stripe API call."""
        captured: list[httpx.Request] = []
        adapter = ComunifyStripeConnectAdapter(
            secret_key="sk_test_dummy",
            plan_tier="creator",
        )

        async with httpx.AsyncClient(
            transport=httpx.MockTransport(_make_stripe_handler(capture_requests=captured))
        ) as mock_client:
            result = await adapter.create_payment_intent(
                amount=Decimal("29.00"),
                currency="USD",
                booking_id=uuid4(),
                deposit_or_full="full",
                description="Creator tier monthly",
                client=mock_client,
            )

        assert len(captured) == 1
        # 5% of 2900 cents = 145 cents
        assert result.application_fee_cents == 145
        # Verify fee sent in payload
        request_body = captured[0].content.decode()
        assert "application_fee_amount=145" in request_body

    async def test_pro_tier_fee_injected_in_stripe_payload(self) -> None:
        """pro tier: 7% fee = 693 cents on $99.00."""
        captured: list[httpx.Request] = []
        adapter = ComunifyStripeConnectAdapter(
            secret_key="sk_test_dummy",
            plan_tier="pro",
        )

        async with httpx.AsyncClient(
            transport=httpx.MockTransport(_make_stripe_handler(capture_requests=captured))
        ) as mock_client:
            await adapter.create_payment_intent(
                amount=Decimal("99.00"),
                currency="USD",
                booking_id=uuid4(),
                deposit_or_full="full",
                description="Pro tier monthly",
                client=mock_client,
            )

        request_body = captured[0].content.decode()
        # 7% of 9900 = 693
        assert "application_fee_amount=693" in request_body

    async def test_agency_tier_fee_injected_in_stripe_payload(self) -> None:
        """agency tier: 10% fee = 2990 cents on $299.00."""
        captured: list[httpx.Request] = []
        adapter = ComunifyStripeConnectAdapter(
            secret_key="sk_test_dummy",
            plan_tier="agency",
        )

        async with httpx.AsyncClient(
            transport=httpx.MockTransport(_make_stripe_handler(capture_requests=captured))
        ) as mock_client:
            await adapter.create_payment_intent(
                amount=Decimal("299.00"),
                currency="USD",
                booking_id=uuid4(),
                deposit_or_full="full",
                description="Agency tier monthly",
                client=mock_client,
            )

        request_body = captured[0].content.decode()
        # 10% of 29900 = 2990
        assert "application_fee_amount=2990" in request_body

    async def test_creator_economy_compliance_metadata_present(self) -> None:
        """compliance_level=creator_economy injected in all Stripe payment intents."""
        captured: list[httpx.Request] = []
        adapter = ComunifyStripeConnectAdapter(
            secret_key="sk_test_dummy",
            plan_tier="creator",
        )

        async with httpx.AsyncClient(
            transport=httpx.MockTransport(_make_stripe_handler(capture_requests=captured))
        ) as mock_client:
            await adapter.create_payment_intent(
                amount=Decimal("29.00"),
                currency="USD",
                booking_id=uuid4(),
                deposit_or_full="full",
                description="Creator tier",
                client=mock_client,
            )

        request_body = captured[0].content.decode()
        assert "metadata%5Bcompliance_level%5D=creator_economy" in request_body
        assert "metadata%5Bbrand_slug%5D=comunify" in request_body


# ── COUNTRY ROUTING TESTS ─────────────────────────────────────────────────────


class TestCountryRoutingArgentinaUsesMercadoPago:
    """Verify MP adapter handles AR-primary country routing."""

    async def test_ar_subscriber_creates_mp_preference(self) -> None:
        """AR subscriber → MercadoPago preference created with ARS currency."""
        captured: list[httpx.Request] = []
        adapter = ComunifyMercadoPagoAdapter(
            access_token="TEST_MP_TOKEN",
        )
        tenant_id = uuid4()
        booking_id = uuid4()

        async with httpx.AsyncClient(
            transport=httpx.MockTransport(
                _make_mp_preference_handler(capture_requests=captured)
            )
        ) as mock_client:
            result = await adapter.create_preference(
                tenant_id=tenant_id,
                booking_id=booking_id,
                items=[
                    PreferenceItem(
                        title="Membresía mensual creator",
                        quantity=1,
                        unit_price_cents=2900,
                        currency_id="ARS",
                    )
                ],
                payer=PayerInfo(email="creator@ar.example.com"),
                back_urls=BackUrls(
                    success="https://app.comunify.io/success",
                    failure="https://app.comunify.io/failure",
                    pending="https://app.comunify.io/pending",
                ),
                deposit_or_full="full",
                subscriber_country="AR",
                client=mock_client,
            )

        assert isinstance(result, MpPreferenceResponse)
        assert result.preference_id == "pref_test_abc123"
        assert result.init_point.startswith("https://")

        # Verify idempotency key = booking_id
        assert len(captured) == 1
        request_headers = captured[0].headers
        assert request_headers.get("x-idempotency-key") == str(booking_id)

    async def test_mp_preference_includes_creator_economy_metadata(self) -> None:
        """MP preference metadata includes compliance_level=creator_economy + brand_slug=comunify."""
        captured: list[httpx.Request] = []
        adapter = ComunifyMercadoPagoAdapter(access_token="TEST_MP_TOKEN")
        tenant_id = uuid4()
        booking_id = uuid4()

        async with httpx.AsyncClient(
            transport=httpx.MockTransport(
                _make_mp_preference_handler(capture_requests=captured)
            )
        ) as mock_client:
            result = await adapter.create_preference(
                tenant_id=tenant_id,
                booking_id=booking_id,
                items=[
                    PreferenceItem(title="Plan pro", quantity=1, unit_price_cents=9900, currency_id="ARS")
                ],
                payer=PayerInfo(),
                back_urls=BackUrls(
                    success="https://app.comunify.io/success",
                    failure="https://app.comunify.io/failure",
                    pending="https://app.comunify.io/pending",
                ),
                subscriber_country="AR",
                client=mock_client,
            )

        assert result.metadata is not None
        assert result.metadata["compliance_level"] == "creator_economy"
        assert result.metadata["brand_slug"] == "comunify"
        assert result.metadata["subscriber_country"] == "AR"
        assert result.metadata["tenant_id"] == str(tenant_id)
        assert result.metadata["booking_id"] == str(booking_id)

    def test_mp_status_mapping_canonical(self) -> None:
        """MP status strings map to canonical PaymentStatusEnum values."""
        adapter = ComunifyMercadoPagoAdapter(access_token="TEST")
        assert adapter._map_mp_status("approved") == PaymentStatusEnum.PAID
        assert adapter._map_mp_status("pending") == PaymentStatusEnum.PENDING
        assert adapter._map_mp_status("in_process") == PaymentStatusEnum.PENDING
        assert adapter._map_mp_status("rejected") == PaymentStatusEnum.FAILED
        assert adapter._map_mp_status("cancelled") == PaymentStatusEnum.CANCELLED
        assert adapter._map_mp_status("refunded") == PaymentStatusEnum.REFUNDED
        # Unknown status → PENDING (safe default)
        assert adapter._map_mp_status("unknown_future_status") == PaymentStatusEnum.PENDING

    def test_mp_webhook_signature_valid(self) -> None:
        """HMAC-SHA256 webhook signature verified correctly."""
        webhook_secret = "test_webhook_secret_abc123"
        adapter = ComunifyMercadoPagoAdapter(
            access_token="TEST",
            webhook_secret=webhook_secret,
        )
        payload_body = b'{"id": "12345", "type": "payment"}'
        ts = "1700000000"
        manifest = f"ts:{ts};".encode("utf-8") + payload_body
        computed_sig = hmac_mod.new(
            webhook_secret.encode("utf-8"),
            manifest,
            hashlib.sha256,
        ).hexdigest()
        signature_header = f"ts={ts},v1={computed_sig}"

        assert adapter.verify_webhook_signature(
            payload_body=payload_body,
            signature_header=signature_header,
        )

    def test_mp_webhook_signature_invalid_returns_false(self) -> None:
        """Tampered webhook body → verify_webhook_signature returns False."""
        adapter = ComunifyMercadoPagoAdapter(
            access_token="TEST",
            webhook_secret="correct_secret",
        )
        result = adapter.verify_webhook_signature(
            payload_body=b'{"id": "tampered"}',
            signature_header="ts=1700000000,v1=wrongsignature",
        )
        assert result is False

    def test_mp_webhook_no_secret_returns_false(self) -> None:
        """Missing webhook_secret → verify_webhook_signature returns False."""
        adapter = ComunifyMercadoPagoAdapter(access_token="TEST", webhook_secret="")
        result = adapter.verify_webhook_signature(
            payload_body=b'{"id": "1"}',
            signature_header="ts=123,v1=abc",
        )
        assert result is False


# ── TOKENIZED RECURRING 3-MONTH INSTALLMENT TESTS ────────────────────────────


class TestTokenizedRecurring3MonthInstallment:
    """Verify 3-month cohort installments schedule creates 3 charges with
    comunify:recurring idempotency keys."""

    def _make_mock_charge_fn(
        self,
        captured_calls: list[dict],
    ) -> "Callable[..., object]":
        """Create injectable charge function that records calls."""

        async def _mock_charge(
            *,
            idempotency_key: str,
            amount: Decimal,
            currency: str,
            installment_n: int,
            **_kwargs: object,
        ) -> dict:
            captured_calls.append(
                {
                    "idempotency_key": idempotency_key,
                    "amount": str(amount),
                    "currency": currency,
                    "installment_n": installment_n,
                }
            )
            return {
                "payment_intent_id": f"pi_mock_{installment_n}",
                "status": "scheduled",
            }

        return _mock_charge

    def _make_mock_cron_fn(
        self,
        captured_registrations: list[dict],
    ) -> "Callable[..., object]":
        """Create injectable cron registration function that records calls."""

        async def _mock_cron(**kwargs: object) -> None:
            captured_registrations.append(dict(kwargs))

        return _mock_cron

    async def test_3month_installment_creates_3_charges(self) -> None:
        """schedule_recurring with 3 installments creates exactly 3 charge records."""
        from datetime import datetime, timezone

        charge_calls: list[dict] = []
        cron_registrations: list[dict] = []

        adapter = ComunifyTokenizedRecurringAdapter(
            gateway="stripe_connect",
            stripe_secret_key="sk_test_dummy",
            plan_kind=PLAN_KIND_COHORT_INSTALLMENTS,
            _charge_fn=self._make_mock_charge_fn(charge_calls),
            _cron_register_fn=self._make_mock_cron_fn(cron_registrations),
        )

        subscriber_id = uuid4()
        entity_id = uuid4()
        base_amount = Decimal("99.00")
        currency = "ARS"

        installments = [
            Installment(
                installment_n=i,
                amount=base_amount,
                currency=currency,
                scheduled_at=datetime(2026, 5 + i, 1, tzinfo=timezone.utc),
                description=f"Cuota {i} de 3",
            )
            for i in range(1, 4)
        ]

        schedule = await adapter.schedule_recurring(
            subscriber_id=subscriber_id,
            entity_id=entity_id,
            installments=installments,
        )

        # 3 charges created
        assert schedule.total_installments == 3
        assert len(schedule.results) == 3
        assert len(charge_calls) == 3
        assert len(cron_registrations) == 3

        # Plan kind preserved
        assert schedule.plan_kind == PLAN_KIND_COHORT_INSTALLMENTS

        # Currency forwarded, never hardcoded
        assert schedule.currency == "ARS"
        for result in schedule.results:
            assert result.currency == "ARS"

    async def test_3month_idempotency_keys_namespaced_comunify(self) -> None:
        """All idempotency keys start with comunify:recurring: prefix."""
        from datetime import datetime, timezone

        charge_calls: list[dict] = []

        adapter = ComunifyTokenizedRecurringAdapter(
            gateway="stripe_connect",
            plan_kind=PLAN_KIND_COHORT_INSTALLMENTS,
            _charge_fn=self._make_mock_charge_fn(charge_calls),
            _cron_register_fn=self._make_mock_cron_fn([]),
        )

        subscriber_id = uuid4()
        entity_id = uuid4()

        installments = [
            Installment(
                installment_n=i,
                amount=Decimal("99.00"),
                currency="ARS",
                scheduled_at=datetime(2026, i, 1, tzinfo=timezone.utc),
            )
            for i in range(1, 4)
        ]

        await adapter.schedule_recurring(
            subscriber_id=subscriber_id,
            entity_id=entity_id,
            installments=installments,
        )

        for call in charge_calls:
            assert call["idempotency_key"].startswith("comunify:recurring:"), (
                f"Expected comunify:recurring: prefix, got: {call['idempotency_key']}"
            )
            assert str(subscriber_id) in call["idempotency_key"]
            assert str(entity_id) in call["idempotency_key"]

    async def test_idempotency_no_double_charge_on_retry(self) -> None:
        """Retrying charge_installment with same triple returns cached result."""
        from datetime import datetime, timezone

        charge_calls: list[dict] = []

        adapter = ComunifyTokenizedRecurringAdapter(
            gateway="stripe_connect",
            plan_kind=PLAN_KIND_COHORT_INSTALLMENTS,
            _charge_fn=self._make_mock_charge_fn(charge_calls),
        )

        subscriber_id = uuid4()
        entity_id = uuid4()
        installment = Installment(
            installment_n=1,
            amount=Decimal("99.00"),
            currency="ARS",
            scheduled_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
        )

        # First charge
        result1 = await adapter.charge_installment(
            subscriber_id=subscriber_id,
            entity_id=entity_id,
            installment=installment,
        )
        assert len(charge_calls) == 1

        # Retry — should NOT call charge function again
        result2 = await adapter.charge_installment(
            subscriber_id=subscriber_id,
            entity_id=entity_id,
            installment=installment,
        )
        assert len(charge_calls) == 1  # No second call!
        assert result1.payment_intent_id == result2.payment_intent_id
        assert result1.idempotency_key == result2.idempotency_key

    @pytest.mark.parametrize(
        "invalid_count",
        [1, 2, 4, 5, 7, 9, 11, 13],
    )
    async def test_invalid_cohort_installment_count_raises(self, invalid_count: int) -> None:
        """Cohort installment count not in (3, 6, 12) raises ValueError."""
        from datetime import datetime, timezone

        adapter = ComunifyTokenizedRecurringAdapter(
            gateway="stripe_connect",
            plan_kind=PLAN_KIND_COHORT_INSTALLMENTS,
            _charge_fn=self._make_mock_charge_fn([]),
            _cron_register_fn=self._make_mock_cron_fn([]),
        )

        installments = [
            Installment(
                installment_n=i,
                amount=Decimal("50.00"),
                currency="ARS",
                scheduled_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            )
            for i in range(1, invalid_count + 1)
        ]

        with pytest.raises(ValueError, match="Cohort installment count must be one of"):
            await adapter.schedule_recurring(
                subscriber_id=uuid4(),
                entity_id=uuid4(),
                installments=installments,
            )

    @pytest.mark.parametrize("valid_count", list(COHORT_INSTALLMENT_OPTIONS))
    async def test_valid_cohort_installment_counts(self, valid_count: int) -> None:
        """Cohort installment counts 3, 6, 12 are all valid."""
        from datetime import datetime, timezone

        adapter = ComunifyTokenizedRecurringAdapter(
            gateway="stripe_connect",
            plan_kind=PLAN_KIND_COHORT_INSTALLMENTS,
            _charge_fn=self._make_mock_charge_fn([]),
            _cron_register_fn=self._make_mock_cron_fn([]),
        )

        installments = [
            Installment(
                installment_n=i,
                amount=Decimal("50.00"),
                currency="ARS",
                scheduled_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            )
            for i in range(1, valid_count + 1)
        ]

        schedule = await adapter.schedule_recurring(
            subscriber_id=uuid4(),
            entity_id=uuid4(),
            installments=installments,
        )
        assert schedule.total_installments == valid_count

    async def test_monthly_membership_no_count_restriction(self) -> None:
        """monthly_membership plan kind accepts any installment count."""
        from datetime import datetime, timezone

        adapter = ComunifyTokenizedRecurringAdapter(
            gateway="mercadopago",
            plan_kind=PLAN_KIND_MONTHLY_MEMBERSHIP,
            _charge_fn=self._make_mock_charge_fn([]),
            _cron_register_fn=self._make_mock_cron_fn([]),
        )

        # 7 months — allowed for monthly_membership
        installments = [
            Installment(
                installment_n=i,
                amount=Decimal("29.00"),
                currency="ARS",
                scheduled_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            )
            for i in range(1, 8)
        ]

        schedule = await adapter.schedule_recurring(
            subscriber_id=uuid4(),
            entity_id=uuid4(),
            installments=installments,
        )
        assert schedule.total_installments == 7
        assert schedule.plan_kind == PLAN_KIND_MONTHLY_MEMBERSHIP


# ── STRIPE WEBHOOK VERIFICATION TESTS ────────────────────────────────────────


class TestComunifyStripeWebhook:
    """Verify Stripe webhook HMAC-SHA256 verification — comunify adapter."""

    def _make_stripe_signature(self, *, raw_body: bytes, secret: str, timestamp: int) -> str:
        signed_payload = f"{timestamp}.".encode() + raw_body
        sig = hmac_mod.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
        return f"t={timestamp},v1={sig}"

    def test_valid_webhook_signature_returns_event(self) -> None:
        """Valid Stripe-Signature → returns parsed event dict."""
        secret = "whsec_test_abc123"
        adapter = ComunifyStripeConnectAdapter(
            secret_key="sk_test",
            webhook_secret=secret,
        )
        event = {"id": "evt_test", "type": "payment_intent.succeeded"}
        raw_body = json.dumps(event).encode()
        ts = int(time.time())
        sig = self._make_stripe_signature(raw_body=raw_body, secret=secret, timestamp=ts)

        result = adapter.verify_webhook(raw_body=raw_body, stripe_signature=sig)
        assert result["type"] == "payment_intent.succeeded"

    def test_invalid_signature_raises_value_error(self) -> None:
        """Tampered body → verify_webhook raises ValueError."""
        adapter = ComunifyStripeConnectAdapter(
            secret_key="sk_test",
            webhook_secret="correct_secret",
        )
        raw_body = b'{"type": "payment_intent.failed"}'
        ts = int(time.time())
        # Use wrong secret for signature
        sig = self._make_stripe_signature(raw_body=raw_body, secret="wrong_secret", timestamp=ts)

        with pytest.raises(ValueError, match="signature mismatch"):
            adapter.verify_webhook(raw_body=raw_body, stripe_signature=sig)

    def test_replay_attack_old_timestamp_raises(self) -> None:
        """Old webhook timestamp (> 300s) → raises ValueError (replay protection)."""
        secret = "whsec_replay_test"
        adapter = ComunifyStripeConnectAdapter(
            secret_key="sk_test",
            webhook_secret=secret,
        )
        raw_body = b'{"type": "payment_intent.succeeded"}'
        old_timestamp = int(time.time()) - 400  # 400s old
        sig = self._make_stripe_signature(raw_body=raw_body, secret=secret, timestamp=old_timestamp)

        with pytest.raises(ValueError, match="too old"):
            adapter.verify_webhook(raw_body=raw_body, stripe_signature=sig)

    def test_empty_webhook_secret_raises(self) -> None:
        """Missing webhook_secret → raises ValueError with env var hint."""
        adapter = ComunifyStripeConnectAdapter(secret_key="sk_test", webhook_secret="")
        with pytest.raises(ValueError, match="COMUNIFY_STRIPE_WEBHOOK_SECRET"):
            adapter.verify_webhook(raw_body=b"{}", stripe_signature="t=123,v1=abc")
