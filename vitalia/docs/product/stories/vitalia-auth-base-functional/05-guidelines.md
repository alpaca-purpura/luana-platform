# 05-guidelines.md — vitalia-auth-base-functional

> Patterns required / forbidden + files in scope + skills/rules a cargar por
> `/dev-team` builders. Consume junto a `01-spec.md` + `03-arch-brief.md` + `06-tickets.yaml`.

## § 1 — Skills/rules a cargar PRE-implementación

Cada builder (T-1..T-6) MUST cargar:

| Surface | Skill obligatorio | Rules obligatorias |
|---|---|---|
| T-1 FE middleware | `frontend-expert` | `frontend-fsd.md`, `tenant-isolation.md`, `spanish-text.md` |
| T-2 FE Clerk pages | `frontend-expert`, `claude-api` (Anthropic SDK NO aplica — usar Clerk SDK directo) | `frontend-fsd.md`, `frontend-quality.md`, `spanish-text.md` |
| T-3 FE dashboard | `frontend-expert`, `brand-expert` (design tokens) | `frontend-fsd.md`, `frontend-quality.md`, `spanish-text.md`, `tenant-isolation.md` |
| T-4 BE admin Streamlit | `backend-expert` | `admin-panel.md`, `backend-ddd.md`, `backend-quality.md`, `tenant-isolation.md`, `anti-duplication.md`, `vitalia/.claude/rules/hipaa-lite.md`, `spanish-text.md` |
| T-5 ops deploy | `backend-expert`, `git-manager` | `git-safety.md`, `parallel-safety.md` |
| T-6 Playwright e2e | `playwright-expert` ★ MANDATORY ★ | `e2e-testing.md` |

## § 2 — Files in scope (whitelist — touch ONLY these)

### FE files (T-1, T-2, T-3)

```
NEW:
  vitalia/frontend/src/middleware.ts
  vitalia/frontend/src/app/(dashboard)/layout.tsx              # only if absent
  vitalia/frontend/src/features/dashboard/index.ts
  vitalia/frontend/src/features/dashboard/components/DashboardWelcome.tsx
  vitalia/frontend/src/features/dashboard/components/SliceOneStubsRow.tsx
  vitalia/frontend/src/features/dashboard/api/useDashboardData.ts
  vitalia/frontend/src/features/dashboard/types/DashboardData.ts
  vitalia/frontend/src/features/dashboard/__tests__/DashboardWelcome.test.tsx

EDIT:
  vitalia/frontend/src/app/(auth)/sign-in/page.tsx
  vitalia/frontend/src/app/(auth)/sign-up/page.tsx
  vitalia/frontend/src/app/(dashboard)/page.tsx

DELETE:
  vitalia/frontend/src/app/onboarding/step-1/page.tsx
  vitalia/frontend/src/app/onboarding/step-2/page.tsx
  vitalia/frontend/src/app/onboarding/step-3/page.tsx
  vitalia/frontend/src/app/onboarding/step-1/
  vitalia/frontend/src/app/onboarding/step-2/
  vitalia/frontend/src/app/onboarding/step-3/
```

### BE files (T-4)

```
NEW:
  vitalia/backend/src/modules/vitalia/admin/__init__.py
  vitalia/backend/src/modules/vitalia/admin/app.py
  vitalia/backend/src/modules/vitalia/admin/pages/__init__.py
  vitalia/backend/src/modules/vitalia/admin/pages/tenants.py
  vitalia/backend/src/modules/vitalia/admin/pages/usuarios.py
  vitalia/backend/src/modules/vitalia/admin/modules/__init__.py
  vitalia/backend/src/modules/vitalia/admin/modules/tenants.py
  vitalia/backend/src/modules/vitalia/admin/modules/users.py
  vitalia/backend/src/modules/vitalia/admin/_shared/__init__.py
  vitalia/backend/src/modules/vitalia/admin/_shared/auth.py
  vitalia/backend/src/modules/vitalia/admin/_shared/db.py
  vitalia/backend/tests/admin/__init__.py
  vitalia/backend/tests/admin/test_admin_contract.py

EDIT:
  vitalia/backend/pyproject.toml          # add streamlit + passlib + clerk-backend-api deps
```

### Ops files (T-5)

```
NEW:
  vitalia/deploy/Dockerfile.admin
  vitalia/deploy/k8s/admin-deployment.yaml
  vitalia/deploy/k8s/admin-service.yaml
  vitalia/deploy/k8s/admin-ingress.yaml

EDIT:
  vitalia/deploy/k8s/secrets.template.yaml     # add VITALIA_ADMIN_PASSWORD_HASH
  vitalia/.env.dev.template                    # add VITALIA_ADMIN_PASSWORD_HASH
```

### Tests files (T-6)

```
NEW:
  vitalia/frontend/e2e/auth/sign-in-redirect.spec.ts
  vitalia/frontend/e2e/auth/sign-in-form.spec.ts
  vitalia/frontend/e2e/dashboard/welcome.spec.ts
  vitalia/frontend/e2e/admin/tenants-users.spec.ts
```

### Out of scope — DO NOT TOUCH

- `core/luana-core-*/**` — engine, requires `/pm-luana` promotion gate (per `.claude/rules/anti-duplication.md` + `auditor-downstream-regression.md`)
- `nicolify/**`, `comunify/**`, `lupulo/**` — other brands
- `vitalia/backend/src/modules/vitalia/{copilot,sales_agent,agentic}/**` — `builder-agentic` jurisdiction
- `vitalia/frontend/src/app/(dashboard)/{offers,bookings,appointments,patients,treatments,brand-studio,medical-compliance}/**` — defer a Slice 1 stories
- `vitalia/backend/src/modules/vitalia/{iam,api,application,connections,crm,compliance,infrastructure}/**` excepto si T-4 admin requiere read-only via session factory shared

## § 3 — Patterns REQUIRED

### Patrón P1 — Clerk middleware shape

Single source per Clerk Next.js 16 docs: `clerkMiddleware` con `createRouteMatcher`
para públicas, `auth.protect()` para resto. NO redirect manual, NO chequeo RBAC en
middleware (defer).

Matcher config DEBE excluir `_next` + static assets per Clerk recipe oficial.

### Patrón P2 — Admin Streamlit registry-based

Per `.claude/rules/admin-panel.md`:
- Single `st.set_page_config` en `app.py`
- `st.navigation` con lista `PageSpec` dataclass
- Cada page `pages/{slug}.py` = wrapper thin que llama `modules.{name}.render_*()`
- Lógica vive SOLO en `modules/`
- Shared utilities en `_shared/`

### Patrón P3 — Tenant UUID determinista

Per `seed_fixture_clinics.py`:

```python
_FIXTURE_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # UUID_NAMESPACE_URL

def admin_tenant_id(clinic_slug: str) -> uuid.UUID:
    seed = f"vitalia:admin:tenant:{clinic_slug}"
    return uuid.uuid5(_FIXTURE_NAMESPACE, seed)
```

Mismo namespace + diferente seed string (`vitalia:admin:tenant:` vs
`vitalia:fixture:clinic:`) → tenants admin no colisionan con fixtures.

### Patrón P4 — Audit log mandatory cada admin action

Per `vitalia/.claude/rules/hipaa-lite.md` § audit log:

```python
from src.modules.vitalia.compliance.audit import log_admin_action

log_admin_action(
    action="admin.tenant.create",  # o "admin.user.create"
    resource_type="tenant",
    resource_id=str(tenant_id),
    actor="super-admin",
    payload_redacted={"clinic_name": clinic_name, "country": country},  # no PHI
)
```

Sync write antes response. NO fire-and-forget.

### Patrón P5 — Dashboard Server Component default

Per `.claude/rules/frontend-fsd.md`:
- `DashboardPage` (`app/(dashboard)/page.tsx`) = Server Component
- `DashboardWelcome` = Server Component si solo fetch + render
- `"use client"` SOLO si requiere hooks (useState, eventos)
- React Query hook `useDashboardData` SOLO si necesita refetch cliente (sino server fetch directo)

### Patrón P6 — Spanish neutro LatAm

Per `.claude/rules/spanish-text.md`:
- Tuteo, no voseo
- Tildes + ¿/¡ obligatorios
- Microcopy exact match `01-spec.md § 5`

### Patrón P7 — Anti-duplication cross-brand

Admin Streamlit Vitalia espejea PATTERN nicolify (estructura) PERO reescribe código
brand-specific. NO copy-paste:
- Tenants/users entities tienen schema DB distinto (Vitalia tiene clinic_id + medical_vertical, Nicolify no).
- Validator `nf-anti-duplication-scan` enforza diff ≥ 50 lines vs nicolify.

Si pattern admin (app.py + st.navigation + _shared/auth.py + contract test) es genuinamente
compartible cross-brand → flagear como promotion candidate `/pm-luana` POST-story
(no en este story).

## § 4 — Anti-patterns PROHIBIDOS

### A1 — Scope creep admin Streamlit

❌ Agregar pages adicionales (calendario, planes-billing, costo-agentes, etc.) "porque ya estás en el admin".

✅ Solo `tenants.py` + `usuarios.py`. Otras pages = story propia futura.

### A2 — Implementar offers/bookings/etc en este story

❌ "Ya que tocás dashboard, implementemos también offers tabla".

✅ Esas son stories Slice 1 separadas (`vitalia-slice-1-{inbox,pipeline,agenda,fidelizacion,marketing}`). Mantener placeholders como están.

### A3 — Modificar engine `core/luana-core-*/`

❌ Cualquier edit a engine packages.

✅ Si necesitás cambiar engine → ESCALATE `/pm-luana` con promotion proposal. Story PARK hasta resolver.

### A4 — Cross-brand import

❌ `from nicolify.backend.src.modules.nicolify.admin.modules.tenants import ...`

✅ Reescribir código brand-specific Vitalia. Inspirarse en pattern pero no importar.

### A5 — `git add .` / `git add -A`

❌ Stage masivo durante implementación.

✅ `git add <path/exact>` por archivo. Per `.claude/rules/git-safety.md` + `parallel-safety.md`.

### A6 — Saltar Playwright live

❌ "Tests unit pasan, declaramos PASS sin Playwright real".

✅ T-6 obligatorio. Yo (`/pm-vitalia`) ejecuto Playwright LIVE contra `dev-app.vitalialat.com` ANTES de declarar story done.

### A7 — PHI en admin Streamlit

❌ Mostrar `diagnosis`, `treatment_plan`, `medical_notes`, fechas tratamiento, etc., en pages admin.

✅ Solo identity fields (tenant_id, clinic_name, country, plan_tier, user email, user role). Per `vitalia/.claude/rules/hipaa-lite.md` § PHI fields.

### A8 — Hardcodear admin password

❌ `if password == "admin123": ...`

✅ `bcrypt.verify(password, os.environ["VITALIA_ADMIN_PASSWORD_HASH"])`. Hash en K8s secret.

### A9 — Voseo en UI

❌ "Configura tu clínica", "Haz clic acá", "Ingresa tu email"

✅ "Configura tu clínica", "Haz clic aquí", "Ingresa tu email"

### A10 — Skip middleware test edge case `/api/v1/vitalia/webhooks/clerk`

❌ Middleware protege webhook → Clerk POST falla → user.created event perdido → no profile created.

✅ Webhook route EXPLÍCITAMENTE en `isPublicRoute` matcher.

### A11 — Reimplementar tenant_id generation random

❌ `tenant_id = uuid.uuid4()` para admin tenants.

✅ UUIDv5 determinista (P3). Re-creación idempotente.

### A12 — Olvidar reload K8s secrets post update

❌ `kubectl apply secrets` sin restart deployment → secret nueva no carga.

✅ Post `kubectl apply secrets` → `kubectl rollout restart deployment/vitalia-{backend,admin,frontend}` para forzar reload.

## § 5 — Test invariants

- ALL tests pass NATIVE Linux (host) — NUNCA `make e2e*` Docker (crashea per `playwright-expert`).
- BE venv = `$WS/.venv/bin/{ruff,pytest}` desde workspace root.
- FE = `cd vitalia/frontend && npx {tsc,eslint,vitest,playwright}`.
- Playwright LIVE = `E2E_BASE_URL=https://dev-app.vitalialat.com` (no localhost).

## § 6 — Decisions honored (cite in commit body)

Cada commit body MUST incluir sección "Decisions honored" citando D# de `01-spec.md § 8`
que aplica al ticket. Ej:

```
feat(vitalia/admin): T-4 admin Streamlit tenants + users scope mínimo

## Decisions honored
- D2 — Admin Streamlit scope SOLO tenants + usuarios (no scope creep)
- D3 — No traer otras pages Nicolify (anti scope creep)
- D7 — Container K8s separado (Dockerfile.admin + admin-deployment.yaml en T-5)
- D8 — Super-admin auth basic auth bcrypt

## Anti-duplication
- Pattern espejado de nicolify/admin (st.navigation registry + pages/modules split)
- Código brand-specific reescrito (diff ≥ 50 lines vs nicolify tenants.py + users.py)
```

Auditor Cat 11 (Cross-cutting) verifica cite presence.
