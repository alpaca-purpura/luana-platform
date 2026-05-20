---
brand: comunify
vertical: "Creator Economy + Educación"
status: shipped
last_updated: 2026-05-20
active_outcomes:
  - dev-stack-cross-brand-fixes              # outcome platform — comunify cerró su milestone 2026-05-17 (Playwright smoke 3/3 GREEN); outcome continúa active hasta nicolify + lupulo cierren sus análogos
active_stories: []   # all stories shipped post 2026-05-20
ssot_owner: /pm-comunify
---

# Comunify — checkpoint

> Estado actual del brand. Actualizado por `/pm-comunify` en cada transición.

## Estado funcional shipped (2026-05-16 inventory)

Story 12 (`luana-comunify-bootstrap`, mergeada 2026-05-15) shipped **17 capabilities en 11 módulos** — backend completo + frontend dashboard + 4-step onboarding wizard + voice cloning pipeline (D8 ON, NEW vs Vitalia) + 3 fixtures LATAM creator (Anabella AR / Trini CL / Pablo MX) + community moderation rails + recurring subscriptions + Dunning workflow embedded. Ver `comunify/docs/product/capabilities/` para detalle por módulo.

**Test coverage:** 102 backend tests (15 unit + 12 integration + 9 architecture + 3 infrastructure + 6 e2e + 55 agentic_evals — workflows + tools + smoke + voice_cloning + kb_pack + cache + cost_budget + compliance).

**Plan tiers activos:** creator (29 USD) · pro (99 USD) · agency (299 USD) — D20 cement.

**Distintivos vs Vitalia:**
- `voice_cloning_enabled: true` (D8 — pipeline 4-wave distillation 50+ chats → CompiledVoice v2)
- `compliance_level: creator_economy` (D7 — NO hipaa_lite vs Vitalia)
- Auto-approve signup (vs Vitalia clinic `pending_review`)
- 4-level offer ladder explícito (lead_magnet → tripwire → core → premium) vs Vitalia preset médico
- DunningWorkflow embedded en CohortEnrollmentWorkflow (4-state per D19)
- 4 community moderation rails (spam + nsfw + doxxing + prompt_injection)

**Diferidos a Story 12.bis (per `comunify/config/brand.yaml`):**
- `discord_circle_bridge: false` (Q3=B defer)
- `live_streaming: false`
- `gamification: false`
- `leaderboard: false`
- `multi_account_creator_switcher: false` (Q2=B defer)

## Deudas pendientes (parked: blocked_on_chris)

> Items que requieren acción local de Chris (provisión de assets / configuración env) antes de poder destrabar follow-ups. NO son stories activas — son blockers documentados con instrucciones reproducibles.

### D1 — Aportar `Satoshi-Bold.woff2` (font auténtica)

- **Estado:** parked, blocked_on_chris.
- **Síntoma:** `comunify/frontend/src/app/layout.tsx:8-13` usa `Plus_Jakarta_Sans` como fallback (Path B per D2 spec) porque `comunify/frontend/src/assets/fonts/Satoshi-Bold.woff2` no existe.
- **Impacto:** typográficamente el feel "Kajabi/Jasper" se logra con Plus Jakarta Sans, pero NO es la Satoshi auténtica del brandbook.
- **Acción Chris:** comprar/descargar `Satoshi-Bold.woff2` (Fontshare gratis: https://www.fontshare.com/fonts/satoshi) y colocarlo en `comunify/frontend/src/assets/fonts/Satoshi-Bold.woff2`. También opcional: `Satoshi-Variable.woff2` para weights 400-900.
- **Tras provisión:** abrir story `comunify-provide-satoshi-font` scope XS — revertir `layout.tsx` a `localFont({ src: [...] })` per spec original §2. ≤30 min, sin spec compleja.

### D2 — Configurar `CLERK_TESTING_TOKEN` env local (smoke regression Story 12 inheritance)

- **Estado:** parked, blocked_on_chris.
- **Síntoma:** 18 de 21 Playwright smoke tests fallan en `comunify/frontend/e2e/fixtures/auth.fixture.ts:95` con `CLERK_TESTING_TOKEN not set`. UNCHANGED desde Story 12 bootstrap (no es regresión cement ni tailwind-v4-tokens).
- **Impacto:** smoke E2E suite parcialmente disabled. Validators `visual_smoke_design_system` + `visual_smoke_regression` quedan deferred. CI WIP gates corren los 3 tests que NO requieren Clerk auth.
- **Acción Chris:** generar testing token en Clerk dashboard (https://dashboard.clerk.com/apps/{comunify-app-id}/instances/{dev-instance}/testing) → guardarlo en `comunify/frontend/.env.local` como `CLERK_TESTING_TOKEN=<token>`. NO commitear (`.env.local` gitignored).
- **Tras provisión:** smoke suite passes 21/21 sin code edits. No abrir story — solo update `comunify/docs/product/checkpoint.md` bitácora confirmando.

### Q2/Q3 features diferidos (recomendación: mantener parked)

5 features marcadas en `comunify/config/brand.yaml` como `false` (Q2=B / Q3=B defer per D8 cement Story 12):

| Feature | brand.yaml flag | Demanda observable? | Recomendación |
|---|---|---|---|
| Discord/Circle bridge | `discord_circle_bridge: false` | ⏸ ninguna señal de Chris ni clients | **parked** — abrir story cuando primer creator pida integración |
| Live streaming | `live_streaming: false` | ⏸ ninguna señal | **parked** — postergar hasta tener base usuarios > N |
| Gamification (badges/points) | `gamification: false` | ⏸ ninguna señal | **parked** — añade complejidad sin ROI demostrado en MVP |
| Leaderboard | `leaderboard: false` | ⏸ ninguna señal | **parked** — depende de gamification, se abre juntas |
| Multi-account creator switcher | `multi_account_creator_switcher: false` | ⏸ ninguna señal (Q2=B defer) | **parked** — solo si Chris confirma uso real cross-tenant |

**Rationale:** sin señal de demanda observable, abrir stories para estos features = scope creep. El paradigm v4 dice "Outcome cierra event-driven, no time-driven" — aplica igual a abrir nuevas. `/pm-comunify` no las moverá a `state: idea` salvo que Chris explicite.

## Bitácora

- 2026-05-20 PM: **`comunify-design-system-a11y-contrast-cement` MERGED (reviewing→done) + archived** (`/pm-comunify` autonomous full ciclo end-to-end ratificado Chris "continúa hasta done"). Trabajo cerrado:
  - **Build:** 4 tickets sequential T-1 → T-4 (foundation tokens → arch fitness RED → Camino B sweep → Playwright + axe)
  - **Audit:** auditor-frontend Opus verdict APPROVED single-iter (audit_iterations:1, self_fix_iter:0, spawned_dev_team:false, escalated_to_chris:false). 1 informational T-4-F1 (live E2E deferred) non-blocking.
  - **Capability NEW:** `comunify/docs/product/capabilities/frontend_design_system/a11y-contrast-cement.yaml` (status: live, package_version: 0.3.0)
  - **Module MD refreshed:** `comunify/docs/product/modules/frontend_design_system.md` auto-list ahora con 3 caps (cement v0.2.0 + tailwind-v4-tokens v0.2.1 + a11y-contrast-cement v0.3.0)
  - **07-merge.md** 5 secciones canónicas escritas (gherkin matrix · Playwright run · capabilities · modules · how to verify reproducible)
  - **Tokens cementados:** 5 nuevos `*-text` (warning/stable/accent/critical/blue) — HSL principales del brandbook intactos
  - **Camino B universal:** outline pattern `bg-X/10 border border-X text-X-text hover:bg-X/20` aplicado en moderation card + dunning banner + 5 archivos badge sweep
  - **Arch fitness híbrido opción C:** 6 patterns HARD-blocked (warning/stable/accent), critical/blue libres
  - **Pares WCAG AA failed:** 10 → 0 en componentes shipped
  - **Capabilities count:** 19 → 20 · módulos: 12 (frontend_design_system ahora con 3 caps)
  - Story archivada: `comunify/docs/product/stories/comunify-design-system-a11y-contrast-cement/` → `comunify/docs/archive/2026/stories/` (snapshot inmutable per R2)
  - **Promotable candidates pingeados a `/pm-luana`** (append a INDEX-promotables.md): Camino B universal pattern + arch fitness anti-low-contrast + chrome-devtools-verify deprecated Linux (4to ciclo consecutivo)

- 2026-05-20 PM: **`comunify-design-system-a11y-contrast-cement` (ex `comunify-warning-token-contrast-fix`) state refining→refined** (autonomous /po-ux 3-batch loop ratificada Chris "Apruebo todo continúa hasta done"). Trabajo cerrado:
  - **Scope expandido cementado:** ex 1-token fix → 10 pares WCAG AA failed (6 críticos + 4 marginales) + cementado pares canónicos + arch fitness anti-regresión.
  - **Audit técnico:** 22 pares color calculados con WCAG formula (`/tmp/wcag_audit.py`), 10 failed AA. Optimal HSL para `*-text` tokens calculados (`/tmp/find_text_hsl.py`).
  - **Decisión técnica refinada (Opt C "a tu criterio"):** mantener HSL principales del brandbook intactos (warning #F5B700, stable #16C784, accent #FF5F6D) + introducir 5 tokens `*-text` (lightness 28-52%) para foreground sobre light bg. NO oscurecer principal palette — paleta logo respetada.
  - **Camino B universal:** outline pattern (`bg-{X}/10 border border-{X} text-{X}-text hover:bg-{X}/20`) en botones moderation card + dunning banner.
  - **Arch fitness híbrido opción C:** blockea 6 patrones HARD (warning/stable/accent con text-white o `text-X` sobre bg-bg), critical y blue libres.
  - **Slug renombrado:** `git mv comunify-warning-token-contrast-fix → comunify-design-system-a11y-contrast-cement`. Old slug supersedes en frontmatter.
  - **01-spec.md unificado escrito:** 4 scenarios base (happy/negative/edge/adversarial) + sub-categoría a11y cubierta + 6 not_applicable declaradas + wireframes ASCII antes/después + estados visuales + graders 4 tipos (e2e + axe + arch_fitness + visual_state).
  - **Scope final:** 10 archivos (3 SSoT + 6 componentes + 2 arch test), ~190 LOC added / ~25 modified, 0 componentes nuevos.
  - Next: `/architect <brand>: comunify` produce ready package (03-arch + 04-validators + 05-guidelines + 06-tickets). State refined→ready al cerrar.

- 2026-05-20: **Pendientes consolidados + 3 learnings promotable=yes pingeados a `/pm-luana`** (autonomous /pm-comunify cleanup post Chris ratifying "cerremos todos los pendientes, autónomo primero"). Trabajo cerrado:
  - INDEX-promotables.md escrito (`comunify/docs/learnings/INDEX-promotables.md`) — pointer queue para `/pm-luana` Modo Core Engineering. 3 learnings listados: tailwind-v4-postcss-wiring-gap + named-volume-staleness-post-pyproject-bump + playwright-runner-parity-gap. Meta-recomendación: outcome platform `bootstrap-brand-template-hardening` agrupando los 3 + sweep vitalia + lupulo.
  - Sección "Deudas pendientes (parked: blocked_on_chris)" añadida a este checkpoint — D1 (Satoshi-Bold.woff2) + D2 (CLERK_TESTING_TOKEN). Instrucciones reproducibles documentadas, no requieren story abierta (scope XS y waiting on Chris).
  - Q2/Q3 diferidos (discord/live_streaming/gamification/leaderboard/multi-account-switcher) ratificados parked — sin señal de demanda observable, mantener `false` en `brand.yaml`.
  - Único follow-up activo: `comunify-warning-token-contrast-fix` (state=idea) — handoff `/po-ux` próximo turno para decisión opción A/B/C (recomendación /pm-comunify: opción B `text-comunify-text` 2 archivos, contrast 9.8:1 AAA).

- 2026-05-20: **`comunify-design-system-tailwind-v4-tokens` mergeada (reviewing→done) + archived** (/pm-comunify formal closure, Chris ratificó cierre tras 2-day delay). Trabajo cerrado:
  - Auditor verdict APPROVED 27/27 CHECKPOINTS ✅ (Phase D gherkin matrix 7/7 PASS, SC-01..SC-07) confirmado pre-merge.
  - `07-merge.md` 5 secciones canónicas escritas (gherkin matrix · Playwright run · capabilities · modules · how to verify).
  - Capability **NEW**: `comunify/docs/product/capabilities/frontend_design_system/tailwind-v4-tokens.yaml` (status: live, package_version: 0.2.1, complementario al cement v0.2.0 — separate capability per /pm-comunify judgment).
  - Module MD **NEW**: `comunify/docs/product/modules/frontend_design_system.md` (auto-list 2 caps: design-system-cement + tailwind-v4-tokens). Primera vez que este módulo tiene MD propio (R32 inventory cement post-bootstrap).
  - Learning **NEW** promotable=yes: `comunify/docs/learnings/2026-05-18-tailwind-v4-postcss-wiring-gap.md` — Tailwind v4 PostCSS plugin wiring gap. Ping `/pm-luana` para evaluación lift `_pm-brand-template/` (vitalia tiene mismo gap latente; brands futuras saasora/inmoflow/retailly/fixia/guestly/fitflow deben heredar scaffold completo).
  - Story archivada: `comunify/docs/product/stories/comunify-design-system-tailwind-v4-tokens/` → `comunify/docs/archive/2026/stories/comunify-design-system-tailwind-v4-tokens/` (snapshot inmutable per R2).
  - `comunify-warning-token-contrast-fix` queda como única active story (state=idea, unblocked ahora que tailwind-v4-tokens cerró).
  - Capabilities count: 18 → 19 (módulos: 12 → 12, frontend_design_system ahora tiene 2 caps).
  - Override `STORY_CLOSURE_GATE_SKIP=1` ya no necesario en commits futuros (gate desbloqueado).

- 2026-05-20 (earlier): **Setup Clerk + Cloudflare tunnel funcional para `https://dev-app.comunifyagents.com`** (/pm-comunify autonomous, Chris ratificado). Trabajo cerrado:
  - Tunnel `dev-comunify` (`999f4a24-...`) reusado vía `/cfd_tunnel/{id}/token` endpoint (no recreate). DNS CNAME ya existente.
  - `comunify/.env.dev` escrito con Clerk pk_test_/sk_test_ reales + CLERK_ISSUER derived (`climbing-lioness-56.clerk.accounts.dev`).
  - `comunify/deploy/cloudflared/.credentials/dev-tunnel.json` escrito (gitignored).
  - 5 bugs FE fixed para que Clerk widget renderice (commit `ab54ff9`): faltaba `middleware.ts` (creado, después migrado a `proxy.ts` post sync main), sign-in/sign-up convertidos a catch-all routes `[[...rest]]`, `next.config.ts allowedDevOrigins` para Next 16, removido NEXT_PUBLIC_API_URL hardcode en docker-compose, lockfile drift fixed.
  - Post sync `origin/main` (commit `2773c30`, 135 commits absorbed incluye vitalia Ola 1 + `13d0138` proxy migration): replicado proxy.ts pattern (commit `cb5fcf9`). FE container ya usa `proxy.ts: Xms`, sin warning deprecation.
  - Verified Playwright headless via tunnel: `Clerk.loaded: true, hasIdentifierInput: true, hasContinueButton: true, hasGoogleButton: true, input fillable`.

- 2026-05-18 (later): **`/pm-comunify` autonomous run verifies 3 deferred validators post-cement-merge → DESCUBRE BUG SILENT SHIP** (Chris pre-authorized "arranca de forma autonoma siguiendo tu recomendación"). Trabajo cerrado:
  - **fe_build / smoke regression Clerk env (pre-existing Story 12):** 18 de 21 smoke tests fail con `CLERK_TESTING_TOKEN not set` at `auth.fixture.ts:95`. UNCHANGED desde Story 12 — no es regresión introducida por cement. Candidate separate story para env setup.
  - **visual_smoke_design_system FAIL 3/3** (`design-system.smoke.spec.ts`): font CSS variables not on `<html>` className (espera literal `--font-satoshi`, recibe Next.js Google Fonts CSS-module class names), body `getComputedStyle().backgroundColor` = `rgba(0,0,0,0)` transparent (esperaba `rgb(248,250,252)` = hsl 210 40% 98% = `--comunify-bg`). NOT worktree mount mismatch.
  - **Root cause:** Tailwind v4.1.0 ignora silenciosamente `comunify/frontend/tailwind.config.ts::theme.extend.colors` mappings. Cement story T-1 cargó tokens via legacy config pero v4 requiere `@theme` block en `globals.css` o `@config "../../tailwind.config.ts"` directive. Served CSS bundle (467 líneas) tiene `:root` vars + font modules pero ZERO `.bg-comunify-*` / `.text-comunify-*` / `.font-inter` utility classes generadas. Body HTML aplica `class="bg-comunify-bg ..."` pero no hay regla CSS asociada → bg transparent.
  - **Audit gap descubierto:** vitest 38/38 GREEN no cubre CSS output runtime. Auditor APPROVED cement merge porque visual_smoke quedó deferred. Promotable learning candidate cross-brand.
  - **Story hot-fix opened:** `comunify-design-system-tailwind-v4-tokens` state=idea, hotfix=true, repro_verified=true, scope S (1 archivo `globals.css`, ≤1h estimate). 3 opciones documentadas (A=`@theme`, B=`@config`, C=full v4 migration).
  - **Contrast-fix story BLOQUEADA:** `comunify-warning-token-contrast-fix` parked hasta hot-fix landed (asume `bg-comunify-warning` aplica, actualmente no).
  - **No code edits** (PM jurisdicción). Next: Chris ratifica refinement path o spawnea `/dev-team` autónomo (per `.claude/rules/hotfix-repro-mandatory.md` repro_verified=true permite skip /po-ux + /architect).

- 2026-05-18: **`comunify-design-system-cement` mergeada (idea→done) via /pm-comunify autonomous E2E run** (Chris pre-authorized full close, opción "Solo design-system-cement E2E" + "auto-ratificación full autónomo"). Trabajo cerrado:
  - **Spec** (Conv 1.1): 01-spec.md drafted + auto-ratified (4 Gherkin scenarios happy/negative/edge/adversarial + wireframes inline + token migration map 91 occurrences).
  - **Architect** (Conv 1.2): `architect-orchestrator` Opus → 03-arch.md + 04-validators.yaml (11 validators) + 05-guidelines.md + 06-tickets.yaml (8 tickets T-1..T-5). 8 decisiones D1-D8 documentadas. Brand overlay creator-funnels.md correctamente NO triggered (design system surface ≠ cohort/community/vault/voice).
  - **Build** (Conv 2 — 4 spawns Sonnet): T-1 (foundation: globals.css 15 vars + layout fonts Plus Jakarta Sans fallback per D2 + tailwind extend 16 slots) → T-2 (arch fitness RED baseline, 91 violations) → T-3a/b/c/d (23 archivos migrados: 9 dashboard + 7 features + 6 auth/onboarding/public + 1 utility) → T-4 (Playwright spec creado verbatim, ejecución deferida — worktree mount mismatch) → T-5 (validators bundle, gate-runner Haiku stalled → fallback inline).
  - **Audit** (Conv 3): `auditor-frontend` Opus verdict APPROVED. CHECKPOINTS C1-C5 all PASS (C4 PASS_WITH_NOTES — 1 WARN accesibilidad: `text-white` sobre `bg-comunify-warning` 1.80:1 < AA 4.5:1). 38/38 vitest GREEN, 0 stock palette violations, allowlist `[]` clean ratchet, 0 cross-brand pollution, 0 engine edits.
  - **Capability promovida:** nuevo módulo `frontend_design_system` (primera capability). `comunify/docs/product/capabilities/frontend_design_system/design-system-cement.yaml` (status: live, package_version 0.2.0).
  - **Follow-up story abierta:** `comunify-warning-token-contrast-fix` (state=idea) — fix SSoT `--comunify-warning` HSL para resolver WARN auditor (no bloqueante de merge, scope S = 1 token + ≤2 consumers).
  - **3 validators deferred a Chris post-merge:** `fe_build` (pre-existing Clerk env Story 12), `visual_smoke_design_system` + `visual_smoke_regression` (worktree mount mismatch — fix: post-merge `make dev-down-comunify && make dev-comunify` desde principal).
  - Story archivada: `comunify/docs/product/stories/comunify-design-system-cement/` → `comunify/docs/archive/2026/stories/comunify-design-system-cement/` (19 archivos snapshot inmutable).
  - Capabilities count: 17 → 18 (módulos: 11 → 12).
- 2026-05-17T20:15: **`comunify-dev-stack-functional` mergeada (refining→done)** vía Playwright smoke gate. Trabajo cerrado:
  - Receta vitalia 12 pasos replicada mecánicamente — bugs 1-13 verificados live (alembic 001_comunify head, 17 tables, /health 200 canonical, /sign-in 200 Clerk widget)
  - **Bug 14 nuevo descubierto:** named volume staleness post `comunify/pyproject.toml` bump — `comunify_backend_venv` creado pre-deps fix mantuvo `.venv` vacía → `ModuleNotFoundError: psycopg2`. Fix: `docker volume rm comunify_backend_venv` + rebuild. Learning escrito `comunify/docs/learnings/2026-05-17-named-volume-staleness-post-pyproject-bump.md` (promotable=yes — pattern cross-brand, candidato addendum `docs/process/docker-dev-multibrand.md`).
  - **Bug 15 nuevo descubierto:** Playwright runner gap parity vs nicolify — `comunify/frontend/package.json` declaraba script `test:e2e:smoke` + tenía 5 specs scaffolded pero NUNCA tenía `@playwright/test` en devDeps. Vitalia tiene mismo gap. Fix: add `@playwright/test ^1.59.1` + mirror nicolify 4 scripts pattern. Learning escrito `comunify/docs/learnings/2026-05-17-playwright-runner-parity-gap.md` (promotable=yes — fix-forward sweep candidato vitalia + lupulo bootstrap).
  - Playwright smoke creado `comunify/frontend/e2e/specs/smoke/dev-stack.smoke.spec.ts` (3 tests: BE /health shape + FE /sign-in + FE root). Verbatim: `3 passed (2.5s)`.
  - Merge artifact `comunify/docs/archive/2026/stories/comunify-dev-stack-functional/07-merge.md` con addendum receta cross-brand (paso 13 venv re-population + paso 14 Playwright runner setup).
  - Story archivada `comunify/docs/product/stories/comunify-dev-stack-functional/` → `comunify/docs/archive/2026/stories/comunify-dev-stack-functional/` (snapshot inmutable).
- 2026-05-17: **auditoría harness `/pm-luana` cross-skill override (autorización Chris explícita)** detectó gaps vs vitalia para que /pm-comunify cumpla rol. Trabajo aplicado:
  - SKILL.md `.claude/skills/pm-comunify/SKILL.md` referencias finales actualizadas (creator-funnels.md framework interpretativo + comunify/.claude/rules/README.md + brand.yaml creator_economy semantics)
  - Outcome platform `docs/product/outcomes/dev-stack-cross-brand-fixes.md` promovido state idea→refining + priority MEDIUM→HIGH + consumer_brands explícitos + canonical_recipe link
  - Story spawned: `comunify/docs/product/stories/comunify-dev-stack-functional/` state=refining con checkpoint + 00-research.md (receta canónica vitalia 07-merge.md 12 pasos + diff específico comunify)
  - Dev stack patches aplicados (replica receta vitalia paso 3-10): `comunify/pyproject.toml` deps runtime (uvicorn/fastapi/sqlalchemy/asyncpg/alembic/luana_core_*), `comunify/backend/Dockerfile` (COPY workspace pyproject + `--package luana-comunify` + intro comment block), `comunify/docker-compose.dev.yml` (UV_PROJECT_ENVIRONMENT + cd + alembic upgrade prefix), `comunify/backend/alembic/env.py` (DATABASE_URL priority + asyncpg→psycopg2 swap), `comunify/backend/src/main.py` (/health endpoint + HealthResponse DTO). Pendiente smoke verification live por Chris (`make dev-clean-comunify && make dev-comunify-tunnel && curl 127.0.0.1:8003/health`).
  - BACKLOG regenerado (3 archivos: BACKLOG.md + BACKLOG.yaml + BACKLOG-TLDR.md) — DRIFT cerrado
  - 11 modules docs creados `comunify/docs/product/modules/{m}.md` (agentic/brand_studio/cohorts/copilot/fixtures/iam/offer_studio/onboarding/payment/platform/public_landing) — paridad estructural con vitalia
  - Learning local 2026-05-16 capability-inventory-recovery escrito (referencia cross-brand al vitalia learning promotable=yes)
  - Archive dir `comunify/docs/archive/2026/stories/` creado (necesario cuando primera story brand cierre)
  - Promotion proposal `docs/promotion-protocol/proposals/2026-05-17-auto-regen-backlog-precommit.md` abierta (Section 11 pre-commit auto-regen BACKLOG cuando docs/product/** staged — lift cross-brand)
- 2026-05-15: brand topology bootstrap (F0 reorg multimarca) — Story 12 `luana-comunify-bootstrap` shipped
- 2026-05-16: story abierta `comunify-design-system-cement` state=idea — cementar tokens brandbook (morado/azul/coral/verde + Satoshi/Manrope/Inter) en `tailwind.config.ts` + `globals.css` + `layout.tsx`, migrar ~52 usos de paleta Tailwind stock a tokens `comunify-*` semánticos, arch fitness ratchet anti-stock-palette. SSoT design: `comunify/docs/architecture/design-system.md`. Inventario FE: 56 .tsx, 0 HEX hardcoded (clean slate), slots `--comunify-*` vacíos desde Story 12 (marker `T-fe-3` nunca ejecutado). Next: Chris dice "refinemos" → `/po-ux`.
- 2026-05-16: capability inventory recovery — 17 caps YAMLs escritas en `comunify/docs/product/capabilities/` desde archive (10 caps `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/capabilities/comunify/`) + código vivo (7 caps nuevas detectadas: coaching-offers-preset, creator-onboarding-4step, community-engagement-workflow, cohort-enrollment-workflow, creator-economy-agentic-tools, creator-public-landing, creator-signup-handler). Gap idéntico al detectado en vitalia 2026-05-16 (ver `vitalia/docs/learnings/2026-05-16-capabilities-inventory-gap.md` + promotion proposal aceptada `docs/promotion-protocol/proposals/2026-05-16-capability-inventory-enforcement.md`). Coverage check verde: `.venv/bin/python scripts/reconcile_capabilities.py --require-capabilities-exist --brand comunify` PASS. **Cross-skill override:** ejecutado por `/pm-luana` con autorización explícita Chris (mismo plan que cerró gap nicolify carve-out audit + vitalia learning promotion). Devolución de jurisdicción a `/pm-comunify` para próximas iteraciones.
