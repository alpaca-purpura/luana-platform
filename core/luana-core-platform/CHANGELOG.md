# Changelog — luana-core-platform

All notable changes to this package are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
