"""Comunify copilot module — extractors + workflows + KB packs.

Created by T-kb-1 (R23 Opus 4.7 production AGENTIC code).

Per `docs/product/stories/luana-comunify-bootstrap/03-arch-agentic.md` § 3.1
this package hosts:

* `extractors/` — OfferLadderAdvisor + AuthorityVaultExtractor (T-extractors-1/2)
* `workflows/` — CommunityEngagementWorkflow + CohortEnrollmentWorkflow (T-workflows-1/2)
* `kb/creator_economy_kb_v1/` — Qdrant-backed brand-scope KB pack (this ticket)
* `module_registry_entry.py` — ModuleDescriptor registration (downstream)

Anti-duplication audit-trail (per `.claude/rules/anti-duplication.md`):
This package mirrors the Vitalia precedent at
``luana-platform/vitalia/backend/src/modules/vitalia/copilot/`` as a sibling
brand-isolated implementation. ``MarketingKbStore`` in
``core/luana-core-copilot`` is a tenant-AGNOSTIC global marketing KB
(different schema, different semantic) — not a parent abstraction. Comunify
is the 2nd brand consumer (Vitalia 1st). LIFT-to-core deferred until the
3rd brand needs the same shape, at which point the architect lifts to
``core/luana-core-copilot/qdrant/branded_kb_store.py`` (per anti-duplication
threshold rule).
"""
