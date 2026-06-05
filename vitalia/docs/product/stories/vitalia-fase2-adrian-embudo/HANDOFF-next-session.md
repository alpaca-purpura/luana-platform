# HANDOFF — vitalia-fase2-adrian-embudo → `done` (Session 3 close)

> **Generado 2026-06-04 (sesión 3 de cierre).** Reemplaza el handoff anterior (9-step). El producto está **funcionalmente done + live-verified GENUINO**; lo que falta para `done` está **bloqueado por la polución cross-sesión del hub** (sesión inbox) + tu **demo (`demo_signoff`)**. Pausamos a pedido de Chris para terminar en conversación fresca. **Correr la sesión fresca IDEALMENTE con el hub QUIETO** (embudo única sesión activa, o con la sesión inbox ya aterrizada).

## TL;DR del estado

- **state:** `developed` · `dod_live_verified: true` (GENUINO — T-DEMO-2: board-live.spec 9/9 real backend, POST /crm/leads 201 + `vitalia_leads` 2→3, PATCH /stage 200 + version 1→2 + `vitalia_lead_stage_transition` +1 row, sin traceback).
- **demo-script.md:** completo (4 secciones). **`demo_required: true`** → falta tu firma `demo_signoff`.
- **T-E2E-1 mocked-smoke + visual goldens:** **DEFERRED** (Chris ratificó proceed-on-live-verify). Blocker = overlay del fixture `authed-runtime` (no producto). SSoT del deferral + approach del follow-up: `T-E2E-1-result.md`.
- **`wip/vitalia` HEAD:** `8d8eb88a` (esta sesión). Todo committeado por pathspec.

## Lo que hizo la sesión 3 (commits, todos pusheados a wip/vitalia)

1. `35bd3081` — STOP por colisión multi-sesión (otra sesión cerraba el mismo embudo); stand-down ratificado.
2. *(la sesión paralela cerró los writes: `0e6ac4db` T-DEMO-2 — dod_live_verified=true)*.
3. `e24f7e80` — wip: builder-frontend partial (POMs + window-hook, **stalled @279k**). El builder NO resolvió el overlay del fixture; lo esquivó con un window-hook.
4. `a589cd46` — removí el window-hook prod de `AdrianEmbudoView.tsx` (test-scaffolding no va en prod para una suite deferida).
5. `d41102c3` — `T-E2E-1-result.md` (deferral honesto) + checkpoint `pending: T-E2E-1-deferred` + `next_action` → /auditor sobre live-verify.
6. `92160390` — **fix FSD real del embudo:** `adrian/embudo/page.tsx` importaba `AdrianEmbudoView` por path interno → ahora public API (`@/features/adrian`). `getEmbudoBoardInitialState` queda directo (Server-only, intencional).
7. `8d8eb88a` — chris-input: hallazgo del auditor (gate RED por polución cross-sesión).

## LOS 2 BLOCKERS (ni uno es culpa del producto embudo)

### Blocker 1 — Gate FE determinístico RED por la sesión INBOX (crowded hub)
`/auditor` Step 2 (gate-runner `test-frontend`) → `any_fail=true`. **Atribución precisa:**
- **NO embudo (sesión inbox, `code:inbox`):**
  - 5× `src/features/adrian/components/inbox/__tests__/AdrianInboxView.test.tsx` → `useAuth ... within <ClerkProvider/>` (falta wrapper ClerkProvider en su test setup).
  - 1× `ChannelBadge.test.tsx` ("AdrianInboxView skeleton renders").
  - 1× arch-fitness `test_fsd_boundaries.test.ts` → `AdrianInboxView.tsx imports @/features/crm-shared` (cross-feature inbox, no allowlisted).
  - Comparten el vitest run de `features/adrian/` → **envenenan el gate compartido**.
- **Embudo (su superficie propia está limpia):** sus unit tests pasan (LeadCard ✓ KanbanBoard ✓ OverrideReasonDialog ✓ NewLeadPage ✓ RecuperarView ✓ use-embudo-board ✓ use-frozen-leads ✓). tsc + eslint ✓.
- **1 entry de allowlist pendiente (embudo):** `getEmbudoBoardInitialState` (Server-only) necesita estar en `KNOWN_CROSS_FEATURE_INTERNAL_IMPORTS` de `test_no_cross_feature_imports.test.ts` — **pero ese archivo tiene cambios SIN COMMITEAR de la sesión inbox** (`M` desde el arranque; removieron 2 entries inbox refactorizados). No se puede agregar el entry embudo sin enredar su trabajo.

**Resolución (orden):** (a) la sesión inbox aterriza: arregla sus 6 tests ClerkProvider (wrap con `<ClerkProvider>` o mock), allowlistea/refactoriza su `AdrianInboxView → crm-shared`, y **commitea** `test_no_cross_feature_imports.test.ts`; (b) recién entonces agregar el entry embudo `src/app/[tenantId]/(shell-organism)/adrian/embudo/page.tsx` al `KNOWN_CROSS_FEATURE_INTERNAL_IMPORTS` (justificación: `getEmbudoBoardInitialState` Server-only, no barrel-able); (c) re-correr gate-runner → verde.

### Blocker 2 — demo_signoff (tu gate humano)
`demo_required: true`. Falta que Chris ejerza `demo-script.md` contra dev-app (`https://dev-app.vitalialat.com`, `dr.demo@vitalialat.com`, creds en `vitalia/.env.dev`) y firme `demo_signoff: APPROVED` en checkpoint. Esto además **cubre la cobertura FE-edge deferida** (override/freeze/409/422 ejercidos live por Chris).

## CAMINO A `done` (orden exacto para la sesión fresca)

1. **Verificar hub quieto** + estado: `git log --oneline -6`, `git status --short`, `ls ~/Proyectos/luana-platform/.session-locks/`. Re-adquirir `bash scripts/git/session-lock.sh acquire code:crm dev-team vitalia-fase2-adrian-embudo`.
2. **Resolver Blocker 1** (gate verde) — requiere que la sesión inbox haya aterrizado (sus tests ClerkProvider verdes + `test_no_cross_feature_imports.test.ts` committeado). Si NO aterrizó → coordinar con Chris (no cruzar al lane inbox sin OK). Una vez committeado el arch-test: agregar el entry embudo al allowlist + re-correr `gate-runner test-frontend` → `any_fail=false`.
3. **Cerrar `/auditor`** (con gate verde): spawn `auditor-frontend` (embudo FE) + `auditor-backend` (funnel service/repos), Phase D gherkin-matrix **sobre la verificación REAL** (board-live 9/9 + BE `test_funnel_service` +89 + demo EDGE para 409/422/freeze — la mocked-smoke está deferida, ver `T-E2E-1-result.md` § "Gherkin coverage basis"). Live-verify: correr `board-live.spec.ts` (ejerce los writes reales). `CHECKPOINTS.md` C1-C5.
4. **Avisar a Chris → su demo** (`demo-script.md` contra dev-app) → `demo_signoff: APPROVED` en checkpoint.
5. **`/pm-vitalia merge`** → `07-merge.md` (5 secciones) + cap `crm/adrian-embudo` planned→live (`cap_change_type: new`, scenarios+access+business_rules) + `git mv` story a `vitalia/docs/archive/2026/stories/` (mismo commit) + state `reviewing→done` + `make portfolio`. REFUSE si falta `dod_evidence` (está) / gherkin MISSING / `demo_signoff` no APPROVED.
6. **Follow-up SEPARADO (no bloquea done): T-E2E-1 mocked-smoke + visual goldens.** Fix del overlay del fixture `authed-runtime` (capturar page snapshot, identificar overlay, arreglar el mock que falta — NO window-hook prod) + generar `embudo-visual.spec.ts` baseline (14 PNGs, Chris ratifica). Receta completa en `T-E2E-1-result.md` § "Correct follow-up approach". WIP recuperable en `e24f7e80`.
7. **Harness HB capture** (reflex auto-hardening, sin frenar): ver § siguiente.

## HALLAZGOS HARNESS (capturar como HB en `docs/process/harness-backlog.md`)

- **HB — gate verification incompleto en build:** el embudo pasó su gate "337/337" con una violación FSD real (`page.tsx` internal import) + el arch-test en rojo **sin que el build lo cazara**. El gate del builder corrió vitest unit pero NO falló por el arch-fitness rojo (o no lo corrió). Endurecer: el gate del builder DEBE incluir `vitest run src/__tests__/architecture/` bloqueante.
- **HB — crowded-hub gate pollution:** dos stories (embudo `code:crm`, inbox `code:inbox`) comparten `features/adrian/` + el mismo vitest run + el mismo arch-test file → no se pueden gate-ear independientemente; los tests rotos de una bloquean el audit de la otra. (Recurrencia del patrón HB-31/35; el bucket lock es advisory.)
- **HB-42 (ya existe):** falta contract-test FE↔BE. Relacionado: el overlay del fixture authed-runtime.
- **HB — builder worktree-from-main / 279k stall:** el builder-frontend gastó 279k sin resolver el overlay (fue por el camino equivocado: window-hook en vez de fix del fixture). Considerar guía más ajustada en el prompt.

## Referencias
- `T-E2E-1-result.md` — SSoT del deferral mocked-smoke + approach del follow-up + gherkin coverage basis.
- `T-DEMO2-writes-result.md` — evidencia live-verify de los writes (genuino).
- `checkpoint.md` — frontmatter: state=developed, dod_live_verified=true, dod_evidence, pending=T-E2E-1-deferred.
- `demo-script.md` — guion de tu demo.
- `chris-input.md` — bitácora (tail = hallazgo auditor).

## Bootstrap (correr en la sesión fresca, hub idealmente quieto)
```bash
cd ~/Proyectos/luana-vitalia
git log --oneline -6 && git status --short
ls ~/Proyectos/luana-platform/.session-locks/
cat vitalia/docs/product/stories/vitalia-fase2-adrian-embudo/HANDOFF-next-session.md   # este doc
cat vitalia/docs/product/stories/vitalia-fase2-adrian-embudo/T-E2E-1-result.md
sed -n '1,90p' vitalia/docs/product/stories/vitalia-fase2-adrian-embudo/checkpoint.md
curl -s -o /dev/null -w "%{http_code}\n" https://dev-app.vitalialat.com/api/health   # 200
# verificar si el gate ya está verde (sesión inbox aterrizó?):
cd vitalia/frontend && npx vitest run src/features/adrian/ src/__tests__/architecture/ 2>&1 | tail -8
```
