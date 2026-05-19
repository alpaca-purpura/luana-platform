# Changelog — luana-core-platform

All notable changes to this package are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-05-19

### Changed

- **BREAKING semantic (engine brand-agnostic principle):** purged 4 nicolify-specific
  hardcoded defaults from `src/luana_core_platform/core/config.py`. Defaults now
  empty strings (or `localhost:4000/v1` for LITELLM) — each brand MUST override
  via `{brand}/.env.dev` / `.env.prod`. Engine no longer assumes a specific brand.
  - `COPILOT_TELEGRAM_BOT_USERNAME`: `"nicolify_copilot_bot"` → `""`
  - `FRONTEND_URL`: `"https://app.nicolify.com"` → `""`
  - `QDRANT_COLLECTION`: `"visionarias_knowledge"` → `""`
  - `QDRANT_COLLECTION_HYBRID`: `"visionarias_hybrid"` → `""`
  - `LITELLM_BASE_URL`: `"http://visionarias_litellm:4000/v1"` → `"http://localhost:4000/v1"`
    (brand-agnostic dev default — production override per-brand container name)

### Migration notes

- **Brand consumers MUST set explicit overrides** in their `{brand}/.env.dev` and
  `.env.prod`. Brand templates `{brand}/.env.dev.template` updated with the canonical
  "Brand-specific config" block. Per `_pm-brand-template/`, future brand bootstraps
  (saasora, inmoflow, retailly, fixia, guestly, fitflow) inherit the pattern from
  day 1.
- **Failfast > silent contamination.** If a brand consumer attempts to call code
  paths that need these settings (copilot Telegram deep-link, sales_agent vector
  store, LiteLLM proxy) without setting them, it will fail explicitly instead of
  silently using nicolify defaults (e.g., writing to Qdrant collection
  `visionarias_knowledge` from a vitalia tenant — gravísimo bajo HIPAA-lite).
- Promotion proposal:
  [`docs/promotion-protocol/proposals/2026-05-19-purge-nicolify-defaults-core-config.md`](../../docs/promotion-protocol/proposals/2026-05-19-purge-nicolify-defaults-core-config.md)
  (state: migrated).

### Notes

- Bump is `minor` (0.2.0 → 0.3.0) per semver-disciplinada convention even though
  semantically it's a "behavior change forcing explicit config". Justification: no
  Python API broke (Settings class signature unchanged, only default values), and
  pre-lift verification ensured all 4 active brand `.env.dev` files were
  pre-populated with explicit overrides before merge — zero runtime behavior
  regression for nicolify/vitalia/comunify/lupulo dev stacks.

## [0.2.0] — 2026-05-17

### Added

- `TenantLocationContract` Protocol in
  `src/luana_core_platform/links/ports/tenant_profile.py`. Universal columns
  brand `tenants` tables MUST implement: `is_onboarded` (bool), `location_country`
  (ISO 3166-1 alpha-2 nullable), `location_city` (str nullable), `timezone`
  (IANA TZ nullable). Enables locale-aware cron jobs, currency defaults per
  country, compliance jurisdiction resolution (HIPAA-lite PE/AR/CL/MX/CO/BR),
  and analytics regionalization. Promotion proposal:
  [`docs/promotion-protocol/proposals/2026-05-17-platform-tenants-location-columns.md`](../../docs/promotion-protocol/proposals/2026-05-17-platform-tenants-location-columns.md)
  (state: migrated).
- Contract tests at `tests/links/test_tenant_location_contract.py` (Protocol
  shape + 8 ISO country code parametrize + non-conforming fail).

### Notes

- Backward-compatible minor bump. All fields are optional via `None` defaults
  or default-safe values; existing brand `tenants` tables remain valid until
  they opt-in via local Alembic migration (`ADD COLUMN IF NOT EXISTS`).
- `docs/core-modules/platform.md` engine-docs file pending creation (deferred
  to a follow-up engine-docs cementing pass — see TODO in promotion proposal).
- Brand consumer opt-in tracking: Vitalia (origen, T-be-migration-014) opt-in
  immediate in Slice 1. Nicolify/Comunify/Lupulo opt-in incremental per story
  demand.

## [0.1.0] — 2026-05-15

### Added

- Initial extraction from `backend/src/shared/` to `core/luana-core-platform/`
  as part of multibrand reorg (Story 5+). Ports for cross-module access:
  access, advertising, analytics, brand, calendar, campaigns, channel_adapter,
  conversational_channel, crm_enrichment, crm_repos, domain_lookup,
  editable_fields, edition_landing_clone, lead_resolution, message_handler,
  offer, payment_connection, sales_agent, scheduling, social_proof,
  tenant_profile.
