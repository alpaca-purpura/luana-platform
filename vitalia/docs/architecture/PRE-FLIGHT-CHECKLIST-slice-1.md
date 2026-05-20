---
created_at: 2026-05-20
created_by: /pm-vitalia (ratified Chris 2026-05-20 sesión replan Slice 1)
status: open
purpose: |
  Pre-flight gates HARD BLOCK antes de arrancar Ola 1 Slice 1 vitalia.
  Cada item debe estar checked y verificado para entrar a /architect refresh.
  Ratified Chris: Opción A — bloquear hasta verde.
---

# PRE-FLIGHT CHECKLIST — Slice 1 vitalia

> Hard block antes de Ola 1 (`/inbox` + `/fidelización`). Sin estos en verde,
> `/architect` NO refresha stories y `/dev-team` NO arranca build.

## § Bloque A — Clerk dashboard (manual Chris)

Clerk instance: `moral-gator-27.clerk.accounts.dev` (test).

- [ ] **A.1** — Habilitar Organizations feature en Clerk dashboard.
  Pasos:
  1. Login Clerk dashboard (https://dashboard.clerk.com)
  2. Seleccionar instance `moral-gator-27`
  3. Navigation → User & Authentication → Organizations
  4. Toggle "Enable organizations" → ON
  5. Save changes

  Verify: `curl -H "Authorization: Bearer $CLERK_SECRET_KEY" https://api.clerk.com/v1/organizations?limit=1`
  retorna 200 con `[]` (no `organization_not_enabled_in_instance` error).

- [ ] **A.2** — Generar testing token fresco si el actual expiró.
  Current: `CLERK_TESTING_TOKEN_VITALIA=1779166200-U2unS5MYsyTOGnFGxaS0lsTDuh-eNafxtE7Hwpnce3E`
  Verify expiry: Clerk dashboard → Testing → Tokens → expiry date.
  Si <30 días → regenerar y reemplazar en `vitalia/.env.dev`.

## § Bloque B — Test users + organization (vía Clerk CLI)

> Usar pattern `clerk-cli-automation-pattern` (memoria reference) — automatizable via `npx clerk` tras `clerk auth login` 1 vez.

- [ ] **B.1** — Crear 3 test users:
  ```bash
  # Test user #1 — owner+doctor
  npx clerk users create \
    --email dr.demo@vitalia.test \
    --password "DrDemo2026!" \
    --first-name "Dr. Demo" \
    --last-name "Vitalia" \
    --public-metadata '{"vitalia_role":"doctor"}'

  # Test user #2 — recepción
  npx clerk users create \
    --email recepcion@vitalia.test \
    --password "Recepcion2026!" \
    --first-name "Recepción" \
    --last-name "Demo" \
    --public-metadata '{"vitalia_role":"recepcion"}'

  # Test user #3 — super_admin
  npx clerk users create \
    --email admin@vitalia.test \
    --password "AdminVit2026!" \
    --first-name "Admin" \
    --last-name "Demo" \
    --public-metadata '{"vitalia_role":"super_admin"}'
  ```

  Verify: `curl -H "Authorization: Bearer $CLERK_SECRET_KEY" https://api.clerk.com/v1/users` retorna 3 users.

- [ ] **B.2** — Crear test organization:
  ```bash
  npx clerk organizations create \
    --name "Clínica Demo Vitalia" \
    --slug "clinica-demo-vitalia" \
    --public-metadata '{"vertical":"medical","country":"PE","plan_tier":"clinic"}'
  ```

- [ ] **B.3** — Add users to organization con roles:
  ```bash
  # dr.demo + admin como org admin
  npx clerk organizations add-member <ORG_ID> dr.demo@vitalia.test --role org:admin
  npx clerk organizations add-member <ORG_ID> admin@vitalia.test --role org:admin
  # recepcion como member
  npx clerk organizations add-member <ORG_ID> recepcion@vitalia.test --role org:member
  ```

- [ ] **B.4** — Crear tenant + clinic_branch en vitalia DB matching Clerk org_id:
  ```bash
  docker exec -it luana-dev-vitalia_backend_dev-1 bash -c "
    cd /workspace/vitalia/backend && uv run python -m scripts.seed_demo_tenant \
      --clerk-org-id <ORG_ID> \
      --clinic-name 'Clínica Demo Vitalia' \
      --vertical medical \
      --country PE
  "
  ```
  (Si script no existe, crearlo en proceso T-preflight-1.)

## § Bloque C — Playwright storage state

- [ ] **C.1** — Asegurar `vitalia/frontend/playwright/.clerk/` existe:
  ```bash
  mkdir -p vitalia/frontend/playwright/.clerk
  ```

- [ ] **C.2** — Generar storage state via Playwright auth fixture:
  ```bash
  cd vitalia/frontend
  E2E_BASE_URL=http://localhost:3002 \
  E2E_USER_EMAIL=dr.demo@vitalia.test \
  E2E_USER_PASSWORD="DrDemo2026!" \
  npx playwright test --grep "@auth-setup" --project=smoke
  ```

  Verify: `vitalia/frontend/playwright/.clerk/user.json` existe + contiene token Clerk válido + cookie session.

- [ ] **C.3** — Verify freshness: token Clerk dentro de TTL 5 días. Si >4 días → re-run C.2.

## § Bloque D — Suite smoke verification

- [ ] **D.1** — Local smoke suite 23 specs GREEN:
  ```bash
  cd vitalia/frontend
  E2E_BASE_URL=http://localhost:3002 npx playwright test --project=smoke
  ```
  Verify: All 23 specs PASS, 0 RED, 0 SKIP (excepto si tienen `test.skip` documentado).

- [ ] **D.2** — Live smoke suite 23 specs GREEN:
  ```bash
  cd vitalia/frontend
  E2E_BASE_URL=https://dev-app.vitalialat.com npx playwright test --project=smoke
  ```
  Verify: All 23 specs PASS contra live deploy.

- [ ] **D.3** — Mobile smoke GREEN:
  ```bash
  cd vitalia/frontend
  E2E_BASE_URL=https://dev-app.vitalialat.com npx playwright test --project=mobile
  ```

- [ ] **D.4** — A11y smoke critical+serious cero:
  ```bash
  cd vitalia/frontend
  npx playwright test e2e/a11y/a11y-smoke.spec.ts
  ```

## § Bloque E — Core promotion lift (paralelo a D)

- [ ] **E.1** — `/pm-vitalia` ping `/pm-luana` con draft `PROPOSAL-DRAFT-core-platform-extensions-slice-1.md`.
- [ ] **E.2** — `/pm-luana` crea proposal real en `docs/promotion-protocol/proposals/2026-05-20-core-platform-extensions-slice-1.md`.
- [ ] **E.3** — Engine implementation:
  - `core/luana-core-platform/src/luana_core_platform/workers/cron_envelope.py` + tests
  - `core/luana-core-platform/src/luana_core_platform/repositories/compound_scope_repository.py` + tests
- [ ] **E.4** — Version bump 0.2.0 → 0.3.0 + CHANGELOG entry.
- [ ] **E.5** — Vitalia consumer refactor 11 callers (imports + constructor changes).
- [ ] **E.6** — Engine + vitalia full test suite GREEN.
- [ ] **E.7** — Proposal state migrated.

## § Bloque F — Admin Streamlit bugs handoff cleanup

Reference: `vitalia/docs/archive/2026/stories/vitalia-auth-base-functional/HANDOFF-next-session.md`.

- [x] **F.1** Bug #1 (`$` literal en `.env.dev`) — FIXED en sesión origen
- [x] **F.2** Bug #2 (`Settings` 14 vars) — MITIGATED via container exec
- [x] **F.3** Bug #3 (puerto 8501 no exposed) — WORKAROUND TCP forwarder activo
- [x] **F.4** Bug #4 (phantom `vitalia_clinics`) — RESUELTO (migration 023 crea `vitalia_clinic_branches` real)
- [ ] **F.5** Bug #5 (Redis container DNS) — no crítico para Slice 1 UI. Decisión Chris: ¿Vitalia necesita Redis en Slice 1 (caching agenda views o tools_sheet read-only)? Si sí, agregar a `vitalia/docker-compose.dev.yml`.

## § Bloque G — Smoke vitalia stack actual (sanity check)

- [x] **G.1** Stack vitalia 8002 BE /health 200 — VERIFIED 2026-05-20
- [x] **G.2** FE 3002 /sign-in 200 — VERIFIED 2026-05-20
- [x] **G.3** Postgres 5435 vitalia_dev alembic head=023 — VERIFIED 2026-05-20
- [x] **G.4** Cloudflared tunnel dev-app.vitalialat.com — VERIFIED 2026-05-20

## § Exit criteria → Ola 1 unlock

Todos los items § A + § B + § C + § D + § E + § F.5 (decisión) deben estar [x].
Cuando todos verde → `/pm-vitalia` actualiza brand checkpoint con `preflight_gates: GREEN` y dispara `/architect refresh vitalia-slice-1-inbox` + `/architect refresh vitalia-slice-1-fidelizacion` en paralelo.
