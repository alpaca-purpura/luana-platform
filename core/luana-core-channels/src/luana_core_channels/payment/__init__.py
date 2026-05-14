"""Payment channel adapters — generic booking-deposit flow.

Lifted shared per Story 11 (luana-vitalia-bootstrap) D4 anti-duplication.md.
Distinct concern from `luana-core-sales-agent.application.tools.payment`
(sales-agent CLOSER tool returning checkout link in chat). This package
hosts CHANNEL ADAPTERS for booking-deposit flow with:

- HMAC webhook verification
- Idempotency key = booking_id
- compliance_level metadata (hipaa_lite for vertical-medical tenants)
- Amount in cents (int) + currency from data (NO hardcoded 'USD')

Verticals (vitalia, future comunify/lupulo) EXTEND base adapter classes —
NEVER mirror per `.claude/rules/anti-duplication.md`.
"""

from luana_core_channels.payment.mercadopago_adapter import (
    BackUrls,
    MercadoPagoAdapter,
    MpPreferenceResponse,
    PayerInfo,
    PaymentLinkOutput,
    PaymentStatusEnum,
    PreferenceItem,
)

__all__ = (
    "BackUrls",
    "MercadoPagoAdapter",
    "MpPreferenceResponse",
    "PayerInfo",
    "PaymentLinkOutput",
    "PaymentStatusEnum",
    "PreferenceItem",
)
