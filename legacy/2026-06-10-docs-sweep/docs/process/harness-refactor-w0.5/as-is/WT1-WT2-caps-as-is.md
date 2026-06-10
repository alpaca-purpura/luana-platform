# AS-IS — WT1 (UI/functional cap) + WT2 (service cap, no UI) — deltas vs the shared spine

> W0.5 process-model reconstruction (operator POV). Scope: the **WT1/WT2-specific divergences** from the common backbone + from each other. The shared spine (Step-0 worktree, 10 states, story-closure-gate G/R, chris-input, anti-dup-refining, paradigm box/zone, CONTEXT-BRIEF, gate-runner JSON, chris-input append) is owned by the SPINE agent — here only the deltas. Every claim cites `file:line`. **Tier tags:** `[CORE]` = generic agent-build IP · `[PROJECT]` = luana stack/domain · `[BRAND]` = market instance.

---

## 1. Definitions

- **WT1 — UI/functional capability** (new/extend/modify): a user-reachable surface (page / list-detail / form / dashboard) plus the BE it calls. Refined by `/po-ux` (PO+UX fused), `verification_nature: functional`, demo gate + Playwright visual scope + anti-burbuja. Entry: `.claude/skills/po-ux/SKILL.md:3` ("UI standard story (CRUD/list/detail/form/dashboard) … 01-spec.md UNIFICADO").
- **WT2 — Service capability (no UI)**: a BE endpoint / domain logic / migration with no UI and no agentic flow. Refined by `/po` standalone, `verification_nature: technical`, technical gates only (no demo manual, no anti-burbuja). Entry: `.claude/skills/po/SKILL.md:3,21` ("SCOPE: service-stories only (BE endpoint sin UI, sin agentic)").

The **UI-vs-service branch is the core fork** of these two work-types and it propagates through every phase below.

---

## 2. Delta table — per lifecycle phase (WT1 | WT2 | shared-with-spine)

| Phase | WT1 (UI/functional) | WT2 (service, no UI) | Shared-with-spine |
|---|---|---|---|
| **refine — skill** | `/po-ux` (PO+UX fused) `po-ux/SKILL.md:3,8`. Decision matrix routes UI-std here `po-ux/SKILL.md:20-26`. | `/po` standalone `po/SKILL.md:3,21`. Same matrix routes service-only here `po/SKILL.md:25`. | Both `model: opus`; same `01-spec.md` owner path; both run anti-dup `prior-art-scan` (po-ux Step 0.5 `po-ux/SKILL.md:73-116`; po has no Step 0.5 block — see §8); both batched-questions G6; both Step 2.5 hot-fix repro. |
| **refine — flow** | **2 rondas / 2 firmas** on the SAME `01-spec.md` `po-ux/SKILL.md:175-190`: RONDA 1 input-spec (intención) `input_spec_signed` → mockup FINAL `mockup_final_signed` → GO → RONDA 2 (Gherkin+matriz). Explicit "★ solo `/po-ux`" `docs/process/spec-mapa-funcional.md:52,35-45`. | **Single ratification** — one `ratified_by_chris: true` loop, no input_spec/mockup signatures `po/SKILL.md:204-217,237-264`. | Both write `§ Mapa funcional` + `§ Matriz de cobertura` ABOVE the Gherkin `po-ux/SKILL.md:210-276` · `po/SKILL.md:131-133`; both emit 4 base scenarios (happy/negative/edge/adversarial). |
| **refine — extra gates** | `playwright_required: true` HARD per functional scenario `po-ux/SKILL.md:254,433`; 7 mandatory sub-categories race/concurrent/network/empty/large/**a11y/i18n** `po-ux/SKILL.md:236-248`; wireframes + visual states + microcopy + responsive + a11y sections `po-ux/SKILL.md:279-378`; **Design System Canon HARD gate** `po-ux/SKILL.md:56-71`. | sub-categories largely `not_applicable_reason` (service-only) `po-ux/SKILL.md:248,497`; no visual states / wireframes / a11y sections; agentic-grader option exists for the *other* `/po` branch (agentic) `po/SKILL.md:170-187`. | both: `cap_target` + `cap_change_type ∈ {new,fix,extend,derive}` `po-ux/SKILL.md:443` · `po/SKILL.md:239`; both: box/zone (`agent_owner`) derived from SYSTEM-MAP `po-ux/SKILL.md:445` · `po/SKILL.md:241`. |
| **arch — surfaces** | typical surfaces FE-only or FE+BE `architect/SKILL.md:78-80`; reads `02-design-agentic.md` only if agentic (n/a). | typical BE-only or BE+AGENTIC `architect/SKILL.md:81`. | Same `/architect` orchestrator spawn (single-shot full-stack) `architect/SKILL.md:83-146`; same 5-artifact ready package (03-arch/04-validators/05-guidelines/06-tickets/dispatch-plan). |
| **arch — validators** | `verification.nature: functional` `04-validators-template.yaml:28`; `demo_required: true`; `runtime_error_gate: required` `:38`; `playwright_visual_scope` block REQUIRED `:62-83`; `dev_app_verified.required: true` `:53-55`; visual category (visual_fidelity/responsive/a11y_axe) `:207-230`; `test_construction_plan.playwright_required: true` HARD `:379`. | `verification.nature: technical`; `demo_required: false` + `demo_skip_reason`; runtime_error_gate / playwright_visual_scope / visual category **N/A**; `test_construction_plan.playwright_required: false` (service-only) `:379`; functional category = pytest contract/integration only `:143-200`. | both: non_functional + functional + architectural_validation categories `:85-340`; both: `scenario_coverage` matrix; both: `iteration` policy; both: `technical_gates.baseline` always. |
| **arch — must_load_skills** | `frontend-expert` + `playwright-expert` + `chrome-devtools-verify` + `design-system-canon.md` + `frontend-visual-fidelity` `architect/SKILL.md:169,944-947`; FE rules (frontend-fsd). | `backend-expert` + FastAPI/pytest patterns; NO playwright/chrome/canon; BE rules (backend-ddd, tenant-isolation). | both: tenant-isolation + anti-duplication + spanish-text + tdd + auditor-self-fix-policy `architect/SKILL.md:563-574`; both: `assignment` block per ticket (no general-purpose) `architect/SKILL.md:674-706`. |
| **dev — builder** | `builder-frontend` (Sonnet/Opus) `dev-team/SKILL.md:399-419,762`; **Design System Canon HARD gate** for any `frontend/src/**` ticket `dev-team/SKILL.md:31-44`; **anti-burbuja** `fixtures/base.ts` import + `verify-no-backend-errors.sh`; produces `demo-script.md`. | `builder-backend` (qwen-opencode default / Sonnet) `dev-team/SKILL.md:203-213,761`; no canon gate, no base.ts, no demo-script (demo_required false). | both: Step 0.4 module-scoped build-claim + closure gate; both: G5 pre-commit smoke gate; both: must_load_skills enforcement; both: TDD RED→GREEN; both: gate-output.json; both: Step 5 G/R branch (autonomous vs AWAIT_CHRIS_VERIFY). |
| **dev — live-verify gate (Step 4.6)** | BLOCKING: REFUSE `developing→developed` without `dod_live_verified:true` + `dod_evidence` (≥1 write) + `demo-script.md` `dev-team/SKILL.md:514-558`. | auto-skip branch: `nature=técnica && demo_required≠true` → `dod_live_verified_skip_reason` `dev-team/SKILL.md:525-530`. | same Step 4.6 code path; same Step 4.5 Phase-D-local gherkin pre-check `dev-team/SKILL.md:473-504`; same ledger producer Step 4.5b `:506-513`. |
| **verify — auditor** | sub-auditor `auditor-frontend` (12 categories FSD/Server-Client/forms + 8 gates) `auditor/SKILL.md:135`; Visual fidelity category `visual-fidelity.md:63-66`; CHECKPOINTS C2 = Playwright E2E + screenshots `auditor/SKILL.md:510-512`; CHECKPOINTS final spawns `--grep '{story-id}'` Playwright suite `auditor/SKILL.md:483-484`. | sub-auditor `auditor-backend` (11 categories DDD/tenant/migrations + 13 gates) `auditor/SKILL.md:134`; CHECKPOINTS C2 = contract-test suite `auditor/SKILL.md:486`; no visual/screenshot row. | both: Step 1.0 reconciled-precondition; both: Phase D gherkin-matrix `auditor/SKILL.md:162-237`; both: `LIVE_VERIFY_MISSING` auto-FAIL gated by nature `:253-274`; both: cap N0-N4 verification `:248`; both: C1/C3/C4/C5 grid; both: Carril R responsible-fix v5. |
| **verify — demo gate** | `demo_required: true` → Chris signoff in **G** (`chris_verify.signoff`, proceso v5) before auditor; `/pm-{brand}` Fase F REFUSE merge without `SATISFIED` `definition-of-done-live-verify.md:5,§5`. | `demo_required: false` → auto-skip with `demo_skip_reason`; G phase skipped for pure-technical (still passes through `developed`). | demo gate location is **G not F** (proceso v5) for both that qualify; both gated by `definition-of-done-live-verify.md` §5. |
| **merge** | `/pm-{brand}` 07-merge.md 5 sections; F REFUSE without `chris_verify.signoff` SATISFIED + `dod_evidence`. | same merge skill, no demo signoff required (demo_required false). | same `/pm-{brand}` Fase F; same R2 `git mv` to archive; same cap YAML update. |

---

## 3. Actors/skills that differ from spine

| Role | WT1 | WT2 |
|---|---|---|
| Refine skill | `/po-ux` (PO+UX **fused**) | `/po` (PO only) |
| Builder | `builder-frontend` (+ `builder-backend` if FE+BE) | `builder-backend` |
| Sub-auditor | `auditor-frontend` (predominant) | `auditor-backend` |
| Domain experts loaded | `frontend-expert`, `playwright-expert`, `chrome-devtools-verify` | `backend-expert` (+ module domain expert) |
| Live-verify tool | Chrome DevTools MCP (live) + Playwright authenticated (golden) | n/a (technical gates only) |

Spine-shared roles (identical for both): `/pm-{brand}`, `/architect`, `/dev-team` orchestrator, `/auditor` orchestrator, `context-builder`, `gate-runner`, `/pm-luana` (promotion escalation).

---

## 4. Gates that differ

| Gate | WT1 | WT2 | Cite |
|---|---|---|---|
| `demo_required` derivation | `true` (touches `frontend/` or endpoint with FE consumer) | `false` + `demo_skip_reason` (only tests/migrations/config/core no-contract) | `architect/SKILL.md:208,956-967` · `04-validators-template.yaml:43-44` |
| `playwright_visual_scope` | REQUIRED block (story_scope_routes/components + forbidden_visual_changes + non_egoismo) | absent (no FE) | `architect/SKILL.md:708-725` · `04-validators-template.yaml:62-83` · `architect-autonomous-mode.md` (stub) |
| anti-burbuja runtime-error gate | REQUIRED — `fixtures/base.ts` (pageerror/console/hydration/api-4xx5xx/Next-overlay) + `verify-no-backend-errors.sh` | n/a | `definition-of-done-live-verify.md` §3 · `04-validators-template.yaml:38` |
| Design System Canon binding | HARD at po-ux (mockup), architect (03-arch ref + 04-validators mechanical gates), dev (build-from-canon), auditor (rejects non-composed) | n/a | `frontend-visual-fidelity.md` § Canon (stub) · `po-ux/SKILL.md:56-71` · `architect/SKILL.md:169` · `dev-team/SKILL.md:31-44` · `design-system-canon.md:1-89` · `ADR-014` |
| `technical_gates.opt_in` Schemathesis | true → endpoint nuevo (FE↔BE contract pre-runtime) — applies to WT1's BE leg AND WT2 | true → endpoint nuevo | `04-validators-template.yaml:32-33` |
| `technical_gates.opt_in` Hypothesis | true → domain logic w/ invariants (pricing/PHI/scheduling) | same | `04-validators-template.yaml:34` |
| `technical_gates.mutation` | architect-marked mutation-critical surfaces (commit/money/PHI/state-machine/contract) → hard, else advisory | same (nature-driven, not WT-driven) | `04-validators-template.yaml:34-37` |
| live-verify Step 4.6 | BLOCKING (dod_evidence + demo-script) | auto-skip (skip_reason) | `dev-team/SKILL.md:514-558` |
| `LIVE_VERIFY_MISSING` auto-FAIL | active (auditor ejerce ≥1 write live) | inactive (nature=technical) | `auditor/SKILL.md:253-274` |

**Common pattern:** the gates are keyed off `verification_nature` (technical/functional/both) **declared by `/architect` in `04-validators.yaml`** and enforced by `/dev-team` + `/auditor`. WT1 ≈ functional; WT2 ≈ technical — but the harness is written against *nature*, not against the WT label (a CORE virtue: the WT label never appears in the gates).

---

## 5. Artifacts that differ

| Artifact | WT1 | WT2 |
|---|---|---|
| `mockups/*.html` | yes (Option B HTML mockup, Tailwind CDN) `po-ux/SKILL.md:302-315` | no |
| Wireframes inline (ASCII/HTML/Figma) | yes — one of three `po-ux/SKILL.md:284-309` | no |
| `§ Estados visuales` / `§ Componentes` / `§ Microcopy` / `§ Responsive` / `§ Accessibility` | yes `po-ux/SKILL.md:317-378` | no |
| `demo-script.md` | yes (4 sections, functional/demo_required) `dev-team/SKILL.md:535,549` · `definition-of-done-live-verify.md` §5 | no (auto-skip) |
| `01-spec.md` 2-signature checkpoint fields | `input_spec_signed` + `mockup_final_signed` `po-ux/SKILL.md:479-480` | absent (single `ratified_by_chris`) `po/SKILL.md:248-256` |
| `dispatch-plan.md` + `04-validators` + `05-guidelines` + `06-tickets` | yes | yes (shared) |
| visual/a11y validators in `04-validators` | yes `04-validators-template.yaml:202-230` | no |

WT2 is **minimal**: `01-spec.md` (Mapa funcional + Gherkin happy/negative/edge/adversarial + service graders) → ready package → BE build → auditor-backend → merge. No mockup, no demo, no visual gate.

---

## 6. Cockpit view

- Both WT1+WT2 caps surface on **`/board`** (story lifecycle states) — `tools/luana-cockpit/app/board/page.tsx`, `components/board/BoardView.tsx` exist (verified).
- WT1 (and the cap-detail of both) surface on **`/functionality`** tab — route exists compiled (`tools/luana-cockpit/.next/dev/server/app/functionality`) but **no source `app/functionality/page.tsx` or `components/functionality/*` found in the live tree** (only the `.next` build artifact). **GAP/FINDING:** the functionality cockpit view is referenced by the charter (`charter:41-44` WT1 cockpit view = `/functionality`) and by the cap N0-N4 model, but its source is not locatable under `tools/luana-cockpit/app|components` — either stale build, moved, or unwired. Needs W4b/cockpit verification.
- Cap reading levels **N0-N4** are the cockpit's cap-detail altitudes (`docs/process/capability-protocol.md:607-632`): N0 description (G8) · N1 scenarios + truth badge `verified_real` · N2 business_rules w/ `code_ref` · N3 access entry_points · N4 dev_preview + `# cap:` headers. WT1 must deliver all 5 (auditor Phase D verifies `auditor/SKILL.md:248`); WT2 typically N0/N1/N2/N4 with N3 only if reachable.
- WT2's cap, being `user_visible: false`-ish (service), still lives in a `capability` YAML with a box (paradigm zone). WT5 (technical caps Infra zone) is the **explicitly under-defined** sibling — not WT2 — per `charter:45`.

---

## 7. Core-vs-Project/Brand split candidate

| Delta | Tier | Why |
|---|---|---|
| **The UI-vs-service branch itself** (po-ux vs po; builder-frontend vs builder-backend; auditor-frontend vs auditor-backend; demo-gate yes/no) | **CORE** | A generic agent-build harness needs "is this user-reachable?" → richer verification. The *fork* is tech-agnostic IP. |
| `verification_nature` model (technical/functional/both) + demo gate + anti-burbuja concept + business-rules matrix + regression_guard | **CORE** | Doctrine of "how you verify by nature of the surface" — no luana tech named. (`definition-of-done-live-verify.md` §1-6 mixes core doctrine with brand infra — needs the seam.) |
| 2-round/2-signature spec flow (input_spec → mockup → executable) | **CORE** | Generic "ratify intent before formalizing" pattern; the *mockup* tool is project. |
| `design-system-canon.md` binding + `EntityWorkspaceLayout`/`EntityPicker`/`Select`/page-primitives + `@luana/ui-kit` + Tailwind/Shadcn/FSD-Lite | **PROJECT** | The seam slot `design_system_ref` (`charter:89`). Concrete components = the Next/React stack. |
| Clerk auth, `dev-app.{brand}lat.com`, ports 300X/800X, `make dev-app-{brand}`, test users | **PROJECT/BRAND** | seam slots `live_verify_infra[]` (`charter:88`); per-brand URLs/creds. |
| `playwright-expert` / `chrome-devtools-verify` as the live-verify mechanism; `fixtures/base.ts` path | **PROJECT** | Playwright + Next-overlay specifics; the *concept* "exercise the real action + read logs" is CORE. |
| `frontend-expert` / `backend-expert` / FastAPI / SQLAlchemy / `${WS}/.venv/bin` / `npx tsc/eslint/vitest` | **PROJECT** | seam slot `toolchain.{...}` (`charter:84`). |
| voseo / Spanish-neutro microcopy gate | **PROJECT/BRAND** | seam slot `locale` (`charter:86`). |

**Core skeleton vs luana instance:** the *generic skeleton* is `{refine-by-surface-type} → {arch declares verification_nature} → {build-by-surface} → {verify-by-nature} → merge`. Everything that names FastAPI, Next, Clerk, vitalia, Tailwind, `${WS}/.venv`, dev-app URLs, `@luana/ui-kit`, Playwright = PROJECT/BRAND to push out behind the seam.

---

## 8. Scatter / contradiction / gap findings (file:line)

1. **`02-design-ui.md` is officially DEAD yet referenced as a live artifact in 8 surfaces.** `po-ux/SKILL.md:510` lists "❌ Producir `02-design-ui.md` separado (legacy paradigma — fusión es el punto del skill)" and `:29` justifies the fusion. But it is cited as a live input in `architect/SKILL.md:803` ("UI stories: `02-design-ui.md` lista elementos visuales clave"), throughout `frontend-expert/references/visual-fidelity.md:32,34,82`, in `docs/specs/templates/03-arch-template.md`, `docs/specs/templates/06-tickets-template.yaml`, and the template `docs/specs/templates/02-design-ui-template.md` **still exists**. WT1's visual-fidelity D2/auditor reference a doc the WT1 entry skill forbids producing. **High-cohesion violation — pick one SSoT** (the `01-spec.md § Wireframes`).

2. **`verification_nature` key-name mismatch — silent enforcement gap.** The 04-validators template emits the value as **nested** `verification.nature: functional` (`04-validators-template.yaml:28`). But `/dev-team` Step 4.6 reads it as a **top-level** key: `grep -E "^verification_nature:"` (`dev-team/SKILL.md:522`) — which will NOT match the templated `nature:` (it's indented under `verification:`). Result: the auto-skip branch for technical stories silently never fires from the template's own shape; the gate falls through to the HARD branch (fail-*safe* for WT1, but for WT2 it can wrongly demand `dod_evidence` unless `demo_required` happens to be `false` in the same grep). Architect prose also refers to `verification_nature` as if top-level (`architect/SKILL.md:940,956-967`). **Same concept, two key spellings** — a real bug for WT2 auto-skip.

3. **po (WT2) has NO `Step 0.5 prior-art-scan` block, po-ux (WT1) does.** `po-ux/SKILL.md:73-116` runs the cross-brand scan + REFUSE-refined gate; `/po` only references `anti-duplication-refining.md` indirectly via inputs and has no inline scan step. Spine rule `anti-duplication-refining.md` says ALL of po-ux/po/ux-agentico/architect must run it — **WT2's refine skill under-implements the shared gate** (LSP/consistency gap).

4. **2-round/2-signature flow is described in TWO places with the canonical-ownership note buried.** `po-ux/SKILL.md:175-190` (inline) + `docs/process/spec-mapa-funcional.md:52-74` (SSoT) both carry the 6-step flow; the "★ solo `/po-ux`" scoping lives at `spec-mapa-funcional.md:52` and `po-ux/SKILL.md:175`. WT2 (`/po`) has nothing equivalent and no pointer saying "WT2 is single-signature on purpose" — a reader can't tell if that's intentional or an omission. **Document the asymmetry explicitly.**

5. **Demo-gate location drift F→G is reconciled in the rules but the artifact templates lag.** `definition-of-done-live-verify.md` §5 + `story-closure-gate.md` move the signoff from Fase F to **G** (`chris_verify.signoff`, consolidating the old `demo_signoff`), and dev-team Step 5 implements the G pause (`dev-team/SKILL.md:580-618`). But `04-validators-template.yaml:53-55` still names `dev_app_verified` (vitalia ADR-008 field) and the auditor/pm prose carries both vocabularies. WT1 operators see `demo_signoff`/`chris_verify.signoff`/`dev_app_verified` for the same thing across F/G — **one signoff field, three names, two phases referenced.**

6. **Cockpit `/functionality` source not locatable.** Charter assigns WT1 the `/functionality` cockpit view (`charter:41`) and cap N0-N4 render there, but only the `.next` build artifact exists — no `app/functionality/page.tsx` in the live tree (verified §6). **Cockpit-view-per-WT mapping has an unverified node** (feeds W4b).

---

**Top-3 (for the relay):** (1) `02-design-ui.md` is forbidden by po-ux yet cited live in 8 surfaces incl. architect+visual-fidelity+templates — pick one SSoT. (2) `verification_nature` vs nested `verification.nature` key mismatch → WT2 technical auto-skip silently broken in dev-team Step 4.6 (`dev-team/SKILL.md:522` vs `04-validators-template.yaml:28`). (3) WT2's `/po` lacks the inline prior-art-scan gate that WT1's `/po-ux` enforces (`po-ux/SKILL.md:73-116`) — shared anti-dup-refining rule under-implemented for service stories.
