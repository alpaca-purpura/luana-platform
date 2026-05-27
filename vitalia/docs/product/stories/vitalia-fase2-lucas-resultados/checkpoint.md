---
story_id: vitalia-fase2-lucas-resultados
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
agent_owner: lucas
module: analytics
capability: lucas.resultados
state: idea
architecture_pattern: ADR-vitalia-004
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 5-6
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-lucas-envuelo               # data campañas
    - vitalia-fase2-adrian-outbound             # data outbound
blocks_hard: []
blocks_soft:
  - vitalia-fase2-lucas-mercado                 # competitive benchmark
reuse_map_summary: "REUSE analytics module shipped + bowtie funnel shipped · NEW embudo Bowtie izq (atraer → convertir → reservar → retener) · NEW comparativa cross-canal · NEW histórico per-campaign · NEW N3-dyn post-mortem"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md con wireframes bowtie · comparativa · histórico"

# Schema v2 migration (cement 2026-05-27)
release: F2   # release ID · ver releases/
cap_target: lucas.resultados   # capability slug target (v2 cement 2026-05-27)
cap_change_type: new   # new | fix | extend | derive
parent_story: null   # story padre si spawned · null si independiente
---

# F2-S18 vitalia-fase2-lucas-resultados — checkpoint

## Goal

Sub-tab Resultados de Lucas: dashboard analytics growth-side. 4 sub-secciones:
- **Embudo Bowtie izq** — Atracción → Conversion → Reserva → Retention (full funnel) con attribution
- **Comparativa canal** — Performance cross-channels (Meta vs Google vs Organic vs Outbound)
- **Histórico** — Per-campaign histórico con drill-down
- **Post-mortem** — Análisis cerrada campañas (N3-dyn `campana/[campaign-id]/post-mortem`)

## Anti-objetivos

- NO duplicar core analytics engine (consume API)
- NO implementar custom report builder (default reports MVP)
- NO duplicar metrics Camila (CLTV post-revenue = Camila scope)

## Scope verbatim

### § 1 — Page + 4 sub-secciones tabs

`<LucasResultadosView>` Shadcn Tabs.

### § 2 — `EmbudoBowtieView`

Visualización bowtie (left funnel = atraer + convertir + reservar · right funnel = retener · NOT en este sub-tab · Camila scope):

```
Atraer        Convertir       Reservar
Impressions → Clicks → Leads → Calificados → Reservas
   100k        2k       500      150          80
```

Cada stage clickable → drill-down attribution per channel.

### § 3 — `ComparativaCanal`

Bars chart + table cross-channels:
- Meta vs Google vs IG organic vs FB organic vs Outbound vs Referrals (Camila)
- Metrics: spend · reach · conversions · CPL · ROAS
- Period selector (7d · 30d · 90d · custom)

### § 4 — `HistoricoCampanas`

Tabla campaigns cerradas con stats final:
- Nombre · type · duration · spend · conversions · CPL · ROAS
- Filter + sort + paginated
- Click → N3-dyn post-mortem

### § 5 — N3-dyn `campana/[campaign-id]/post-mortem`

Análisis cerrada campaign:
- KPIs final
- Qué funcionó / qué no (auto-detected · Mateo suggestions opcional)
- Comparación vs benchmark interno
- Recomendaciones próxima iteración
- Export PDF

### § 6 — Attribution model

Backend `vitalia/backend/src/modules/vitalia/analytics/application/attribution_service.py`:
- Last-touch (default)
- Multi-touch linear (opcional)
- Time-decay (opcional)

Config per tenant `brand.yaml::analytics.attribution_model`.

### § 7 — Data sources

Consume `core/luana-core-analytics-engine`:
- Provider metrics (Meta · Google · IG · etc.)
- ETL pipeline data
- MetricCatalog SSoT

### § 8 — HIPAA-lite

Stats aggregated · NUNCA PHI. Backend filter PHI fields antes responder.

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Page renderiza 4 sub-secciones |
| AC-2 | Bowtie funnel renderiza con data correcta |
| AC-3 | Drill-down stage funcional |
| AC-4 | Comparativa canal charts + table |
| AC-5 | Histórico paginated + filter |
| AC-6 | N3-dyn post-mortem funcional |
| AC-7 | Attribution model configurable |
| AC-8 | Export PDF post-mortem |
| AC-9 | Visual goldens × 10 |
| AC-10 | a11y axe pass · charts accessible labels |
| AC-11 | Cross-tenant + PHI fields excluded |
| AC-12 | Vitest + Playwright + a11y pass |

## Gherkin scenarios

### Scenario 1 — happy: drill-down bowtie

**Given:** Bowtie funnel renderiza · stage "Convertir → Leads"

**When:** Click stage Leads

**Then:** Drawer breakdown per channel · audit log `analytics_drill_down`

### Scenario 2 — edge: data missing 1 source

**Given:** Google Analytics API caída

**When:** Page carga

**Then:** Bowtie renderiza data parcial · banner "Datos Google parcial · last sync 6h ago" · NO crash

### Scenario 3 — adversarial: PHI en analytics

**Given:** ETL bug filtró nombres pacientes en aggregate

**When:** GET `/api/analytics/results`

**Then:** Backend response filter exclude PHI fields · arch test `test_analytics_no_phi.py` pass · audit anomaly

### Scenario 4 — keyboard-a11y

Tab tabs + bowtie stages + table rows · aria-live data updates.

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/lucas/resultados/page.tsx` | MODIFY |
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/lucas/resultados/campana/[campaign-id]/post-mortem/page.tsx` | NEW (N3-dyn) |
| `vitalia/frontend/src/features/lucas/components/resultados/LucasResultadosView.tsx` | NEW |
| `vitalia/frontend/src/features/lucas/components/resultados/EmbudoBowtieView.tsx` | NEW |
| `vitalia/frontend/src/features/lucas/components/resultados/ComparativaCanal.tsx` | NEW |
| `vitalia/frontend/src/features/lucas/components/resultados/HistoricoCampanas.tsx` | NEW |
| `vitalia/frontend/src/features/lucas/components/resultados/PostMortemWorkspace.tsx` | NEW |
| `vitalia/frontend/src/features/lucas/api/resultados.ts` | NEW |
| `vitalia/frontend/src/features/lucas/types/analytics.types.ts` | NEW |
| `vitalia/backend/src/modules/vitalia/analytics/api/resultados_router.py` | NEW |
| `vitalia/backend/src/modules/vitalia/analytics/application/attribution_service.py` | NEW |
| `vitalia/backend/src/modules/vitalia/analytics/application/post_mortem_generator.py` | NEW |
| `vitalia/backend/src/modules/vitalia/analytics/extensions.py` | MODIFY (register metric_catalog enabled per brand.yaml) |
| `vitalia/frontend/e2e/shell-organism/lucas-resultados-bowtie.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/resultados/{view}-{light\|dark}.png` (×10) | NEW |
| `vitalia/backend/tests/modules/vitalia/analytics/test_attribution_models.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/analytics/test_analytics_no_phi.py` | NEW (arch fitness) |
| `vitalia/backend/tests/modules/vitalia/analytics/test_post_mortem_generator.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/analytics/test_resultados_cross_tenant.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación |
|---|---|---|
| `core/luana-core-analytics-engine` | MetricCatalog + ETL contract | CONSUME |
| Vitalia shipped — analytics module + bowtie funnel | UI primer versión | REFACTOR migrar |
| F2-S15/16/17 campaigns_growth data | Source data | CONSUME |
| Shadcn primitives + `recharts`/`tremor` | Charts library | npx install |
| `metrics-expert` skill | analytics-metrics + data-reliability rules | APPLY |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` + `vitalia-fase1-routing-shell`

### Soft
- `vitalia-fase2-lucas-envuelo` — campaign data source
- `vitalia-fase2-adrian-outbound` — outbound data source

### Esta historia desbloquea
- F2-S19 lucas-mercado puede integrar benchmark vs market data

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Attribution model bugs cross-tenant | Media | Alto | Arch fitness + unit tests strict |
| ETL data stale | Media | Bajo | Banner "data freshness" + cron health |
| PHI leak en aggregate | Baja | Crítico | Defense-in-depth (BE filter + arch test + auditor categoria) |
| Charts library performance grandes datasets | Media | Bajo | Pagination + sampling + cache |

## Definición de "Done"

1. AC verificados
2. Visual goldens × 10
3. Backend tests attribution + no-PHI + post-mortem + cross-tenant pass
4. Story pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `lucas.resultados` registrada

## Próximo paso post-done

- F2-S19 mercado integra benchmark
- Capability cementa attribution model decision

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Navigation tree:** § lucas.resultados
- **HIPAA-lite:** `vitalia/.claude/rules/hipaa-lite.md`
- **Engine analytics:** `core/luana-core-analytics-engine`
- **metrics-expert skill:** progressive loading pattern
