# chris-input — vitalia-fe-tenant-resolution-no-clerk-org

> Buzón conversacional. Claude appendea verdict al cierre de cada turn.

## 💬 Conversación

### 2026-06-01T12:55 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Story creada (`state: developing`, type `bugfix`, autonomous_mode) por ratificación de Chris (2026-06-01): remediación dedicada del bug sistémico que destapó el live-verify de doctores — el FE resuelve `tenant_id` desde `useAuth().orgId` (Clerk Org, `org_` no-UUID) en **34 archivos** → 500 en todo PHI contra el backend real (viola [[no-clerk-organizations]]).

Plan: `useTenantId()` (espejo useClinicId, lee `public_metadata.tenant_id`) + reemplazo en los 34 archivos + tightening arch test + re-live-verify + **borrar la Clerk org `org_3DzUI3...`** (Chris ratificó hygiene tras el fix). Repro live verificado (observed-bug 2026-06-01). doctores (developing) queda detrás de ésta — la destraba.

Arranco `/dev-team` → builder-frontend para el refactor.
