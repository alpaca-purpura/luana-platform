---
slug: vitalia-fase-2-tier-roadmap
kind: outcome-meta-roadmap
parent_outcome: vitalia-mvp-ui-foundation
owner: /pm-vitalia
state: refined
created: 2026-05-27
ratified_by: chris (audit sweep 2026-05-27 — pivot service-deps de TIER 0 → TIER 2 post-stubs validation valeria-agenda)
priority: HIGH-source-of-truth
why_now: |
  Audit 2026-05-27 detectó que ordenamiento tier inicial era incorrecto:
   - Asumía payment-adapter-mvp + fiscal-emission-pe + pricing-decision como TIER 0 (gating ALL Fase 2)
   - Chris corrigió: payment-adapter NO urgente — necesita PRIMERO booking + cobro-intent funcionando
   - Realidad: valeria-agenda DONE con Option A stubs + MSW (no real payment). Esto VALIDA que el chain real es onboarding → booking-con-stubs → payment-real (TIER 2)
  Sin este roadmap cementado, próximas sesiones podían entrar a refinar payment-adapter-mvp prematuramente y bloquear vitalia indefinidamente.
---

# Vitalia Fase 2 — TRUE TIER Roadmap (post audit 2026-05-27)

> SSoT del orden de desarrollo Fase 2 ratificado Chris. **Toda story Fase 2 debe consultar este file antes de transition a refining**. Si scope no encaja en TIER asignado → escalate `/pm-vitalia` ANTES de refining.
>
> Source analysis completa: `docs/process/audits/2026-05-27-stories-sweep.md` + `/tmp/vitalia-fase2-true-deps-2026-05-27.md` (Haiku Fase 2 deps analysis 2026-05-27).

## TL;DR — TIER chain corregido

```
TIER 0 — Onboarding (clinic exists)
   config-onboarding-clinica + lisa-servicios-seed + lisa-doctores-minimal + lisa-compliance-minimal

TIER 1 — Agendamiento real con stubs MSW (paciente puede agendar end-to-end)
   valeria-pacientes + valeria-agenda (ya DONE con stubs) + lisa-landing-public

TIER 2 — Payment + Fiscal real (revenue enabled, reemplaza stubs)
   payment-adapter-mvp + fiscal-emission-pe (solo si PE en launch)

TIER 3 — Adrian CRM (lead-to-revenue)
   adrian-inbox + adrian-embudo + adrian-outbound + adrian-propuestas

TIER 4 — Camila ops (retention)
   camila-voz (foundation) + camila-reactivar + camila-multiplicar + camila-reputacion

TIER 5 — Lisa brand expansion (polish)
   lisa-doctores (full ficha N3-dyn)

TIER 6 — Lucas analytics (visibility)
   lucas-mercado + lucas-envuelo + lucas-resultados + (lucas-lanzar RISKY — ver § Stories deprioritized)

TIER 7 — DEFERRED (post-MVP maturity)
   pricing-decision + config-conexiones + config-avanzado + lucas-recursos
   + payment-adapter-mvp/fiscal-emission-pe si MVP no launch-country PE
```

## TIER 0 — Onboarding (CURRENT FOCUS — start here)

**Value:** Clinic creada en sistema, staff puede loguear, configuración base existe. Pre-condition para CUALQUIER otra story Fase 2.

| story | status hoy | scope | estimate | pre-req Chris |
|---|---|---|---|---|
| `vitalia-fase2-config-onboarding-clinica` | idea | Wizard 5 pasos (clinic profile + timezone/currency + doctor add + service catalog seed + Stripe connect live key) | 3-5d | Confirm Stripe account setup + onboarding flow order |
| `vitalia-fase2-lisa-servicios` (seed minimal) | idea | Service catalog editable per vertical (dental: cleaning, endo, etc. + pricing + image + testimonial). MVP: seed templates per vertical, no editor full | 3-4d | None |
| `vitalia-fase2-lisa-doctores` (minimal CRUD) | idea | Doctor CRUD básico (NO ficha N3-dyn full). Just enough para onboarding wizard add doctor. Ficha full → TIER 5 | 2-3d | None |
| `vitalia-fase2-lisa-compliance` (T&Cs minimal) | idea | Templates legales per vertical (Términos, consentimiento clínico básico). NO matriz compliance full | 2d | None |

**Deliverable TIER 0:** Clinic registrada + 1 doctor + 2-3 servicios + T&Cs aceptados + Stripe Connect link configurado. Staff puede loguear via Clerk + acceder shell-organism Vitalia.

## TIER 1 — Agendamiento real con stubs MSW (TIER 0 done required)

**Value:** Paciente puede completar booking end-to-end (land → chat Valeria → agenda slot → cobro UI muestra). Real payment 503 (stubs MSW, esperado).

| story | status hoy | scope | estimate | blocker |
|---|---|---|---|---|
| `vitalia-fase2-valeria-pacientes` | idea | Directorio pacientes + ficha workspace tabs (datos, citas, propuestas, score). Read+create | 4-5d | None (TIER 0 done) |
| `vitalia-fase2-valeria-agenda` | **DONE** 2026-05-27 | (ya shipped con stubs MSW). Re-validar funcional end-to-end post TIER 0 | — | Verify integration with TIER 0 outputs |
| `vitalia-fase2-lisa-landing-public` | idea | Landing público (servicios, doctores, reviews, booking button → Valeria chat) | 4-5d | TIER 0 done (services + doctores existen) |

**Deliverable TIER 1:** Paciente completa flujo booking end-to-end. **Limitación esperada:** cobro saldo UI muestra "503 Payment unavailable" (stubs activos), boleta no se emite. Acceptable para validation interna MVP.

## TIER 2 — Payment + Fiscal real (revenue enabled)

**Value:** Stubs MSW reemplazados por integraciones reales. Stripe/Mercado Pago charges live. Boleta SUNAT-compliant emit (si PE).

| story | status hoy | scope | estimate | pre-req | si MVP NO PE |
|---|---|---|---|---|---|
| `vitalia-payment-adapter-mvp` | refined (deferred architect) | Charge orchestrator (Stripe + MP + cash) + idempotency + transaction log + audit. Multi-gateway strategy ya ratified Chris 2026-05-22 | 3-4 weeks | Stripe + MP cuentas live setup | aplica igual |
| `vitalia-fiscal-emission-pe` | refining (awaiting po draft) | Nubefact PE boleta/factura + PDF + webhook retry + audit | 1-2 weeks | Nubefact API key + cuenta provisionada | **DEFER a Fase 3 PE launch** (skip si MVP no PE) |

**Deliverable TIER 2:** Valeria-agenda cobro saldo opera real (Stripe/MP charge + boleta emit). Audit log recorded. PII redacted per HIPAA-lite.

## TIER 3 — Adrian CRM (lead-to-revenue)

**Value:** Lead capture (WhatsApp/Insta/Email) → qualification (Pipeline) → engagement (Outbound) → cierre (Propuesta firma). Closes funnel.

| story | scope | estimate | blockers |
|---|---|---|---|
| `vitalia-fase2-adrian-inbox` | Bandeja unificada 3-panel + 3-modos toggle (Decide solo/Consulta/Manual). Reusa sales_agent shipped | 5-6d | TIER 1 done, landing público live |
| `vitalia-fase2-adrian-embudo` | Pipeline Kanban + lead detail N3-dyn. Refactor slice-1-pipeline | 6-8d | **HARD:** TIER 2 done (stage "reservado" deposits via payment-adapter) |
| `vitalia-fase2-adrian-outbound` | Wizard campaigns (segmento builder vs embudo stages, 5 templates Meta-approved) | 4-5d | TIER 3 embudo done (audience source) |
| `vitalia-fase2-adrian-propuestas` | Builder tratamientos + plan pago + términos + firma canvas embebida | 5-6d | **HARD:** TIER 2 done (payment-plans Stripe/MP), services list shipped |

**Deliverable TIER 3:** Lead end-to-end (inbox → embudo → propuesta → firma). Adrián agente operacional.

## TIER 4 — Camila ops (retention)

**Value:** Patient retention + growth via referrals + reputation tracking. Targets EXISTING pacientes.

| story | scope | estimate | blockers |
|---|---|---|---|
| `vitalia-fase2-camila-voz` | SSoT voice-personas + 9 triggers (NPS, cumpleaños, fin-trat, etc.) per agent. Foundation | 2-3d | TIER 0 done |
| `vitalia-fase2-camila-reactivar` | 5 listas dinámicas (sin-actividad-60d, fin-trat, mantenimiento, etc.) + recovery wizard | 4-5d | TIER 1 done + camila-voz |
| `vitalia-fase2-camila-multiplicar` | Leaderboard referrals + promoters NPS 9-10 + auto-triggers | 3-4d | TIER 1 done + camila-voz |
| `vitalia-fase2-camila-reputacion` | NPS & review mgmt (sentiment, alerts, response templates) | 3-4d | TIER 1 done + camila-voz |

**Deliverable TIER 4:** Camila agente operacional. Clinic tiene proactive retention.

## TIER 5 — Lisa brand polish

**Value:** Doctor profiles complete, service editor full, brand presence refined.

| story | scope | estimate |
|---|---|---|
| `vitalia-fase2-lisa-doctores` (full N3-dyn) | Doctor ficha workspace completa (especialidad, agenda, servicios, compliance docs, reviews) | 4-5d |

**Deliverable TIER 5:** Brand profile completo. Pacientes ven doctor bios reales + reviews.

## TIER 6 — Lucas analytics + marketing

**Value:** Growth visibility, campaign orchestration, ROI reporting.

| story | scope | estimate | risk |
|---|---|---|---|
| `vitalia-fase2-lucas-mercado` | Integration credentials vault (Stripe, Meta, GA4, Hotjar, Zapier health) | 3d | None |
| `vitalia-fase2-lucas-envuelo` | Growth analytics bowtie funnel (landing → chat → agenda → completed → reviews → revenue + ltv-cohorts) | 4-5d | None |
| `vitalia-fase2-lucas-resultados` | KPI report per vertical + trends + benchmarks (export CSV/Sheets) | 3-4d | None |
| ⚠️ `vitalia-fase2-lucas-lanzar` | Campaign builder (audience = prospects NOT patients) | 4-5d | **HIGH RISK** scope ambiguo overlap adrian-outbound. Ver § Stories deprioritized |

**Deliverable TIER 6:** Lucas agente operacional. Métricas + campañas + reporting.

## TIER 7 — DEFERRED (post-MVP)

| story | razón defer | re-enable trigger |
|---|---|---|
| `vitalia-pricing-decision` | MVP hardcoded margin. Full engine deferred Phase 3 multi-vertical | Multi-country tax complexity (CO IVA, BR ICMS) o cliente request dynamic pricing |
| `vitalia-fiscal-emission-pe` (si NO PE launch) | Skip si MVP arranca AR/CO/MX only | Peru vertical greenlit Phase 3 |
| `vitalia-fase2-config-conexiones` | UI wizards diferidos — backends shipped, env-var config OK para MVP | 3+ clínicas piden UI toggle |
| `vitalia-fase2-config-avanzado` | Power-user features prematuro — operator maturity needed | 4+ semanas uso intensivo TIER 1-4 |
| `vitalia-fase2-lucas-recursos` | Resource library = reference material, no bloqueante | Post TIER 6 analytics live, agregar como reference |
| `vitalia-fase2-config-cuenta` | Útil pero NO bloqueante MVP — tenant mgmt mínimo via admin Streamlit + Clerk dashboard | TIER 3+ operational maturity |

## ⚠️ Stories DEPRIORITIZED con justificación

### `vitalia-fase2-lucas-lanzar` — HIGH RISK scope ambiguity

**Problem:** Audience definition no clara. Original spec asume "audience = prospects NOT patients" pero overlap directo con `adrian-outbound` (campaigns to leads en embudo).

**Decision tree:**
1. **Opción A (recomendada):** DEFER hasta TIER 3 Adrian completo. Después revaluar:
   - Si Lucas-Lanzar = new-customer ACQUISITION (anuncios Meta/Google fuera embudo) → keep, build
   - Si Lucas-Lanzar = re-engagement de leads existentes → KILL, fusionar con `adrian-outbound`
2. **Opción B:** Cancel + reusar `adrian-outbound` + `lucas-resultados` ROI reporting. Save 4-5d effort.

**Recommended:** Opción A — defer decision a post-TIER-3 con data real de adrian-outbound usage patterns.

## Sprint plan recomendado (6 sesiones próximas Chris)

| Sprint | TIER | Foco | Stories | Estimate | Deliverable |
|---|---|---|---|---|---|
| **A** | TIER 0 | Onboarding | config-onboarding + lisa-servicios-seed + lisa-doctores-min + lisa-compliance-min | 5-6 sessions | Clinic operativa, staff loguea |
| **B** | TIER 1 | Agendamiento | valeria-pacientes + lisa-landing-public (valeria-agenda ya DONE) | 4-5 sessions | Booking end-to-end + cobro UI con stubs MSW |
| **C** | TIER 2 | Revenue real | payment-adapter-mvp + (fiscal-emission-pe si PE) | 4-5 sessions | Stripe/MP live, boletas emitidas |
| **D** | TIER 3 | Adrian CRM | adrian-inbox + adrian-embudo + adrian-outbound + adrian-propuestas | 10-12 sessions | Lead-to-revenue funnel completo |
| **E** | TIER 4 | Camila ops | camila-voz + camila-reactivar + camila-multiplicar + camila-reputacion | 8-10 sessions | Retention + growth ops |
| **F** | TIER 5+6 | Polish + analytics | lisa-doctores-full + lucas-mercado + lucas-envuelo + lucas-resultados | 10-12 sessions | Brand polish + visibility |

**Total estimate MVP closed:** ~40-50 sessions (~6-8 semanas a 6 sesiones/semana).

**MVP "production-ready" definition:** TIER 3 done (lead-to-revenue funcional). TIER 4+ es optimization, NO blocking para launch.

## Pre-conditions Chris ratify para arrancar Sprint A

- [ ] Confirm Stripe account setup vitalia (necesario para config-onboarding Stripe Connect)
- [ ] Confirm vertical default seed templates (dental/estética/oftalmología vs lista expandida)
- [ ] Confirm Peru en launch countries (decide si fiscal-emission-pe TIER 2 vs TIER 7)
- [ ] Confirm pricing inicial vitalia/config/brand.yaml (mantener placeholders 49/199/599 USD o nuevos)

## Trazabilidad

- Audit fuente: `docs/process/audits/2026-05-27-stories-sweep.md`
- Haiku deep analysis: `/tmp/vitalia-fase2-true-deps-2026-05-27.md` (one-off, no commited)
- Outcome padre: `vitalia/docs/product/outcomes/vitalia-mvp-ui-foundation.md`
- Capability infrastructure: ADR-vitalia-004 (shell-feature-architecture)
- TIER 2 spec ratificado: `vitalia/docs/product/stories/vitalia-payment-adapter-mvp/checkpoint.md` (spec v3 ratified 2026-05-22)
- TIER 1 valeria-agenda done: `vitalia/docs/archive/2026/stories/vitalia-fase2-valeria-agenda/`

## Bitácora

- 2026-05-27: outcome creado por audit sweep + Haiku Fase 2 deps analysis. Chris pivot service-deps de TIER 0 → TIER 2 ratificado. State refined directo (NO refining — spec es síntesis de docs ya ratificados, no propuesta nueva).
