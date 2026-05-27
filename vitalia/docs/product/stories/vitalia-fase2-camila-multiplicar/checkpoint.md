---
story_id: vitalia-fase2-camila-multiplicar
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
agent_owner: camila
module: referrals
capability: camila.multiplicar
state: idea
architecture_pattern: ADR-vitalia-004
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: medium
estimated_dev_days: 4-5
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-camila-voz                # promoter triggers
    - vitalia-fase2-valeria-pacientes         # promotor patients source
blocks_hard: []
blocks_soft: []
reuse_map_summary: "★ MUDAR referrals_leaderboard de Lucas→Camila (atomic ownership P1 paradigma 2026-05-21) · audience PROMOTORES (NPS 9-10 patients) · NEW listas dinámicas + auto-triggers · NEW recompensas tracker"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md con wireframes leaderboard + listas + recompensas"
---

# F2-S13 vitalia-fase2-camila-multiplicar — checkpoint

## Goal

Sub-tab Multiplicar de Camila: **audience = promotores** (NPS 9-10 · patients que recomiendan). Referrals + advocacy growth. 

**★ Atomic ownership P1 (paradigma cementado 2026-05-21):** referrals_leaderboard MUDAR de Lucas → Camila. Lucas atrae nuevos · Camila multiplica existentes-via-promotores. Sin overlap.

Listas dinámicas:
- `promotor-sin-referir` — Promotor NPS 9-10 last 90d no envió referrer link
- `cumpleanos-mes` — Pacientes con cumpleaños en mes actual (oportunidad gift card → referral)
- `aniversario-cliente` — Año de antigüedad cliente (oportunidad reconocimiento + referral push)

Auto-triggers:
- `nps-promotor-14d` — NPS 9-10 emitted hace 14 días → auto-send referral request
- `cumpleanos` — Trigger día cumpleaños
- `resena-5-estrellas` — Reseña pública 5 stars → "Gracias + referral link"

## Anti-objetivos

- NO duplicar audience leads (Adrián)
- NO duplicar audience pacientes-en-riesgo (Camila reactivar)
- NO implementar referral payouts financial (story future · MVP solo tracking)
- NO tocar engine

## Scope verbatim

### § 1 — Page + 3 secciones

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/camila/multiplicar/page.tsx`:

`<CamilaMultiplicarView>` con 3 cards principales + leaderboard:

1. **Promotores activos** — Métricas + listas dinámicas
2. **Referrals tracking** — Tabla referrals con status (sent · clicked · converted)
3. **Leaderboard** — Top 10 promotores por referrals exitosos
4. **Recompensas** — Tracker de recompensas pendientes / entregadas

### § 2 — `PromotoresSection` (★ migrado desde Lucas)

`vitalia/frontend/src/features/camila/components/multiplicar/PromotoresSection.tsx`:

Listas dinámicas cards con counts live:
- `promotor-sin-referir` (count)
- `cumpleanos-mes`
- `aniversario-cliente`

Click card → drawer lista paginated con bulk action "Enviar referral request".

### § 3 — `ReferralsTrackingTable`

Tabla referrals:
- Referrer (paciente promotor masked)
- Referee (nuevo lead masked si converted)
- Status: `link_sent · link_clicked · lead_created · converted_to_patient · reward_pending · reward_delivered`
- Date
- Conversion value (revenue del nuevo paciente)
- Acciones: Ver detalle · Entregar recompensa · Excluir

### § 4 — `Leaderboard` (★ migrado)

`vitalia/frontend/src/features/camila/components/multiplicar/Leaderboard.tsx`:

Top 10 promotores (per month/quarter/all-time):
- Avatar masked + nombre masked
- Total referrals sent · converted · revenue impact
- Badge "Promotor estrella" si top 3
- Acciones admin: enviar recompensa custom · excluir

### § 5 — `RecompensasTracker`

Tracker recompensas:
- Definición config (per tenant): tipo (descuento · gift card · sesión gratis · etc.)
- Lista pending recompensas (referrer convertido pero no entregado)
- CTA "Marcar entregada" + audit row

### § 6 — Auto-triggers integration

Backend listener consume F2-S11 voz triggers:
- `nps-9-10` → check si hace 14d → auto-send referral request (modo Decide)
- `cumpleanos` → trigger día → auto-send mensaje + referral link
- `resena-5-estrellas` → auto-thank + link

Si modo Consulta → queue para human approve.

### § 7 — HIPAA-lite

Referral mensajes NUNCA incluyen detalles clínicos paciente referrer. "Hola P. Gracias por ser parte de nuestra clínica · invita a alguien y..."

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Page renderiza 4 secciones |
| AC-2 | Listas dinámicas cards counts live |
| AC-3 | Drawer lista bulk action funciona |
| AC-4 | Referrals tracking tabla paginated + filterable |
| AC-5 | Leaderboard refresh per period selector |
| AC-6 | Recompensas tracker permite marcar entregadas con audit |
| AC-7 | Auto-triggers integration desde F2-S11 |
| AC-8 | Audit log per referral request + per reward delivery |
| AC-9 | Visual goldens × 8 (4 secciones × 2 themes) |
| AC-10 | a11y axe pass |
| AC-11 | Cross-tenant + opt-out enforce |
| AC-12 | Vitest + Playwright + a11y pass |

## Gherkin scenarios

### Scenario 1 — happy: trigger NPS promoter 14d

**Given:** Paciente NPS 9 emitted hace 14 días. Modo Decide. No referral request sent.

**When:** Cron `multiplicar_triggers_sweep` corre

**Then:**
- Action dispatcher invoca referral request
- Outbound mensaje + referral link enviado
- Audit log: `referral_auto_triggered_promotor_14d`
- Lista `promotor-sin-referir` excluye este paciente

### Scenario 2 — edge: leaderboard tied scores

**Given:** 5 promotores con mismo referral count

**When:** Leaderboard renderiza

**Then:**
- Tie-breaker secundario: revenue impact
- Si still tied → orden por timestamp first referral · cementado deterministic

### Scenario 3 — adversarial: marcar entregada recompensa que no existe

**Given:** Adversarial intent

**When:** POST `/api/multiplicar/rewards/{id}/deliver` con id ficticio

**Then:** 404 · audit `cross_tenant_attempt` o `not_found`

### Scenario 4 — keyboard-a11y leaderboard

Tab → row · Enter → expand · aria-rowindex correctos.

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/camila/multiplicar/page.tsx` | MODIFY |
| `vitalia/frontend/src/features/camila/components/multiplicar/CamilaMultiplicarView.tsx` | NEW |
| `vitalia/frontend/src/features/camila/components/multiplicar/PromotoresSection.tsx` | NEW |
| `vitalia/frontend/src/features/camila/components/multiplicar/ReferralsTrackingTable.tsx` | NEW |
| `vitalia/frontend/src/features/camila/components/multiplicar/Leaderboard.tsx` | NEW (★ migrado desde Lucas) |
| `vitalia/frontend/src/features/camila/components/multiplicar/RecompensasTracker.tsx` | NEW |
| `vitalia/frontend/src/features/camila/api/multiplicar.ts` | NEW |
| `vitalia/frontend/src/features/camila/types/referral.types.ts` | NEW |
| `vitalia/backend/src/modules/vitalia/referrals/api/multiplicar_router.py` | NEW or MODIFY (migrar desde lucas) |
| `vitalia/backend/src/modules/vitalia/referrals/application/leaderboard_service.py` | NEW or MIGRATE |
| `vitalia/backend/src/modules/vitalia/referrals/application/auto_trigger_service.py` | NEW |
| `vitalia/backend/src/modules/vitalia/referrals/persistence/migrations/XXXX_referrals_camila_migrate.py` | NEW (idempotent · re-owner |
| `vitalia/frontend/e2e/shell-organism/camila-multiplicar-flow.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/multiplicar/{view}-{light\|dark}.png` (×8) | NEW |
| `vitalia/backend/tests/modules/vitalia/referrals/test_leaderboard_tie_break.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/referrals/test_auto_trigger_idempotency.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/referrals/test_cross_tenant.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación |
|---|---|---|
| Vitalia shipped — `vitalia/backend/src/modules/vitalia/lucas/referrals` (if exists) | Lucas referrals primera versión | **MIGRATE owner a Camila** (atomic ownership) |
| F2-S11 camila-voz triggers | nps-9-10 · cumpleanos · resena-5-estrellas | CONSUME via shared signals |
| F2-S5 outbound campaign worker | Send + opt-out + rate-limit | REUSE |
| `core/luana-core-events` | DomainEvent bus | EMIT referral_sent · referral_converted |
| Shadcn primitives | `Card` · `Table` · `Badge` · `Dialog` | reuse |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` + `vitalia-fase1-routing-shell`

### Soft
- `vitalia-fase2-camila-voz` — triggers source
- `vitalia-fase2-valeria-pacientes` — promotor cohortes

### Esta historia desbloquea
- F2-S15..F2-S19 Lucas: post migration lucas NO incluye referrals — clean ownership

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Migration referrals lucas→camila rompe data shipped | Media | Alto | Idempotent migration + data backfill test + dual-read transition period |
| Leaderboard tied scores ambiguity | Baja | Bajo | Deterministic tie-breakers documented |
| Reward delivery sin financial gateway | Alta | Bajo | MVP: tracking only · story future financial integration |

## Definición de "Done"

1. AC verificados + atomic ownership P1 ratificada
2. Visual goldens × 8
3. Backend tests leaderboard + idempotency + cross-tenant + migration pass
4. Story pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `camila.multiplicar` registrada + Lucas referrals ownership removed clean

## Próximo paso post-done

- Lucas stories ya NO tocan referrals (clean ownership)
- F2-S14 reputacion consume signals reseñas

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Navigation tree:** § camila.multiplicar (★ migrated from Lucas)
- **HIPAA-lite:** `vitalia/.claude/rules/hipaa-lite.md`
- **Paradigm origen 2026-05-21:** atomic ownership P1
