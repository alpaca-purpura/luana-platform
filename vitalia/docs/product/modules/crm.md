---
module: crm
brand: vitalia
last_updated: 2026-05-18
---

# crm — Patient + Lead management

Módulo CRM Vitalia: Patient (PHI entity con dual filter tenant_id + clinic_id, extiende PhiRepositoryBase) + Lead (non-PHI entity con single tenant filter) + services con `@require_phi_access` RBAC + 4 endpoints REST.

Slice 1 (2026-05-18) introdujo scaffold con raw SQL `text()` (ORM models pending Slice 2). PatientService restricts `opt_out` a admin_clinic role only.

## Capabilities

<!-- auto-list:start -->
- `vitalia-crm-scaffold-slice-1` (live)
<!-- auto-list:end -->
