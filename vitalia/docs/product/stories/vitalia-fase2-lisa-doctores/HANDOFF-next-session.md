<!-- voseo-allowed: prompt interno de handoff para la próxima sesión (voz de Chris / instrucción a Claude), NO es string user-facing -->

# Handoff — próxima sesión de cierre Vitalia (continúa 2026-06-01)

> Pegá el bloque de abajo (entre las líneas `═══`) como prompt de la próxima sesión.

═══════════════════════════════════════════════════════════════════════════════

/pm-vitalia Continúo la sesión de cierre de Vitalia (handoff 2026-06-01, parte 2). Objetivo: CERRAR LO QUE QUEDA SIN PERDER NADA. Sos /pm-vitalia + /pm-luana según corresponda. Worktree ~/Proyectos/luana-vitalia (branch wip/vitalia, CANÓNICO vitalia, single operator = yo en otra terminal).

═══ ESTADO GIT EXACTO (verificalo primero) ═══
- wip/vitalia @ 14af22b2 (pusheado). Incluye TODO lo de la sesión 1: dual-mount fix (done) + remediación sistémica tenant-resolution no-clerk-org (done) + keystone doctores BE/FE.
- origin/main @ 75b43824 (INTACTO — nunca se pusheó squash).
- ★ ~/Proyectos/luana-platform (main local) tiene un squash STALE @ 63b3adf1 (de ANTES de todo). NO lo pushees. Para Pendiente C: `git -C ~/Proyectos/luana-platform reset --hard origin/main` → re-squashear FRESCO desde wip actual → full gate → push.

═══ YA CERRADO EN SESIÓN 1 (no rehacer) ═══
- ✅ vitalia-shell-dual-mount-a11y-fix → DONE + archivado (merge c9d2bd31). single-main+single-slot, live-verified.
- ✅ vitalia-fe-tenant-resolution-no-clerk-org → DONE + archivado (merge 14af22b2). EMERGENTE: el FE resolvía tenant_id desde useAuth().orgId (Clerk Org, org_ no-UUID) en 35 archivos → 500 en todo PHI; oculto por e2e mockeado. Fix: useTenantId() + 33 archivos + AuditedSection(audit PHI)+useTenantLocale + arch-test endurecido + BORRÉ la Clerk org drift. Live-verified (X-Tenant-ID=UUID, API_5XX=[], doctors 500→200). Restauró [[no-clerk-organizations]].

═══ GUARDRAILS (duros) ═══
- NUNCA git pull / push --force / git add . / commit --no-verify. Commit por pathspec (índice compartido).
- Gates HARD se ARREGLAN, no se bypassean. SCOPE_GATE_SKIP=1 / CAP_ADVISORY_SKIP=1 SOLO en sync wip↔main documentado.
- ★ Verificación REAL ≠ "HTTP 200": ejercer la acción real (writes) + leer logs/DOM + confirmar efecto. e2e que mockea ≠ verde real. (Lección reforzada en sesión 1: el mock FE-wide ocultó un 500 sistémico.)
- ★ NO Clerk Organizations: tenants/clinics son NUESTROS (luana-core-iam). NUNCA useAuth().orgId / useOrganization para tenant. Usar useTenantId()/useClinicId() (leen public_metadata). Borré la Clerk org; onboarding aún la LEE (follow-up menor, no recrea).
- ★ DoD live (ADR-vitalia-008): ninguna story user-reachable a `done` sin dev_app_verified.evidence (acción real + efecto). Chrome MCP no estaba conectado en sesión 1 → fallback Playwright-autenticado-live (válido). Stack vitalia YA está up (FE:3002, BE:8002, dr.demo@vitalialat.com, CLERK_TESTING_TOKEN_VITALIA + E2E_CLERK_USER_* en vitalia/.env.dev, E2E_TENANT_ID=e69a691d-070e-5caf-a053-6e74642ec100). Footgun: el frontend container bind-montea ESTE worktree (verificado) — re-`make dev-vitalia` desde acá si dudás.
- Si un full-gate frena por deuda nueva → REPORTÁ, no fuerces.

═══ PENDIENTE B — cerrar doctores (state=developing, ya DESBLOQUEADA) ═══
Story vitalia-fase2-lisa-doctores. Su resolución tenant+clinic ya está fixed (sesión 1: staff.ts+useClinicId). Leé su checkpoint.md + T-HARNESS-result.md + chris-input.md. Pasos:
  (a) Re-verificar live: navegar autenticado a /{tenant}/lisa/staff → ¿carga? DB real tiene **0 doctores seedeados** (los "3 seed" del T-HARNESS eran del harness MOCKEADO). Decidir con Chris: seedear 2-3 doctores reales en vitalia_doctors (tenant e69a691d, clinic_id=f035be5b-0ac4-5210-8fc3-395650ca2b83) Y/O verificar empty-state + ejercer el WRITE real (crear doctor → 201 + fila DB + audit). El write real es la evidencia DoD más fuerte.
  (b) Quitar workaround `.filter({visible:true})` de POMs: DoctorWorkspacePage.ts + AvailabilityCalendarPage.ts + ShellLayoutPage.ts (StaffDirectoryPage ya). El dual-mount fixed → el slot resuelve a 1.
  (c) ⚠️ Reubicar visual goldens V-VIS-1..4 (de staff-large-dataset.spec.ts) a project=visual — REQUIERE RATIFICACIÓN CHRIS (ADR-vitalia-003). NO autonomous.
  (d) Fix medición perf: POM searchFor tiene waitForTimeout(500) debounce → assert <500ms imposible por diseño (arreglar la medición, no el threshold).
  (e) Flujos profundos workspace/calendar (SC-1/1b/1c/1d/3/3b) + i18n credencial AR/MX/CL (label-por-país).
  (f) GREEN-real → llenar dev_app_verified.evidence + flip cap clinics/lisa-doctores.yaml de status:partial→live (setear date_introduced/created_date + anclar e2e_test reales en scenarios) + /auditor re-verifica → merge reviewing→done (quitar defer_audit que ya está false; archivar).
Encadená /dev-team (b,d,e) → ratificar (c) con Chris → /auditor → /pm-vitalia merge.

═══ PENDIENTE C — push squash a main (cuando B y/o quieras integrar) ═══
1. git -C ~/Proyectos/luana-platform reset --hard origin/main (descartar squash stale 63b3adf1).
2. Arreglar 2 findings que frenan full-gate (NO bypassear):
   - ci-parity ROTO: vitalia/backend/Dockerfile + nicolify/backend/Dockerfile sin stage `test` → ci-parity.sh falla "target stage test could not be found". Agregar stage test o arreglar script.
   - Deuda HIPAA pre-existente: vitalia/backend/.../migrations/021_slice1_re_engagement_events.py:46 `notes TEXT` debe ser BYTEA + encryption trigger. Arch test test_pgcrypto_phi_columns falla. Pre-existente en main (slice re-engagement).
3. git -C ~/Proyectos/luana-platform merge --squash wip/vitalia → commit pathspec (pre-commit FULL) → make ci-parity → si VERDE git push origin main → sync back a wip.

═══ PENDIENTE D — findings cross-brand (/pm-luana, no bloqueante) ═══
- nicolify portó símbolos del shell de vitalia (SubTabMeta, extractSubtabFromPath) sin renombrar → arch test vitalia test-no-cross-brand-shell-mirror falla (4 matches en nicolify, pre-existente en origin/main, ~23 vitest fails relacionados). Decidir: renombrar en nicolify, o aceptar el port + ajustar el arch test.
- Deuda nicolify-r0: 6 stories sin chris-input.md + archivos sin header # cap: (propiedad /pm-nicolify).

═══ FOLLOW-UP MENOR (documentado, no bloqueante) ═══
- features/onboarding/* (wizard, use-wizard-onboarding-state.ts) + useSignOutCleanup.ts aún LEEN Clerk org (READ, degrada a null; NO crean orgs → mi deleción holds). Migrar a tenant-resolution nuestra cierra no-clerk-orgs al 100%. Están en allowlist shrink-only del arch test. Owner: story onboarding o /pm-luana. Doc: vitalia/docs/observed-bugs/2026-06-01-fe-tenant-id-from-clerk-org-systemic.md.

═══ ORDEN SUGERIDO ═══
1º Pendiente B (doctores → done) — incluye decisión seed vs empty+write + ratificación visual goldens.
2º Pendiente C (push squash a main, tras arreglar los 2 findings).
3º Pendiente D (cleanup cross-brand /pm-luana).

Leé al arrancar: memorias no-clerk-organizations, dod-live-verify, verification-real-not-200 + vitalia/docs/product/stories/vitalia-fase2-lisa-doctores/{checkpoint.md, T-HARNESS-result.md, chris-input.md} + vitalia/docs/observed-bugs/2026-06-01-*.md + vitalia/docs/learnings/2026-06-01-fe-tenant-from-clerk-org-systemic.md.

═══════════════════════════════════════════════════════════════════════════════
