"""Root conftest.py for comunify backend tests.

Adds luana workspace packages' source to sys.path so ORM models, the
Extension SDK, and observability primitives can import without requiring
a full workspace install (cyclic deps prevent pip install).

Mirrors vitalia conftest.py pattern (Story 11) — full layer surface per
05-guidelines.md § 1.2 anti-duplication inventory:

  * luana_core_platform        — Base (ORM declarative_base) + locale VO
  * luana_core_extension_sdk   — ExtensionPointRegistry + ToolDef + register_all (Story 9)
  * luana_core_observability   — sanitize_payload + BaseTraceEventRepoProtocol
  * luana_core_channels        — payment.{Stripe,MercadoPago,TokenizedRecurring}Adapter (T-payment-1)
  * luana_core_extraction      — BaseExtractionOrchestrator (T-extractors-1, T-extractors-2, T-voice-1)
  * luana_core_sales_agent     — sales-agent core surfaces
  * luana_core_brand_studio    — PersonalityCompiler + BrandVoicePort (T-voice-3 bridge)
"""

from __future__ import annotations

import sys

# All workspace packages — not published to PyPI; cyclic deps prevent pip install.
# Pattern from vitalia/backend/conftest.py (Story 11) — append packages comunify consumes per ticket.
_WORKSPACE_SRC_PATHS = (
    "/home/chris/luana-platform/core/luana-core-platform/src",
    "/home/chris/luana-platform/core/luana-core-extension-sdk/src",
    "/home/chris/luana-platform/core/luana-core-observability/src",
    "/home/chris/luana-platform/core/luana-core-channels/src",
    "/home/chris/luana-platform/core/luana-core-extraction/src",
    "/home/chris/luana-platform/core/luana-core-sales-agent/src",
    "/home/chris/luana-platform/core/luana-core-brand-studio/src",
)
for _src in _WORKSPACE_SRC_PATHS:
    if _src not in sys.path:
        sys.path.insert(0, _src)
