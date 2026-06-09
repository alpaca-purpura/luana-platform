# dispatch-plan — core-ds-foundation

> Produced by `/architect` (brand: platform), 2026-06-08. Consumed by `/dev-team`. `autonomous_mode` is a **PROPOSAL pending Chris ratification**.

## autonomous_mode (PROPOSED — Chris ratifies)

```yaml
autonomous_mode: true   # ★ PROPOSED — Chris must ratify before /dev-team runs autonomous
```

**Why safe (PROPOSED true):**
- Surface = FE component library + tooling. **No PHI, no auth, no migration, no tenant_id, no agentic, no engine (Python) edit.** None of the HARD-false categories (security/auth/PHI/state-machine/prompt-slot/eval-goldens/cross-brand-mirror-introduction).
- It RESOLVES a cross-brand mirror (lift to core) — sanctioned, not introduced.
- Mostly mechanical: lifts via import + net-new primitives + a custom eslint rule + arch-test ratchets seeded high (no build break).
- The ONE functional gate (T-9 /showcase live-verify on localhost:3002) is automatable (Chrome MCP + Playwright anti-burbuja fixture).
- Opt-in by brand (vitalia pilot); nicolify/comunify untouched → blast radius contained.

**Residual risk (why Chris should still glance):**
- R-1SRC (T-1) touches `vitalia/frontend/src/app/globals.css` with 85 `--vitalia-*` consumers — mitigated by aliasing (non-breaking), but a visual regression is conceivable → the /showcase + existing vitalia tests are the guard.
- `@luana/eslint-config` is a net-new package (Q2) — confirm package creation is sanctioned.

> `/architect` proposes; Chris ratifies. If Chris declines autonomous, run with pause-and-offer at each gate.

## Caps

```yaml
caps:
  iterations: 10        # per ticket build attempts
  audit_iter: 3         # auditor responsible_fix rounds
  cost_usd: 12          # est. ceiling — 9 Sonnet FE tickets + 1 Opus audit pass
  walltime_min: 240     # ~4h end-to-end (build → audit → merge)
```

## Ticket → agent → model → cost matrix

| Ticket | Surface | Agent | Model | Est. cost | Nature |
|---|---|---|---|---|---|
| T-1 tokens + R-1SRC | `@luana/design-tokens` + vitalia globals.css | builder-frontend | Sonnet | ~$0.8 | tecnica |
| T-2 enforcement | `@luana/eslint-config` + vitalia eslint + arch-tests | builder-frontend | Sonnet | ~$1.4 | tecnica |
| T-3 layout-primitives | `@luana/ui-kit/layout` | builder-frontend | Sonnet | ~$1.4 | tecnica |
| T-4 EntityWorkspace+SubNav | `@luana/ui-kit` (lift nicolify) | builder-frontend | Sonnet | ~$1.2 | tecnica |
| T-5 EntityInfoCard | `@luana/ui-kit` (lift vitalia) | builder-frontend | Sonnet | ~$1.0 | tecnica |
| T-6 EntityPicker | `@luana/ui-kit` (net-new) | builder-frontend | Sonnet | ~$1.2 | tecnica |
| T-7 autosave + Group | `@luana/hooks` + `@luana/ui-kit` (lift) | builder-frontend | Sonnet | ~$1.0 | tecnica |
| T-8 archetypes | `@luana/ui-kit/archetypes` | builder-frontend | Sonnet | ~$0.8 | tecnica |
| T-9 /showcase + live-verify | vitalia app + e2e | builder-frontend | Sonnet | ~$1.2 | funcional |
| audit (all) | review | auditor-frontend | Opus | ~$1.8 | — |

> All FE non-agentic → Sonnet (R23: Opus only for agentic production_code). Auditor = Opus per standard.

## DAG (build order)

```
T-1 ──┬─→ T-2 ───────────────────┐
      └─→ T-3 ─┬─→ T-4 ─┐         │
               ├─→ T-5 ─┤         │
               ├─→ T-6 ─┼─→ T-8 ──┴─→ T-9 (live-verify) → audit → merge
               └─→ T-7 ─┘
```
- T-4/T-5/T-6/T-7 are logically independent but all `code:frontend` bucket → serialize per M14 if single hub session; parallelizable across sessions/buckets only if isolated.
- T-9 is the join + the only live-verify gate.

## Playwright visual scope (D3)

```yaml
story_scope_routes: ["/showcase"]
story_scope_components: ["@luana/ui-kit (all new/lifted) + atoms rendered in /showcase"]
out_of_mockup_scope:
  - "Migrating existing vitalia screens (Fase 3 {brand}-ds-adoption)"
  - "Emptying ratchet baselines to zero (Fase 3)"
  - "nicolify/comunify lint enablement"
forbidden:
  - "toHaveScreenshot() of full app pages — only /showcase sections scoped"
runtime_error_gate: required (on /showcase) via e2e/fixtures/base.ts anti-burbuja
```

## Invocation

**Manual (pause-and-offer at each gate):**
```
/dev-team brand: platform core-ds-foundation
# builds T-1..T-9 ticket-by-ticket, TDD; pauses for Chris at developed boundary (G) + live-verify;
# then /auditor → /pm-luana merge.
```

**Autonomous (if Chris ratifies autonomous_mode: true):**
```
/dev-team brand: platform core-ds-foundation autonomous_mode: true
# runs to developed without pause (G skipped), live-verifies /showcase, auto-handoff /auditor
# (Carril R fix-and-own) → APPROVED auto-handoff /pm-luana merge (semver minor bump + @luana changelog).
```

## Gates requiring Chris ratification (flag at runtime)

1. **autonomous_mode** — ratify true/false before /dev-team runs (this dispatch proposes true).
2. **Open Questions (03-arch §16):** Q1 EntityPicker virtualization lib (`@tanstack/react-virtual` vs literal `react-virtuoso`); Q2 `@luana/eslint-config` net-new package; Q3 R-1SRC `--vitalia-*` aliasing. Architect recommends: Q1 `@tanstack/react-virtual`, Q2 yes (shared package), Q3 aliasing. Chris confirms or overrides.
3. **merge → done** — `/pm-luana` semver MINOR bump + `@luana/{design-tokens,ui-kit}` changelog (standard merge gate).
