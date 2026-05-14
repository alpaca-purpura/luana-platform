"""Comunify payment channel adapters — creator_economy overlay on @luana/core/channels.

Three adapters extend base classes from @luana/core/channels/payment/:
- ComunifyStripeConnectAdapter — compliance_level=creator_economy + application_fee per plan_tier
- ComunifyMercadoPagoAdapter   — subscriber tokenization for AR-primary monthly memberships
- ComunifyTokenizedRecurringAdapter — cohort installments (3/6/12 months) + monthly subscriptions

Per Story 12 T-payment-1 + 03-arch-be.md § 11 + brand.yaml payment_gateways config.
Per anti-duplication.md: EXTEND via inheritance, NEVER mirror HTTP plumbing.
"""

from src.modules.comunify.payment.mercadopago_adapter import (
    ComunifyMercadoPagoAdapter,
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
    InstallmentResult,
    RecurringPaymentSchedule,
)

__all__ = (
    "APPLICATION_FEE_RATES",
    "COHORT_INSTALLMENT_OPTIONS",
    "ComunifyMercadoPagoAdapter",
    "ComunifyStripeConnectAdapter",
    "ComunifyTokenizedRecurringAdapter",
    "Installment",
    "InstallmentResult",
    "PLAN_KIND_COHORT_INSTALLMENTS",
    "PLAN_KIND_MONTHLY_MEMBERSHIP",
    "RecurringPaymentSchedule",
)
