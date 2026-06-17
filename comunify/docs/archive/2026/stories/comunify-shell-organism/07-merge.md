---
story_id: comunify-shell-organism
brand: comunify
release: R-shell (MVP · comunify no usa contenedor release.yaml todavía)
merged_at: 2026-06-17T18:00Z
merged_by: /pm-comunify
commit_squash_sha: "wip/comunify (dev+reconcile 3302621d + este 07-merge); squash a main = staging manual pendiente (triple-branch)"
checkpoints_path: "./checkpoint.md"
audit_reviews:
  - "./06-audit/REVIEW-frontend.md (auditor-frontend · PASS)"
  - "./06-audit/REVIEW-agentic.md (auditor-agentic · PASS)"
autonomous_mode: true            # G (chris-verify) exento — auditor live-verify + dod_evidence sustituyen el demo (Chris autorizó "corré hasta el done")
---

## § 1 — Scenario verification matrix

> autonomous_mode → no hubo Phase D Chris-demo. Cada SC live-verificado se mapea a su test. SC deferidos
> (HB-79, must_pass:false) ver `04-validators.yaml § reconciliation` — NO bloquean el merge.

| Scenario | Test path | Status | Notes |
|---|---|---|---|
| SC-chat-ok (write real → stream LLM) | `comunify/frontend/e2e/shell-organism/shell-chat-ok.spec.ts` | ✅ PASS | e2e autenticado real-backend; DB tenant-scoped (trace_event/llm_call/conversations) |
| login→tenant + nav | `…/shell-chat-ok.spec.ts::login→tenant` | ✅ PASS | authed, no /sign-in, composer montado |
| SC-happy (shell mount + Ribbon + 404) | `comunify/frontend/e2e/regression/comunify-shell-organism/shell-happy.spec.ts` | ✅ PASS | |
| SC-chat-error / network / double-send / delegate | `comunify/frontend/src/stores/__tests__/chat-store.test.ts` (18) | ✅ PASS (unit) | deferido como Playwright (unit-cubierto, HB-79) |
| SC-tab-placeholder / luana-states / plataforma / a11y / i18n / adversarial-tenant / dashboard-unreachable | — | ⏸ DEFERRED | R-shell+1..N · arch-tests + pre-commit cubren tenant/i18n |

**Coverage:** SC funcionales núcleo (chat-ok, login→tenant, happy) PASS live. Resto deferido con rationale (no huérfanos).

## § 2 — Playwright E2E run

```bash
cd comunify/frontend && E2E_BASE_URL=http://localhost:3003 npx playwright test --project=shell-organism --reporter=line
```

- Specs run: 4 (setup: clerk-setup + authenticate · shell-organism: login→tenant + SC-chat-ok)
- Passed: 4 · Failed: 0 · Skipped: 0 · Duration: ~26s
- Auth: `@clerk/testing` ticket strategy + storageState (`playwright/.clerk/user.json`, gitignored)
- DB efecto (tenant `9cf1ef9b…`) tras corridas: `copilot_trace_event` 11→29, `copilot_llm_call` 3→11, `copilot_conversations` 6→8

**E2E verdict:** ✅ ALL GREEN (write real al engine, NO mock — anti verde-fantasma).

## § 3 — Capabilities updated/created

### UPDATED
- `comunify/docs/product/capabilities/platform/shell-organism.yaml` — status `planned → live` (v3 dims + dev_preview + scenarios + access + business_rules + test_coverage + change_log). cap-doctor SANO · bidirectional CLEAN (G1-G9, 0 drift).

## § 4 — Modules MD refreshed

```bash
cd $(git rev-parse --show-toplevel) && make portfolio   # regen BACKLOG + modules auto-list
```

- `comunify/docs/product/modules/platform.md` — auto-list incluye `shell-organism` (post-merge regen)

## § 5 — How to verify (reproducible)

```bash
WS=$(git rev-parse --show-toplevel); cd ${WS}
make dev-comunify                                    # postgres + BE :8003 + FE :3003 + gateway
# FE gates
cd ${WS}/comunify/frontend && npx tsc --noEmit && npx eslint src/ --cache && npx vitest run
# BE arch
cd ${WS}/comunify/backend && ${WS}/.venv/bin/pytest tests/architecture/ -q
# E2E live (authed real-backend)
cd ${WS}/comunify/frontend && E2E_BASE_URL=http://localhost:3003 npx playwright test --project=shell-organism
```
**Expected:** todos exit 0. Falla post-merge → hot-fix per `hotfix-repro-mandatory.md`.

## § 6 — Verificación live — Definition of Done (Critical Rule #37)

```yaml
dod_live_verified: true
dod_env: "localhost:3003 (Playwright @clerk/testing) + dev-app.comunifyagents.com (Chrome DevTools MCP, lane D)"
dod_evidence:
  - action: "Login Clerk → shell /comunify-demo/nina/marca → enviar mensaje a Luana (sidebar) — write real POST /api/v1/comunify/copilot/chat"
    observed: "Burbuja del bot acumula respuesta real streameada del engine (kimi); ≥2 burbujas; contenido on-topic >20 chars"
    backend_log: "POST /copilot/chat 200 SSE · Bearer + X-Tenant-ID · sin traceback · DB tenant-scoped: trace_event/llm_call/conversations crecieron"
dod_verified_at: 2026-06-17
```

> Verificado dos veces: Chrome MCP manual (sesión previa) + e2e automatizado real-backend (esta sesión) + el auditor-frontend ejerció el write live de nuevo (Auditor Responsable v5). autonomous_mode → este live-verify + `dod_evidence` sustituyen el demo G (Chris autorizó el run autónomo a `done`).

## Cross-references

- `01-spec.md` · `03-arch.md` · `04-validators.yaml § reconciliation` · `checkpoint.md`
- `06-audit/REVIEW-frontend.md` (PASS) · `06-audit/REVIEW-agentic.md` (PASS)
- `comunify/docs/learnings/2026-06-17-engine-deuda-surfaced-by-shell-organism.md` (deuda engine → /pm-luana)
- `.claude/rules/story-closure-gate.md` · `.claude/rules/definition-of-done-live-verify.md`

## Story → archive

- `comunify/docs/product/stories/comunify-shell-organism/` → `comunify/docs/archive/2026/stories/comunify-shell-organism/` (git mv en este commit · R2)

## Output al user (Chris)

```
✅ Story comunify/comunify-shell-organism MERGED (state reviewing → done · wip/comunify)
   - SC-chat-ok live-verified (e2e real-backend 4 passed + DB tenant-scoped)
   - Auditores frontend + agentic: PASS · live-verified · 0 cross-brand/engine flags
   - Cap comunify-shell-organism: planned → live (scenarios + dev_preview)
   - 2 bugs reales arreglados (next.config /api rewrite faltante · plataforma avatar 500)
   - Deuda engine (persona _BASE_IDENTITY + Settings Optional + migraciones) → /pm-luana (learning promotable)
   - Story archivada: comunify/docs/archive/2026/stories/comunify-shell-organism/
```
