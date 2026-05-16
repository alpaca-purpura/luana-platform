---
module: patients
brand: vitalia
last_updated: 2026-05-16
---

# patients — Pacientes + historial médico

CRUD de pacientes con tenant_id enforcement obligatorio. Upload de PDF historial médico → extracción 4-wave vision-based via `MedicalKBExtractor` → estructura en `medical_history_model`. PII masking obligatorio (phone, email, name_last_initial).

## Capabilities

<!-- auto-list:start -->
- `patient-records-medical-history` (live)
<!-- auto-list:end -->
