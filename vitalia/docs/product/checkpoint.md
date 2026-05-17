---
brand: vitalia
vertical: "Salud + Bienestar"
status: shipped
last_updated: 2026-05-17
slice_1_status: kicked-off  # Fase 0 + Fase A done; Fase B refining in progress 3 side stories awaiting Chris ratification
active_outcomes:
  - dev-environment-multibrand     # receta vitalia shipped, cross-brand replicación pendiente nicolify/comunify/lupulo
  - vitalia-mvp-ui-foundation      # outcome maestro Slice 1/2/3 FE Vitalia MVP
active_stories:
  - vitalia-ux-discovery                   # state: ready (READY_PACKAGE_CLOSED_AND_SPLIT) — /architect produjo package 2026-05-17 · split aceptado Chris en 7 sub-stories
  - vitalia-slice-1-infra-cross-cutting    # state: ready (no blockers post Fase A promotion lift, ARRANCA aquí /dev-team)
  - vitalia-slice-1-onboarding-wizard      # state: refined (blocked by infra + copilot-tools-impl)
  - vitalia-slice-1-inbox                  # state: refined (blocked by infra)
  - vitalia-slice-1-pipeline               # state: refined (blocked by infra + payment-adapter-mvp + copilot-tools-impl)
  - vitalia-slice-1-agenda                 # state: refined (blocked by infra + payment-adapter-mvp + fiscal-emission-pe)
  - vitalia-slice-1-fidelizacion           # state: refined (blocked by infra)
  - vitalia-slice-1-marketing              # state: refined (blocked by infra + copilot-tools-impl)
  - vitalia-pricing-decision               # state: idea (spawned 2026-05-17, decisión Chris postergada)
  - vitalia-payment-adapter-mvp            # state: refining (transitioned 2026-05-17 sesión close-slice-1, awaiting /po draft)
  - vitalia-copilot-tools-impl             # state: refining (transitioned 2026-05-17, awaiting /po + /ux-agentico DUAL draft)
  - vitalia-fiscal-emission-pe             # state: refining (transitioned 2026-05-17, awaiting /po draft)
ratified_promotion_proposals:              # APPROVED + migrated 2026-05-17 (commit 5ca6101) — unblocks T-be-migration-014/T-be-migration-015
  - docs/promotion-protocol/proposals/2026-05-17-platform-tenants-location-columns.md      # state: migrated (luana-core-platform 0.1.0→0.2.0)
  - docs/promotion-protocol/proposals/2026-05-17-offer-studio-multi-session-maintenance.md # state: migrated (luana-core-offer-studio 0.1.0→0.2.0)
recently_done:
  - vitalia-dev-stack-functional   # 2026-05-17T17:00 cerrada refining→done · receta 12 pasos en archive/2026/stories/vitalia-dev-stack-functional/07-merge.md
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
- 2026-05-17: dev tunnel chain montado (commit `e7dc4a0`) + smoke test capa transporte verde. Story `vitalia-dev-stack-functional` abierta state=refining para resolver bugs bootstrap FE+BE descubiertos al levantar stack completa (FE `next: not found` por named volume shadow, BE `.venv` corrupto, DB `vitalia_dev` no auto-creada, alembic no auto-upgrade en first start)
- 2026-05-17: sesión UX exploration (Chris + Claude directo). Producido:
  - `vitalia/docs/architecture/design-system.md` — tokens base cementados (paleta 4+1 colores, tipografía sans futurista, agentes UI, PHI conventions, brand voice médica, componentes recipes, agent attribution pattern)
  - `vitalia/docs/product/stories/vitalia-ux-discovery/` — story idea con `00-research.md` como handoff completo (decisiones cementadas + análisis competitivo 5 sitios + audits Nicolify BE+FE + audit Vitalia BE real (24 endpoints, 17 EPs scaffold) + lo que NO funciona + próximos pasos)
  - `/tmp/vitalia-mockups.html` — mockup exploratorio 3 patrones (B/D.1/D.4), **NO ratificado** — descartado por jerarquía visual ambigua (3 columnas sidebar+chat+info no es intuitivo)
  - Aprendizaje principal: empezar por personas + jobs-to-be-done + flujo de navegación, NO por layout. Próxima sesión UX retoma desde `00-research.md` con `/po-ux`
- 2026-05-17 UX iteration v0 ratificada: `/po-ux` re-tomó story `vitalia-ux-discovery` y produjo `01-spec.md v0` ratificado por Chris en 4 batches (G6 batched clarification). Decisiones cementadas: (1) re-framing producto Vitalia = sistema atracción+cierre+fidelización NO ERP, doctor view defer; (2) modelo Owner=Superset con P1 Recepción+Marketing + P2 Owner/Director (Plan Starter 1 humano consolida P1+P2); (3) JTBD top 5 por persona basados en research 5 competidores (cero.ai/botclinico/rendu/dentalink CC/doctocliq), 8 ejes diferenciación Vitalia, 4 MUST visible MVP (agentes identidad + booking prepaid 30% + Brand Studio voz + fidelización workflow); (4) sidebar v3 progresiva única con Dashboard arriba del separador + landing /inbox ambos roles + copilot rail Nicolify reuso directo (`nicolify/frontend/src/features/copilot/`, 65+ componentes) + cross-flows simplificados (sync datos auto + Adrián notif visual + bandeja Pendientes Owner). Precios Vitalia plan TBD (Chris postergó decisión).
- 2026-05-17 outcome maestro creado: `vitalia/docs/product/outcomes/vitalia-mvp-ui-foundation.md` con slice strategy: Slice 1 = 5 rutas P1 operativas (Inbox+Pipeline+Agenda+Fidelización+Marketing, ~5-6 sem dev), Slice 2 = 5 rutas P2 dirección (Dashboard+Inversión+BrandStudio+Tratamientos+Config), Slice 3 = polish+advanced. Stories side `vitalia-pricing-decision` + `vitalia-payment-adapter-mvp` + `vitalia-copilot-tools-impl` referenciadas como dependencies. Next: `/po-ux` produce `01-spec.md v1` acotado a Slice 1 con wireframes+Gherkin+microcopy+componentes mapping.
- 2026-05-17 backlog cleanup (Chris pidió revisar duplicados): dropeadas stories `vitalia-slice-1-fe` y `vitalia-slice-2-fe` (carpetas untracked eliminadas físicamente). Razón: solape funcional con `vitalia-ux-discovery` — paradigm v4 trata una story end-to-end (refining→refined→ready→developing→done), no separa "discovery" + "impl" como stories distintas. `vitalia-ux-discovery` es la story canónica Slice 1 que produce v1 spec → /architect ready package → /dev-team developing. Slice 2 spawneará como story end-to-end propia cuando Slice 1 esté shipped. Outcome `vitalia-mvp-ui-foundation` mantiene slice_strategy planned como roadmap del outcome (no genera stories anticipadas). Side stories pricing-decision + payment-adapter-mvp + copilot-tools-impl atómicas e independientes confirmadas (BE-only vs FE-only / decisión-only, no overlap surfaces).
- 2026-05-17T17:00: **`vitalia-dev-stack-functional` CERRADA (refining → done)** post smoke verification live. Chris ratificó scope cerrado tras verificar /health 200, /sign-in 200, alembic head, 12 tables, 3 containers up 5h. Skip cadena refined/ready/developing/developed/reviewing (work shipped commits `e7dc4a0` + `930df59` + sesión 03:50). Receta 12 pasos cementada en `vitalia/docs/archive/2026/stories/vitalia-dev-stack-functional/07-merge.md` para replicar bootstrap en nicolify/comunify/lupulo. Outcome `dev-environment-multibrand` permanece active hasta cross-brand replication. Brand vitalia retoma camino crítico MVP UI: próximo paso `/po-ux` v1 spec Slice 1 sobre `vitalia-ux-discovery`.
- 2026-05-17 (ronda 3 refining): pre-handoff `/po-ux` v1, sesión `/pm-vitalia` con Chris ratificó (a) 5 decisiones de scope v1 (wizard Valeria stub Slice 1 + fidelización solo NPS + HTML mockup separado + side stories paralelas + 5+3 estados visuales agentic), (b) research independiente UX agentic layout patterns (`vitalia/docs/product/stories/vitalia-ux-discovery/00-research-chat-layout.md` · 436 LOC · 13 productos + 30+ fuentes), (c) **Propuesta C — Wizard-First Asymmetric** ratificada como layout v1 (chat-LEFT 50/50 split SOLO en wizard onboarding + chat-RIGHT rail 72-80px en operación diaria), (d) URL como SSoT con nuqs + Next.js 16 parallel routes + chat dispatch router.push cementado como decisión técnica v1. Story checkpoint actualizado con v1_scope_decisions completas. Next: `/po-ux` produce 01-spec.md v1 acotado a Slice 1 con inputs cementados.
- **2026-05-17 v1 CIERRE vitalia-ux-discovery**: 7/7 batches ratificados Chris (layout shells · /inbox · /pipeline · /agenda · /fidelización · /marketing · wizard onboarding). State refining→refined cementado. §Slice 1 cut + §Components mapping consolidado + §Handoff /architect (12 open questions) producidos. 6 mockups HTML clickable. 4 diferenciadores MUST visible MVP. 8 ejes diferenciación vs competencia. Side stories paralelas Slice 1 cementadas: vitalia-payment-adapter-mvp · vitalia-copilot-tools-impl · vitalia-fiscal-emission-pe (NEW · spawned 2026-05-17 hijo Batch 4 Capa 2 fiscal Nubefact PE).
- **2026-05-17 ready-package-slice-1 sesión arranque**: `/pm-vitalia` creó story `vitalia-fiscal-emission-pe` state=idea (faltante per §Slice 1 cut + Handoff /architect del spec principal). Active stories suma 5. Próximo: 3 side stories refining state idea→refining→refined (handoff `/po` para fiscal-pe + payment-adapter-mvp service-stories · handoff `/po` + `/ux-agentico` para copilot-tools-impl agentic-story). Cuando 4 stories en state=refined → `/architect` spawn paralelos produce ready packages → `/dev-team` autonomous build.
- **2026-05-17 sesión `/pm-vitalia close-slice-1` (este momento)**: Chris ratificó 4 Q&A (proposals APPROVED + side stories refining paralelo + R23 default cost-routing 48 Sonnet+8 Opus + WIP cap relax 7-10). Branch wip/vitalia-slice-1-shipping creado desde main. Ejecutado:
  - **Fase 0 (commit 18c8db1)**: checkpoint base committed (53 files +16048 LOC) — 9 stories vitalia + ready package /architect Opus 4.7 + 2 promotion proposals + portfolio regen + outcome maestro + design-system.md. Comunify/nicolify/tooling files dejados intactos sesiones paralelas.
  - **Fase A (commits 5ca6101 + 6272a8a)**: promotion proposals lift engine modify executed. `luana-core-platform` 0.1.0→0.2.0 (TenantLocationContract Protocol + 11 tests + CHANGELOG). `luana-core-offer-studio` 0.1.0→0.2.0 (MaintenanceScheduleEnum + OfferAdherenceContract Protocol + 13 tests + CHANGELOG). Proposals state draft→accepted→migrated. R3 downstream verification: 1078 tests PASS (24 contract + 888 engine regression + 166 vitalia arch fitness). Nicolify/Comunify R3 BLOCKED por pre-existing `/home/chris/` hardcoded paths debt (orthogonal, no regresión). Lupulo placeholder. Unblocks T-be-migration-014/T-be-migration-015 sub-tasks vitalia-slice-1-infra-cross-cutting.
  - **Fase B kick-off (no commit aún, requires Chris ratification per story)**: 3 side stories transitioned state idea→refining. Checkpoints actualizados con `next_action` cementado + open questions explícitas para cada story:
    - `vitalia-payment-adapter-mvp` — 4 open questions Chris (gateway primario MercadoPago vs multi · 6 Gherkin scenarios · webhook HMAC + idempotency · auto-cancel timing)
    - `vitalia-fiscal-emission-pe` — 4 open questions Chris (Nubefact único vs multi-PSE · Boleta+Factura vs solo Boleta · dead-letter alerta scope · setup UI vs script Slice 1)
    - `vitalia-copilot-tools-impl` — 4 open questions Chris (Adrián 5 tools vs subset · Lucas cron-only vs chat-invokable · eval goldens hardcoded vs plugin · Tessl skills loadout)
  - **Plan honesto restante**: Fase B refining requiere Chris in-chat para ratify 3 specs (G6 batched ≤4 rounds each story). Fases C-F (ready packages + autonomous build + auditor + merge) son días/semanas wall clock (estimated_dev_weeks suma ~13-17 semanas). Esta sesión cementó la cadena (worktree + engine lift + Fase B kick-off); el cierre Slice 1 production-ready se ejecuta en sesiones subsiguientes.
