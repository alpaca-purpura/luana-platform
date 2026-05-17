---
brand: comunify
date: 2026-05-16
slug: capabilities-inventory-recovery
promotable: no                                # gap ya promotable (vitalia learning yes + proposal accepted) — esto es solo registro local del execution
related_promotion_proposal: docs/promotion-protocol/proposals/2026-05-16-capability-inventory-enforcement.md
applies_to_other_brands_potentially: []      # learning local — el cross-brand vive en vitalia learning
---

# Capability inventory recovery — Story 12 gap cerrado

**Qué aprendimos:** El merge de Story 12 (`luana-comunify-bootstrap` 2026-05-15) shipped 17 capabilities reales en 11 módulos pero NO ejecutó el paso 2 del capability promotion (escribir `comunify/docs/product/capabilities/{module}/{cap}.yaml`). El BACKLOG quedó vacío y la SSoT funcional desincronizada del código. Gap idéntico al detectado en vitalia mismo día (ver `vitalia/docs/learnings/2026-05-16-capabilities-inventory-gap.md` + proposal aceptada).

Recuperado 2026-05-16 con inventory desde:
- 10 capabilities archivadas en `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/capabilities/comunify/` (Story 12 SSoT pre-reorg)
- Inspección de código vivo: 7 caps nuevas detectadas (coaching-offers-preset, creator-onboarding-4step, community-engagement-workflow, cohort-enrollment-workflow, creator-economy-agentic-tools, creator-public-landing, creator-signup-handler)

**Origen:** sesión `/pm-luana` cross-skill override (autorización Chris explícita) 2026-05-16 — mismo workflow que cerró gap vitalia.

**Why:** Story 12 mergeó pre-multibrand reorg sin enforcement automático del capability promotion paso 2. Coverage check verde tras recovery: `.venv/bin/python scripts/reconcile_capabilities.py --require-capabilities-exist --brand comunify` PASS.

**How to apply:**
- `/pm-comunify` MUST verificar al merge que existan capability YAMLs por cada feature shipped
- Bootstrap brands futuras (saasora/inmoflow/retailly/fixia/guestly/fitflow): heredan check `--require-capabilities-exist` desde `_pm-brand-template/`
- El learning cross-brand vive en `vitalia/docs/learnings/2026-05-16-capabilities-inventory-gap.md` (promotable=yes + accepted)

**Estado actual:** ✅ 17 caps inventariadas en 11 módulos comunify. Reconcile check verde.
