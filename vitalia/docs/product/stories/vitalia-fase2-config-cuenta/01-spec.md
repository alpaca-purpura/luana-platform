---
story_id: vitalia-fase2-config-cuenta
brand: vitalia
type: ui-story
state: refining
architecture_pattern: ADR-vitalia-004
spec_round: 1
po_ux_version: 0.2-draft
input_spec_signed: false
mockup_final_signed: false
---

# 01-spec · vitalia-fase2-config-cuenta — Cuenta del tenant

> **RONDA 1 (draft · intención).** Esto NO está firmado. Fija *dónde vive* + *mapa funcional* + *dudas* para que Chris firme "esto es lo que quiero" (`input_spec_signed`). Gherkin + matriz + mockup final = RONDA 2. Scope ratificado por PM: `00-pm-analysis.md` (D1 sin billing · D2 sin equipo · D3 naming configuracion.cuenta).

## § Context — Dónde vive

- **Zona → caja → área** (árbol `paradigm-arquitectura.md` + `SYSTEM-MAP.yaml`): zona **Plataforma** → caja **Configuración** → área **Cuenta del tenant**.
- **Shell** (`SHELL-DESIGN-CONTRACT.md`): ribbon tab **"Plataforma"** (slug URL `config`) → SubTabsBar → sub-tab **"Mi cuenta"** (🏢, default del tab).
- **Ruta donde aterriza el user:** `/{tenantId}/config/cuenta`. Hoy renderiza `CuentaPlaceholder.tsx` vía dispatcher dinámico `[agent]/[subtab]`. Esta story reemplaza el placeholder por la vista real.
- **Frecuencia de uso:** baja (admin) — paradigma: Configuración = ajustes del espacio, no operación diaria.
- **Release:** F4.

### Out-of-scope (anti-creep, ratificado)
- ❌ Facturación SaaS / Plan Luana / Stripe (D1 → `vitalia-pricing-decision` + core billing).
- ❌ Equipo / usuarios / roles / invite (D2 → caja Acceso; ya LIVE en admin Streamlit).
- ❌ Cambio de `vertical`/especialidades (read-only; los posee onboarding).
- ❌ Historia clínica / PHI de pacientes (otra caja).

## § Prior art applied

- **Engine consumed:**
  - `core/luana-core-tenant-profile` — perfil del tenant + `business_types_catalog` (vertical) + cambio rate-limited de business_types. **CONSUME** (no recrear).
  - `core/luana-core-iam` — tenant + roles (scope lectura/permiso de edición).
  - `core/luana-core-platform` `TenantLocale` VO — currency + timezone (NO tiene idioma — ver duda Q5).
- **Reused brand (vitalia, ya construido):**
  - `vitalia/.../modules/vitalia/clinics/domain/clinic.py` — entidad `Clinic` con `name · slug · country · timezone · plan_tier · is_active · onboarding_completed`. **EXTEND** (vista editable; faltan fiscal_id/address/idioma).
  - `clinics/application/credential_validator.py` + `credential_country.py` — patrón validación country-specific (referencia para validador fiscal).
  - `vitalia/.../modules/vitalia/fiscal/` — emisión fiscal (doc fiscal). **No** hay validador de ID fiscal del *tenant* → net-new acotado.
  - Stories archivadas: `vitalia-slice-1-onboarding-wizard` · `vitalia-fase1-tenant-switcher` (patrón tenant data) · `vitalia-fe-tenant-resolution-no-clerk-org` (tenant_id desde `useTenantId()`, NUNCA Clerk org).
- **Learnings aplicados:**
  - `vitalia/docs/learnings/2026-05-31-e2e-mockeado-verde-falso.md` — e2e NO mockea el BE de la superficie (live-verify real).
  - `vitalia/docs/learnings/2026-05-27-fase2-first-story-shipped-shell-feature-pattern.md` — patrón sub-tab ADR-004.
- **Lift candidates:** "Cuenta del tenant" (datos legales+fiscal+locale) es plausiblemente cross-brand → marcar como promotion candidate a `core/luana-core-tenant-profile` si comunify/nicolify lo replican. NO lift ahora (1ª implementación).
- **Net-new justificado:** campos `fiscal_id` (country-specific) + `address` + `idioma` no existen hoy en `Clinic`; validador de ID fiscal del tenant (CUIT/RUC/RFC/NIT/RUT).

## § Mapa funcional (DRAFT — sujeto a interrogatorio gate)

### Happy path (narrado)
1. Admin entra a Plataforma → Mi cuenta. Ve los datos de su clínica precargados (nombre, país, vertical read-only, fiscal, dirección).
2. Corrige un dato (ej. dirección o razón social) → autosave on-change → toast "Guardado".
3. Ajusta preferencias regionales (timezone / idioma / moneda) → autosave → la app refleja el cambio (formato fecha/moneda).
4. (si multi-sede) Ve la lista de sedes de su clínica; entra a una para ver/editar sus datos.
5. Revisa/edita el contacto del Responsable de tratamiento (DPO).
6. Todo cambio queda en audit log (HIPAA-lite).

### Estructura ratificada (RONDA 1 · Q1-Q5)
N3-static `SubSubTabsBar` con **3 sub-sub-tabs**: `/config/cuenta/{datos,preferencias,responsable}`.
1 clínica por tenant (**sin** sección Sedes — diferida). Idioma **derivado del país** (read-only). DPO = **solo referencia** (se gestiona en Seguridad y cumplimiento).

### Bifurcaciones (árbol)
```
N3 · Datos de la clínica (editable · autosave)
├─ ID fiscal formato inválido para el país → inline error + NO persiste                 [SC-neg]
├─ rol NO admin_clinic → campos read-only / 403 al guardar                              [SC-adv]
├─ tipo de clínica + especialidades → read-only (badge "definido en el alta")           [SC-edge]
├─ país → read-only (badge "definido en el alta"; cambio = soporte)                      [SC-edge]
└─ editar nombre/razón social/CUIT/dirección/contacto OK → autosave + persiste + audit   [SC-happy]
N3 · Preferencias regionales
├─ cambio timezone/moneda → autosave + re-render formatos fecha/moneda en la app         [SC-happy]
└─ idioma → derivado del país, read-only (cambio = soporte)                              [SC-edge]
N3 · Responsable de datos (referencia)
└─ ver DPO + link "Gestionar en Seguridad y cumplimiento ↗" (no edita acá)               [SC-happy]
```

### Reglas de negocio (DRAFT)
- **RN-1** Solo rol `admin_clinic` edita; otros roles autorizados ven read-only.
- **RN-2** ID fiscal validado por país (AR CUIT · PE RUC · MX RFC · CL/CO NIT · UY RUT); inválido → rechazo backend + inline error.
- **RN-3** `vertical` + `primary_specialties` read-only post-onboarding (cambio = proceso support).
- **RN-4** Todo write a datos del tenant → audit log sync pre-response (hipaa-lite).
- **RN-5** Datos del tenant son tenant-scoped (`tenant_id`); cross-tenant → 404.
- **RN-6** Preferencias regionales no se hardcodean; vienen de `TenantLocale` / tenant-profile.

### Criterios de aceptación (DRAFT)
- **AC-1** La sub-tab "Mi cuenta" muestra datos reales del tenant (no placeholder).
- **AC-2** Editar + autosave persiste y sobrevive recarga.
- **AC-3** Validación fiscal country-specific funciona (válido guarda, inválido bloquea).
- **AC-4** Read-only correcto para vertical + para roles no-admin.
- **AC-5** Audit log registra cada cambio.
- **AC-6** Live-verify real en dev-app (write ejercido + efecto + logs).

## § Wireframes (BORRADOR — RONDA 1)

- **Mockup borrador:** `mockups/cuenta.html` (wrapper shell portado verbatim de `_shared.css` + ribbon v1.2 Plataforma activa + N3 Datos·Preferencias·Responsable navegables). Servir: `cd mockups && python3 -m http.server 8888` → `http://localhost:8888/cuenta.html`.
- Átomos reales usados (NO inventados): `.card`/`.card-title`, `.field-row`, `.label`+`input`/`select`, `.chip`/`.chip-primary`/`.chip-warning`, `.subsubtabs-bar`/`.subsubtab-btn`, `.section-header`. Tokens = espejo de `globals.css` (vía `_shared.css`).
- Pendiente RONDA 2: estados (vacío/cargando/error/guardando), validación inline fiscal, microcopy final, mockup FINAL por sub-sub-tab.

## § Dudas resueltas (interrogatorio gate — RONDA 1, ratificado Chris 2026-06-07)

- **Q1 (layout): N3-static** — SubSubTabsBar 3 tabs (Datos · Preferencias · Responsable). No Shadcn Tabs body (anti-pattern Nivel 4).
- **Q2 (sedes): 1 clínica** — sin sección Sedes; multi-sede diferido a story propia.
- **Q3 (campos net-new): fiscal_id + dirección AHORA** (migración idempotente + validador country-specific AR/PE/MX/CL/UY). Idioma → derivado del país.
- **Q4 (DPO): solo referencia** — se muestra + link a Seguridad/Cumplimiento; la edición vive allá.
- **Q5 (idioma): derivado del país, read-only** en MVP (cambio = soporte).

### Pendiente RONDA 1 (antes de FIRMA 1)
- Q6 (batch siguiente): ¿`país` editable o read-only (definido en alta)? El borrador lo asume **read-only** (cambia formato fiscal + compliance). Confirmar.
- Q7: ¿`razón social` (legal) separada de `nombre comercial`? El borrador las separa. Confirmar.
- Q8: ¿`moneda` editable o derivada del país como el idioma? El borrador la deja **editable** (clínica puede facturar en USD). Confirmar.
