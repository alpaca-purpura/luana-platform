---
story_id: vitalia-fase2-lisa-compliance
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
agent_owner: lisa
module: compliance
capability: lisa.compliance
state: idea
architecture_pattern: ADR-vitalia-004
last_modified: 2026-05-22
ratified_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 3-4
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft:
    - vitalia-fase2-config-avanzado          # raw audit log vive ahí (link cross-tab)
blocks_hard: []
blocks_soft: []
reuse_map_summary: "REUSE medical-compliance shipped · REUSE core/luana-core-compliance engine · NEW semáforo HIPAA-lite UI + política retención editor + reportes export · NEW link a Configurar → Avanzado raw log"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md con wireframes semáforo + política retención + reportes"
---

# F2-S10 vitalia-fase2-lisa-compliance — checkpoint

## Goal

Sub-tab Compliance de Lisa: **semáforo HIPAA-lite** mostrando estado defensivo paciente actual (encryption at-rest · audit log integridad · RBAC enforced · retention policy active · channel guards funcionando), editor política retención (configurable per tenant: defaults 10y), reportes export (audit trail · PHI access log · compliance attestation PDF).

Link cross-tab a Configurar → Avanzado para raw audit log inspection (técnico).

## Anti-objetivos

- NO sustituir auditoría compliance legal externa (esto es soporte interno · no certificación)
- NO tocar `core/luana-core-compliance` engine (read-only · consume via API)
- NO implementar auto-remediation breach (out-of-scope · solo detection + alert)
- NO duplicar audit log shipped en `core/luana-core-observability`
- NO exponer raw audit log aquí (link a Config Avanzado para technicalidad)

## Scope verbatim

### § 1 — Page + semáforo

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/compliance/page.tsx`:

`<LisaComplianceView>` con 4 sub-secciones (cards vertical):

### § 2 — `ComplianceSemaforo` card (★ visual estado)

`vitalia/frontend/src/features/lisa/components/compliance/ComplianceSemaforo.tsx`:

7 checks con visual indicator (🟢 OK · 🟡 Warning · 🔴 Critical):

| Check | Verificación |
|---|---|
| 🔐 Encryption at-rest | DB column `patient_medical_records` encryption status (pgcrypto) |
| 📝 Audit log integridad | Last 24h audit_log row count > 0 + no gaps detectados |
| 👥 RBAC enforced | Last 30d 0 violations `unauthorized_phi_attempt` |
| ⏰ Retention policy | Cron `vitalia_phi_retention_sweep` last run < 30d |
| 📡 Channel guards | ComplianceService bloqueos PHI outbound count last 30d (informativo) |
| 🔒 HTTPS strict | All routes prod HTTPS · 0 http fallbacks last 7d |
| 🛡️ Sanitization | sanitize_payload aplicado en TODOS trace events (arch fitness) |

Cada check expandible: click → drawer detalle con timestamp + sources + remediation steps si rojo/amarillo.

Backend endpoint `/api/compliance/semaforo` agrega data de múltiples sources (audit_log + db introspection + cron status).

### § 3 — `RetentionPolicyEditor` card

`vitalia/frontend/src/features/lisa/components/compliance/RetentionPolicyEditor.tsx`:

Editor política retención per category:
- Patient records (default 10y)
- Audit logs (default 10y · regulado)
- Conversation logs (default 5y)
- Marketing data (default 3y)
- Backups (default 1y)

Tenant puede aumentar pero NO reducir bajo defaults regulados. Backend valida.

Cron sweep mensual configurable (Day-of-month).

### § 4 — `ComplianceReports` card

`vitalia/frontend/src/features/lisa/components/compliance/ComplianceReports.tsx`:

Reports generables (background worker · email user cuando ready):

- **Audit trail** — Last N días audit_log export CSV (PHI ofuscado)
- **PHI access log** — Quién accedió qué paciente cuando
- **Compliance attestation PDF** — Snapshot semáforo + signatures + tenant metadata + timestamp

Download history visible.

### § 5 — `LinksToAvanzado` card

Link cross-tab a Configurar → Avanzado → Raw audit log (consumido por F2-S22):
- "Inspeccionar audit log técnico (Config → Avanzado)"
- "Configurar feature flags compliance"
- "Cifrado adicional column-level (advanced)"

### § 6 — HIPAA-lite voice in UI

Per `hipaa-lite.md` no claim full HIPAA — UI debe ser claro:
- Header banner: "Compliance defensivo HIPAA-lite. NO certificación HIPAA US. Para covered-entity status BAA requerido."
- Tooltips con disclaimers en cada check

### § 7 — Mobile responsive

- Cards stack vertical
- Semáforo checks → accordion

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Page renderiza 4 cards vertical |
| AC-2 | Semáforo 7 checks muestra status correcto live |
| AC-3 | Click check expand drawer detalle |
| AC-4 | Retention policy editor permite aumentar (no reducir bajo regulado) |
| AC-5 | Reports generable + download history |
| AC-6 | Links cross-tab a Config Avanzado funcionan |
| AC-7 | HIPAA-lite disclaimer banner visible siempre |
| AC-8 | Visual goldens × 4 (semáforo OK · semáforo warning · retention editor · reports × 2 themes = 8) |
| AC-9 | a11y axe pass |
| AC-10 | RBAC: solo admin_clinic puede editar retention · staff read-only semáforo |
| AC-11 | Cross-tenant query bloqueada |
| AC-12 | Backend reports honran sanitize_payload (NO PHI raw) |
| AC-13 | Vitest + Playwright + a11y pass |

## Gherkin scenarios

### Scenario 1 — happy: semáforo all green

**Given:** Tenant fresh con todas configs por default

**When:** User abre Lisa→Compliance

**Then:**
- Semáforo 7 🟢 OK
- Banner HIPAA-lite disclaimer visible
- Audit log row creado `compliance_dashboard_viewed`

### Scenario 2 — negative: check warning rojo

**Given:** Backup last 30d age = 35d (overdue per policy)

**When:** Page carga

**Then:**
- Check Backups muestra 🔴 con tooltip "Último backup hace 35d (esperado ≤ 30d)"
- Click expand → drawer con timeline + "Contactar IT operations" CTA

### Scenario 3 — edge: retention edit bajo regulado

**Given:** Retention audit_log default 10y

**When:** User intenta reducir a 5y · submit

**Then:**
- Backend valida → 422 "Audit log retention mínimo 10y por regulación"
- UI muestra error inline + sugerencia
- NO persiste

### Scenario 4 — adversarial: report download cross-tenant

**Given:** Adversarial conoce report_id de tenant B

**When:** GET `/api/compliance/reports/{id}/download`

**Then:**
- Backend dual filter bloquea
- 404
- Audit log `cross_tenant_report_attempt`
- Sentry alert

### Scenario 5 — keyboard-a11y cards

**Given:** Foco primer card semáforo

**When:** Tab traverse checks

**Then:** Cada check focuseable · Enter expand drawer · Esc cierra · aria-expanded correcto

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/compliance/page.tsx` | MODIFY |
| `vitalia/frontend/src/features/lisa/components/compliance/LisaComplianceView.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/compliance/ComplianceSemaforo.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/compliance/RetentionPolicyEditor.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/compliance/ComplianceReports.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/compliance/LinksToAvanzado.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/api/compliance.ts` | NEW |
| `vitalia/frontend/src/features/lisa/types/compliance.types.ts` | NEW |
| `vitalia/backend/src/modules/vitalia/compliance/api/semaforo_router.py` | NEW (aggregates checks) |
| `vitalia/backend/src/modules/vitalia/compliance/api/retention_router.py` | NEW |
| `vitalia/backend/src/modules/vitalia/compliance/api/reports_router.py` | NEW |
| `vitalia/backend/src/modules/vitalia/compliance/application/semaforo_aggregator.py` | NEW |
| `vitalia/backend/src/modules/vitalia/compliance/application/report_generator.py` | NEW (background worker) |
| `vitalia/backend/src/modules/vitalia/compliance/application/retention_validator.py` | NEW |
| `vitalia/frontend/e2e/shell-organism/lisa-compliance-semaforo.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/compliance/{view}-{light\|dark}.png` (×8) | NEW |
| `vitalia/backend/tests/modules/vitalia/compliance/test_semaforo_aggregator.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/compliance/test_retention_minimum_enforce.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/compliance/test_report_phi_sanitize.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/compliance/test_compliance_cross_tenant.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación |
|---|---|---|
| `core/luana-core-compliance` (engine) | ComplianceService + channel guards | CONSUME via API |
| `core/luana-core-observability` | audit_log table + sanitize_payload | CONSUME read-only |
| Vitalia shipped — medical-compliance feature | UI primera versión (legacy `/medical-compliance`) | REFACTOR migrar al shell-organism |
| Vitalia shipped — `vitalia/backend/src/modules/vitalia/compliance/phi_fields.py` | PHI fields canónicos | REUSE |
| Shadcn primitives | `Card` · `Alert` · `Tabs` · `Dialog` · `Drawer` · `Progress` | npx install |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` + `vitalia-fase1-routing-shell`

### Soft
- `vitalia-fase2-config-avanzado` — link cross-tab raw audit log

### Esta historia desbloquea
- ninguna (es endpoint visualización)

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Semáforo aggregator query lento | Media | Bajo | Cache 5min + background refresh |
| Reports PDF generation falla | Baja | Bajo | Retry queue + alert si > 5% fail rate |
| User confusion "HIPAA-lite" vs HIPAA full | Alta | Medio | Banner explicito + docs link |

## Definición de "Done"

1. AC verificados
2. Visual goldens × 8
3. Backend tests semáforo + retention + reports + cross-tenant pass
4. Story pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `lisa.compliance` registrada

## Próximo paso post-done

- F2-S22 config-avanzado expone raw audit log técnico
- Story future: auto-remediation suggestions

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Navigation tree:** § lisa.compliance
- **HIPAA-lite overlay:** `vitalia/.claude/rules/hipaa-lite.md` (★ SSoT defensiva)
- **Engine compliance:** `core/luana-core-compliance/`
