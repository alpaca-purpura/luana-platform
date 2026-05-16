---
brand: vitalia
vertical: "Salud + Bienestar"
status: shipped
last_updated: 2026-05-16
active_outcomes: []
active_stories: []
ssot_owner: /pm-vitalia
---

# Vitalia — checkpoint

> Estado actual del brand. Actualizado por `/pm-vitalia` en cada transición.

## Estado funcional shipped (2026-05-16 inventory)

Story 11 (`luana-vitalia-bootstrap`, mergeada 2026-05-15) shipped **16 capabilities en 13 módulos** — backend completo + frontend dashboard + 3 fixtures LATAM + widget UMD + 3 KB packs médicos. Ver `vitalia/docs/product/capabilities/` para detalle por módulo + `vitalia/docs/product/BACKLOG.md` para vista 10 estados.

**Test coverage:** 86 backend tests + 22 FE unit/integration + 24 E2E smoke specs + 1 widget test.

**Plan tiers activos:** solo_doctor (49 USD) · clinic (199 USD) · multi_site (599 USD).

**Diferido a Story 11.bis (per `vitalia/config/brand.yaml`):**
- `multi_site_ui: false` (backend supports; UI defer Q2=B D13)
- `insurance_integration: false` (Q3=B D14)
- `wellness_deep_coverage: false` (Q7=B D12)
- `voice_cloning: false` (D8 ratificado)
- HIPAA-hardening adicional (dual `tenant+clinic` filter, `pgcrypto` column encryption, retention cron 10y, RBAC `@require_phi_access`, ComplianceService channel guard) — ver gap detallado en `vitalia/docs/product/capabilities/compliance/compliance-hipaa-lite-audit.yaml`

## Bitácora

- 2026-05-15: brand topology bootstrap (F0 reorg multimarca) — Story 11 `luana-vitalia-bootstrap` shipped
- 2026-05-16: capability inventory recovery — 16 caps YAMLs escritas en `vitalia/docs/product/capabilities/` desde código vivo + archived YAMLs + Story 11 spec. Gap del paso 2 del capability promotion al merge (ver learning `vitalia/docs/learnings/2026-05-16-capabilities-inventory-gap.md`, promotable: candidate)
