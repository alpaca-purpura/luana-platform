# W6 · RESEARCH batch-T — Templates (`docs/specs/templates/`)

> **READ-ONLY classification.** Scope = all 26 files in `docs/specs/templates/`. Governing SSoTs: charter §0.5 (option-b proxy) + §3 (9 seam slots) + §4 (SOLID); PROCESS-MODEL §3 WT-cards · §5 one-SSoT · §6 conformance · §7 cockpit; REQ-TAKING-DETAIL §10 (01-spec functional-first inversion). Proxy-grep = `vitalia|nicolify|comunify|lupulo|ruff|pytest|mypy|alembic|clerk|next\.js|tailwind|fastapi|sqlalchemy|core/luana-core|\.venv|dev-app|hipaa|phi`. file:line evidence inline.

## Tally

- **26 templates classified:** 6 core · 18 hybrid · 0 project · 0 brand · 2 DEPRECADO-tombstoned (PI/sprint, also-hybrid by tokens=0 but already-dead).
- **Tier split by proxy:** 0-hit = core-candidate (8 files); ANY hit = hybrid (18 files). All 8 zero-hit files earn `core` EXCEPT none demoted — verified by reading hits-in-context (the only zero-hit non-core would be a deprecated/dead body, but the 8 zero-hit files are all live skeletons → 6 core after subtracting the 2 zero-hit-but-DEPRECADO PI/sprint, which stay hybrid-tagged-dead). Final: **6 core / 18 hybrid / 2 dead-tombstone.**
- **Stale vocab:** 5 files carry retired tokens (2 LIVE-STALE that must be conformed, 3 tombstone-OK).
- **Dead refs:** 1 truly-phantom cluster in **04-validators** (5 agentic eval scripts + 1 mirror-scan script, all self-labeled `# MISSING`); `02-design-ui.md` cited LIVE as input in 2 files (DEAD artifact). All other cited rules/process-docs/scripts EXIST.

---

## Classification table

| # | file | tier | proxy hits | stale-vocab | dead-refs | {SLOTS} needed | machinery-asserted | W6 action |
|---|---|---|---|---|---|---|---|---|
| 1 | `00-chris-input-template.md` | **core** | 0 | none | none (`chris-input-protocol.md` OK) | — | N | leave |
| 2 | `00-research-template.md` | **core** | 0 | none | none (`learnings.md` OK) | — | N | leave |
| 3 | `00-story-template.md` | **core** | 0 | none | none (all `{placeholder}` links) | `domain_modules[]` (module/capability path conventions) | N | leave (proxy-clean; slot only at W5 path-rewrite) |
| 4 | `01-spec-template.md` | **core** | 0 | none | none (all refs OK: `paradigm-arquitectura.md`, `test-design-doctrine.md`, `spec-mapa-funcional.md`, `SYSTEM-MAP.yaml`) | `design_system_ref` (SHELL-DESIGN-CONTRACT line 30), `domain_modules[]` | **Y — CHECK 9 (MANDATORY_SPEC_CONCEPTS: "Mapa funcional"/"Matriz de cobertura"/"FIRMA 1"/"FIRMA 2") · CHECK 25 (`LEDGER DE COBERTURA VIVO`+`✅ construido`) · CHECK 27 (`PISO HARD`+`cap_change_type`)** | **invert-functional-first** (see §inversion notes — surgical: add explicit mockup-final section + "GENERATED at firma-2" note + comment-marker; PRESERVE all asserted strings) |
| 5 | `02-design-agentic-template.md` | **hybrid** | 1 (`nicolify_role` ID example, line 96) | none | none (rubrics `no-hallucination.md`/`no-overpromise.md`/`tool-trajectory.md`/`voice-fidelity.md` + personas EXIST under `docs/specs/rubrics`/`docs/specs/personas/archetype-aware`) | `agent_roster` (`nicolify_role`), `domain_modules[]` (sales_agent/copilot) | N | conform-stale: none / add-{slots} (`agent_roster` for the `nicolify_role` example token) |
| 6 | `02-design-ui-template.md` | **hybrid** | 0 | **`02-design-ui` SELF (line 1 title) — TOMBSTONE-OK** (line 4 explicitly declares it obsolete, content moved to 01-spec since v4 2026-05-06) | refs to `frontend/src/...` are `{placeholder}` paths; `delta-spec.md` OK-pattern | — | N | **tombstone-already-OK** (the file IS the dead artifact's grave; keep header tombstone. W6: consider deleting per D-X2 "02-design-ui DEAD" — but the 2 LIVE input-refs to it (rows 7,10) must be repointed FIRST) |
| 7 | `03-arch-template.md` | **hybrid** | 4 (line 43 `clerk-jwt`, 74 `alembic/`, 177 `pytest`, 288 `playwright/.clerk/`) | **`02-design-ui` — LIVE-STALE @ line 14** (`ui_design: "02-design-ui.md"` cited as live FE input; artifact is DEAD) | line 14 `02-design-ui.md` (DEAD); rules `backend-ddd.md`/`backend-migrations.md`/`tenant-isolation.md`/`anti-orphan-integration.md`/`anti-duplication-refining.md` OK | `toolchain` (alembic/pytest/playwright), `live_verify_infra` (clerk), `domain_modules[]`, `design_system_ref` | N | **repoint-dead** (line 14 `02-design-ui.md` → `01-spec.md § Wireframes` per PROCESS-MODEL §8 + D-X2) + add-{slots} |
| 8 | `04-validators-template.yaml` | **hybrid** | 26 | **`v4.2` — present? NO** (none here); top-level `verification_nature` already (D-X4) | **PHANTOM CLUSTER** — `scripts/run_agent_evals.py` (240), `run_trajectory_eval.py` (253), `check_cost_budget.py` (261), `check_voice_fidelity.py` (273), `run_adversarial_suite.py` (291), `scan_cross_brand_mirror.sh` (321) — all self-labeled `# MISSING — create before use`, all ABSENT on disk. Real surface = `pytest tests/agentic_evals/` (exists in vitalia+comunify) | `toolchain` (ruff/pytest/mypy/eslint/`.venv`), `brands[]` (line 21,185 brand enum), `live_verify_infra` (clerk/dev-app line 185,194), `domain_modules[]` | **Y — CHECK 19 (`mutation:`+`surfaces:`+`mode:` block; `mutation_gate.py` EXISTS)** | **repoint-dead** (agentic 5 scripts → real `pytest tests/agentic_evals/` per D-X3 "agentic validators → real pytest"; mirror-scan → real `anti-duplication` mechanism) + add-{slots} (don't break CHECK-19 `mutation`/`surfaces`/`mode` strings) |
| 9 | `05-guidelines-template.md` | **hybrid** | 8 (line 9 brand enum, 25 tailwind, 35/39 dev-app, 58 pytest, 96 `core/luana-core-platform`, 141 alembic, 153 `core/luana-core-*`) | none | none (all rules OK; `datetime_utils.py` OK) | `toolchain`, `brands[]`, `engine_prefix` (line 96,153), `live_verify_infra` (dev-app), `design_system_ref` (tailwind/FSD), `domain_modules[]` | N | add-{slots} |
| 10 | `06-tickets-template.yaml` | **hybrid** | 19 | **`02-design-ui` — LIVE-STALE @ line 357** (`ui_design: "../02-design-ui.md"` live FE-ticket input; DEAD artifact) | line 357 `../02-design-ui.md` (DEAD); `frontend-fsd.md`/`spanish-text.md` OK; `tests/agentic_evals/` pattern OK (lines 306-329) | `toolchain`, `brands[]`, `domain_modules[]` (copilot), `agent_roster` | **Y — CHECK 2 (`primary_agent: builder-*` ≥3 in T1/T2/T3)** | **repoint-dead** (line 357 → `01-spec.md § Wireframes`) + add-{slots} (PRESERVE `primary_agent: builder-` indented strings) |
| 11 | `07-merge-template.md` | **hybrid** | 8 (line 12 brand enum incl `platform`, 49 clerk, 85/123/126/135 `.venv`+pytest, 142/146 dev-app) | none | none (`../06-audit/gherkin-matrix.md` relative-placeholder; `story-closure-gate.md`/`hotfix-repro-mandatory.md`/`definition-of-done-live-verify.md` OK) | `toolchain`, `brands[]`, `live_verify_infra` (dev-app/clerk) | N | add-{slots} |
| 12 | `checkpoint-template.md` | **hybrid** | 3 (line 41 dev-app, 42 dev-app, 53 dev-app) | **`phase_workflow: PO_SPEC` — LIVE-STALE @ line 18** (live frontmatter field; X6 retired `phase_workflow`+`A-F`/`PO_SPEC` as operator-facing) · **`PO_SPEC`/A-F phase table @ lines 82-90 — LIVE-STALE** (full A-F `PM_DRAFT/PO_SPEC/UX_UI/.../AUDIT_T{n}` table present) · **`demo_signoff` @ line 50 — TOMBSTONE-OK** (note: "Consolida el viejo demo_signoff: UN solo signoff... en G") | none (`post-edit-checkpoint.sh` @ line 4 = TOMBSTONE-OK, explicitly "fue removido 2026-05-06"); `lifecycle.md`/`capability-protocol.md`/`release-protocol.md`/`definition-of-done-live-verify.md`/`demo-script.md` OK | `live_verify_infra` (dev-app), `brands[]` | **Y — CHECK 14 (`chris_verify:`+`rounds:`+`reconciled:` block — present lines 47-58)** | **conform-stale** (X6: demote `phase_workflow`/`PO_SPEC`/A-F table to internal-historical OR strike per "10 states + {G,R,C,D}"; PROCESS-MODEL §1 says "Letters become internal/historical only" — keep as historical-note, NOT as live operator field). PRESERVE CHECK-14 block. |
| 13 | `demo-script-template.md` | **hybrid** | 2 (line 3,7 dev-app) | **`demo_signoff:` @ line 31 — LIVE-STALE** (live YAML block Chris signs; D-X2/§5 retired → single `chris_verify.signoff` in G). Conflicts with checkpoint CHECK-14 home. | none (`definition-of-done-live-verify.md` OK) | `live_verify_infra` (dev-app) | N | **conform-stale** (replace `demo_signoff:` block → point at `checkpoint.md::chris_verify.signoff`; demo-script is the *script Chris runs in G*, the signoff LIVES in checkpoint, not duplicated here) |
| 14 | `dispatch-plan-template.md` | **hybrid** | 2 (line 17 `core/luana-core-*`, 42 dev-app) | **`demo_signoff` @ lines 45,47 — LIVE-STALE** (REFUSE-merge keys off `demo_signoff.result`; should be `chris_verify.signoff.result`) · **`v4.2` @ line 14 — TOMBSTONE-OK-ish** (cites self-fix `v4.2` carriles; v5 Responsable supersedes — see note) | none (`architect-autonomous-mode.md`/`auditor-self-fix-policy.md`/`hotfix-repro-mandatory.md`/`definition-of-done-live-verify.md` OK) | `engine_prefix` (line 17), `live_verify_infra` (dev-app) | **Y — CHECK 4 (file existence only)** | **conform-stale** (`demo_signoff` → `chris_verify.signoff`; `v4.2` self-fix → v5 Responsable per auditor-self-fix-policy.md). File-existence CHECK-4 is satisfied; don't rename file. |
| 15 | `PI-template.md` | hybrid (tokens 0; **DEPRECADO**) | 0 | none retired-token, but the WHOLE template is DEPRECADO (line 1: "metodología PI/Sprint reemplazada por Release") | `docs/projects/` MISSING (lines 5,6) · `roadmap.md` MISSING (line 16) — but inside an already-tombstoned artifact | — | N | **tombstone-already-OK** (DEPRECADO header present; W9 candidate-delete, not W6. Dead refs are inside the grave.) |
| 16 | `release-template.yaml` | **hybrid** | 1 (line 7 brand enum) | none | none | `brands[]` (line 7) | N | add-{slots} (`brands[]`) |
| 17 | `REVIEW-final-template.md` | **hybrid** | 5 (line 34 `.venv`+pytest+agentic_evals, 41/42/91/95 dev-app) | none | none (`definition-of-done-live-verify.md` OK; `agentic_evals` pattern OK = real per D-X3) | `toolchain`, `live_verify_infra` (dev-app), `domain_modules[]` | N | add-{slots} |
| 18 | `sprint-template.md` | hybrid (tokens 0; **DEPRECADO**) | 0 | none retired-token; WHOLE template DEPRECADO (line 1) | `docs/projects/` MISSING (line 5) — inside tombstone | — | N | **tombstone-already-OK** (W9 candidate-delete) |
| 19 | `story-agentic.yaml` | **hybrid** | 1 (line 188 `pytest agentic_evals/` example) | none | none (`eval_suite_path` points at `pytest agentic_evals/{module}/{story}.py` = real pattern) | `domain_modules[]`, `agent_roster`, `toolchain` (pytest) | N | add-{slots} (also flag: not cross-referenced by any skill — orphan-schema candidate, out of W6 stale-scope; note for W9) |
| 20 | `story-service.yaml` | **hybrid** | 1 (line 55 `auth: clerk-jwt`) | none | none | `live_verify_infra` (clerk), `domain_modules[]` | N | add-{slots} (orphan-schema candidate — same note as row 19) |
| 21 | `story-ui.yaml` | **core** | 0 | none | none (all `{placeholder}` FKs) | `domain_modules[]`, `agent_roster` (agent_owner enum line) | N | leave (proxy-clean; orphan-schema candidate note for W9) |
| 22 | `T-handoff-template.md` | **hybrid** | 9 (lines 54 alembic, 66/67/68 pytest+alembic, 77-81 ruff/pytest/`.venv`/alembic) | none | none (all `{placeholder}` src paths) | `toolchain` (ruff/pytest/alembic/`.venv`), `brands[]` (docker container name) | N | add-{slots} |
| 23 | `ticket-template.yaml` | hybrid (tokens 7; **DEPRECADO**) | 7 (lines 39 pytest, 46/70 alembic, 59/64/128/134 pytest) | none retired-token; WHOLE template DEPRECADO (line 1: "usar 06-tickets-template.yaml") | `docs/projects/` path (line 3, inside tombstone) | `toolchain`, `brands[]`, `domain_modules[]` | N | **tombstone-already-OK** (superseded by 06-tickets; W9 candidate-delete) |
| 24 | `T-impl-log-template.md` | **hybrid** | 11 (lines 31/36/42/65/66 pytest, 80/81 ruff, 83 pytest, 85 mypy, 96/100 dev-app) | none | none | `toolchain` (ruff/pytest/mypy/`.venv`), `live_verify_infra` (dev-app), `domain_modules[]` | N | add-{slots} |
| 25 | `T-result-template.md` | **hybrid** | 6 (lines 35 pytest, 49/60 alembic, 91 mypy, 136/140 dev-app) | none | none | `toolchain`, `live_verify_infra` (dev-app), `domain_modules[]` | N | add-{slots} |
| 26 | `T-review-template.md` | **hybrid** | 9 (lines 26/27/28/63 pytest+alembic, 104 `core/luana-core-*`+brand, 115/122/126 dev-app, 139 ruff+brand) | **`v4.2` @ line 5 — LIVE-STALE** (3-carriles A/B/C self-fix model; auditor-self-fix-policy is now v5 Responsable: default Carril R fix-and-own) | none (`core/luana-core-*` ref OK as engine pattern) | `toolchain`, `engine_prefix` (line 104), `live_verify_infra` (dev-app), `brands[]` | N | **conform-stale** (v4.2 3-carriles → v5 Responsable Carril R default + Carril C stake-asimétrico; PRESERVE the mechanism, update the model name + carril semantics per `.claude/rules/auditor-self-fix-policy.md`) |

---

## Tier rationale (option-b proxy, charter §0.5)

- **core (6):** `00-chris-input`, `00-research`, `00-story`, `01-spec`, `story-ui.yaml`, `02-design-ui` is NOT core (it's a dead-tombstone). Re-counting the 8 zero-hit files: `00-chris-input` ✓core · `00-research` ✓core · `00-story` ✓core · `01-spec` ✓core · `02-design-ui` = dead-tombstone (not live → not "core mechanism", it's a grave) · `PI` = DEPRECADO-tombstone · `sprint` = DEPRECADO-tombstone · `story-ui.yaml` ✓core. ⇒ **6 live-core** (the 4 `00-*`/`01-spec` skeletons + `story-ui.yaml`), 3 zero-hit-but-dead (02-design-ui/PI/sprint stay hybrid-tagged-dead, W9-delete candidates).
- **hybrid (18):** every token-carrying template — the *artefact SHAPE/skeleton is portable* (a ready-package, a ticket, a checkpoint frontmatter), the luana instance fields (ruff/pytest/`.venv`/alembic/clerk/dev-app/brand-enum/`core/luana-core-*`) are the **project half parked behind a seam slot**. Matches the W1→W4b precedent: templates are mostly hybrid, core is rare and earned by zero-token skeletons.
- **No `project`, no `brand`:** none of the root templates is a pure project/brand instance (brand overrides live at `{brand}/docs/specs/templates/01-spec-*-template.md`, out of W6-batch-T scope but caught by CHECK 9's `WS.glob`).

> **Proxy-clean note:** the proxy hits in core-candidate rows 3,4,21 are all `{placeholder}`/`{module}` path conventions, NOT concrete tech/brand tokens → they pass the grep (0 hits) and stay `core`. The `domain_modules[]` slot they "need" is only a W5 path-rewrite convenience, not a proxy violation today.

---

## Stale-vocab summary (the conformance worklist)

| token | files (file:line) | LIVE-STALE vs tombstone | W6 |
|---|---|---|---|
| `02-design-ui` (DEAD artifact, D-X2) | `03-arch:14` (`ui_design:` input), `06-tickets:357` (`ui_design:` input) | **LIVE-STALE** (cited as live FE input) | **repoint-dead** → `01-spec.md § Wireframes` |
| `02-design-ui` self | `02-design-ui-template.md:1,4` | **tombstone-OK** (line 4 declares obsolete) | tombstone-OK; W9-delete candidate after the 2 repoints above |
| `demo_signoff` (→ `chris_verify.signoff`, §5) | `demo-script:31` (live block), `dispatch-plan:45,47` (REFUSE keys off it) | **LIVE-STALE** | **conform-stale** → point at `checkpoint.md::chris_verify.signoff` |
| `demo_signoff` mention | `checkpoint:50` | **tombstone-OK** ("Consolida el viejo demo_signoff") | leave |
| `phase_workflow` / `PO_SPEC` / A-F phases (X6-retired) | `checkpoint:18` (live field), `checkpoint:82,83` (A-F table) | **LIVE-STALE** (live frontmatter + table) | **conform-stale** → demote to internal/historical-note ("10 states + {G,R,C,D}" is the one vocabulary; PRESERVE CHECK-14) |
| `v4.2` (auditor self-fix → v5 Responsable) | `T-review:5`, `dispatch-plan:14` | **LIVE-STALE** | **conform-stale** → v5 Responsable (Carril R default + Carril C stake-asimétrico) |
| `atomics` (killed 2026-05-28) | — none | — | — |
| `outcomes/` | — none in templates (note: brand-purge, platform-alive — N/A here) | — | — |

**Phantom refs (dead, truly missing):**
- `04-validators:240,253,261,273,291` — `scripts/{run_agent_evals,run_trajectory_eval,check_cost_budget,check_voice_fidelity,run_adversarial_suite}.py` ALL ABSENT (self-labeled `# MISSING`). Per PROCESS-MODEL §5 D-X3 + §8 ("Phantom scripts: cited, missing → purged / pointed at real pytest") → **repoint to `pytest tests/agentic_evals/`** (real dir exists at vitalia+comunify; the OTHER templates 03-arch/06-tickets/07-merge/ticket/REVIEW-final already use this real pattern — 04-validators is the lone laggard).
- `04-validators:321` — `scripts/scan_cross_brand_mirror.sh` ABSENT (`# MISSING`) → repoint to the real anti-duplication mechanism or strike.
- `checkpoint:4` `post-edit-checkpoint.sh` — **tombstone-OK** (explicitly "fue removido 2026-05-06 — lógica rota").
- PI/sprint/ticket-template `docs/projects/` + `roadmap.md` — MISSING but inside DEPRECADO graves (no W6 action; W9-delete).

---

## 01-spec inversion notes (REQ-TAKING-DETAIL §10)

**Current `01-spec-template.md` section order (verbatim headings):**

```
L1   # 01-spec.md — Template (PO)
L20  ## Resumen ejecutivo
L24  <!-- ═══ RONDA 1 · input-spec · ✍ FIRMA 1 — solo /po-ux UI ═══ -->
L26  ## § Dónde vive (RONDA 1)          [Zona/caja · Shell · Ruta · Mockup BORRADOR (line 33)]
L35  ## § Mapa funcional (capa humana — ratifica Chris ANTES de UX/architect)
L43    ### 1. Happy path (narrado, human bullets)
L51    ### 2. Bifurcaciones (árbol de decisión)
L65    ### 3. Reglas de negocio (RN — human)
L72    ### 4. Criterios de aceptación (AC — checklist)
L79  <!-- ═══ RONDA 2 · spec ejecutable · ✍ FIRMA 2 → refining→refined (incluye mockup FINAL + graders) ═══ -->
L81  ## Acceptance Criteria (Gherkin AI-resistant)   [Scenarios 1-11, each w/ `Covers:` IDs]
L152 ## ★ Sub-categorías mandatory v4.1
L293 ## § Matriz de cobertura (el puente humano ↔ verificación)   [LEDGER VIVO + PISO HARD]
L322 ## Non-functional requirements
L334 ## Constraints técnicos heredados
L339 ## Cross-module impact
L346 ## Open questions
L351 ## Próximo paso
L357 ## Changelog
```

**What the machinery asserts (PRESERVE these exact strings on any W6 edit):**
- **CHECK 9** (`check_spec_template_drift`, validator L274-300) — substring-presence (not header-exact) of `MANDATORY_SPEC_CONCEPTS`: `"Mapa funcional"`, `"Matriz de cobertura"`, `"FIRMA 1"`, `"FIRMA 2"`. Also runs over every `{brand}/docs/specs/templates/01-spec-*-template.md` override → any new concept cemented here must be propagated + added to the list (W6 propagation duty).
- **CHECK 25** (`check_ledger_estado_column`, L631-650) — `"LEDGER DE COBERTURA VIVO"` + `"✅ construido"` must stay in `§ Matriz de cobertura` (L303-311); auditor-skill side asserts `"Ledger de cobertura"`+`"congela"`.
- **CHECK 27** (`check_ledger_happy_floor`, L671+) — `"PISO HARD"` + `"cap_change_type"` must stay in spec (L308-309); also asserted in dev-team skill + story-closure-gate.
- **CHECK 9 markers** `"FIRMA 1"`/`"FIRMA 2"` live in the RONDA-1/RONDA-2 HTML comment delimiters (L24, L79).

**The inversion gap (REQ-TAKING §10 + §4 "functional-first, form-after"):** The template **already implements** the *ordering* invariant — `§ Mapa funcional` (human bullets) sits at L35, ABOVE the Gherkin `Acceptance Criteria` at L81, and the 2-signature gates (FIRMA 1 → FIRMA 2) are wired. **What W6 must still change** (surgical, not a rewrite):

1. **Make the mockup-final an explicit section between FIRMA-1 and the Gherkin.** Today the *draft* mockup is a one-liner inside `§ Dónde vive` (L33, "Mockup borrador… la FORMA, se itera"), and the RONDA-2 delimiter (L79) only *mentions* "incluye mockup FINAL". §10 requires the **creative mockup-final as its own RONDA-2-opening step** (full shell + corresponding leaf/hoja + all conversed fields + all atoms, **composed-from-canon**, "may improve on the text"), landing **AFTER `§ Mapa funcional` (firma-1) and BEFORE the Gherkin block**. → Add a `## § Mockup final (RONDA 2 · compose-from-canon · ANTES del Gherkin)` heading right after the L79 delimiter, before L81.
2. **State that Gherkin + Matriz + business-rules + design-spec are GENERATED at firma-2**, not hand-authored during refinement (§10 "Gherkin/matrix/business-rules/design-spec **generated** at firma-2"). The Gherkin/Matriz sections (L81, L293) should carry a one-line "Generado en FIRMA 2 desde el § Mapa funcional + mockup-final — NO se redacta a mano en el refinamiento" banner.
3. **Document the comment-marker convention** (§5 / REQ-TAKING-DETAIL): the live cockpit-editable doc + Chris's `> 🗨️ CHRIS:` blockquote marker for his notes (distinguish his comments from the doc body) + "the refiner reconciles notes into a clean doc". → Add a short `<!-- comment-marker: > 🗨️ CHRIS: … -->` convention note near the top (after Resumen ejecutivo / before RONDA-1), so the producer skill (`/po-ux`, W2) and the cockpit editor know the marker.
4. **RONDA-1 `§ Pantallas` as a field table (new-vs-existing) WITHOUT a mockup** (§10: "RONDA-1 `§ Pantallas` = field table (new vs existing) **without** a mockup"). Today `§ Dónde vive` carries a *draft* mockup link at L33 — §10 wants the RONDA-1 to enumerate **views + fields telling Chris which are NEW vs which already EXIST** in bullets, deferring the creative mockup to RONDA-2. → Either rename/extend `§ Dónde vive` with a `§ Pantallas (campos: nuevo vs existente)` sub-section, or fold the field-new/existing table into `§ Mapa funcional`; keep the L33 "borrador" as optional FORMA-only, not the creative final.

**Net W6 edit shape for 01-spec:** preserve every asserted string (CHECK 9/25/27), keep the existing functional-first ordering, and INSERT (a) the explicit mockup-final RONDA-2 section before Gherkin, (b) the "generated-at-firma-2" banners, (c) the comment-marker convention, (d) the RONDA-1 new-vs-existing field table. No section deletion; the inversion is an *insertion + annotation*, because the human-bullets-before-Gherkin spine is already present.

---

## W6 action rollup (for the apply session)

- **invert-functional-first (1):** `01-spec-template.md` (insertion+annotation per §inversion; PRESERVE CHECK 9/25/27 strings) + propagate any new cemented concept to brand overrides + `MANDATORY_SPEC_CONCEPTS`.
- **repoint-dead (3):** `03-arch:14` + `06-tickets:357` (`02-design-ui.md` → `01-spec.md § Wireframes`); `04-validators:240-291,321` (5 agentic scripts → `pytest tests/agentic_evals/`; mirror-scan → anti-dup mechanism — don't touch CHECK-19 `mutation` block).
- **conform-stale (4):** `checkpoint` (`phase_workflow`/`PO_SPEC`/A-F → internal-historical; PRESERVE CHECK-14); `demo-script:31` + `dispatch-plan:45,47` (`demo_signoff` → `chris_verify.signoff`); `dispatch-plan:14` + `T-review:5` (`v4.2` → v5 Responsable).
- **add-{slots} (most hybrids):** wire `toolchain`/`brands[]`/`engine_prefix`/`live_verify_infra`/`design_system_ref`/`domain_modules[]`/`agent_roster`/`value_stream` placeholders — but the **actual `{slot}` rewrite is W5** (charter §0.5 option-b). W6 only NAMES the slot per token; the rewrite waits.
- **tombstone-already-OK (4):** `02-design-ui-template.md`, `PI-template.md`, `sprint-template.md`, `ticket-template.yaml` — already DEAD/DEPRECADO with grave-headers; W9-delete candidates, NOT W6 (their dead refs live inside tombstones). Note: 02-design-ui can only be deleted AFTER the 2 LIVE input-refs (03-arch:14, 06-tickets:357) are repointed.
- **leave (5):** the 5 live-core skeletons (`00-chris-input`, `00-research`, `00-story`, `01-spec` body except inversion, `story-ui.yaml`).

**Orphan-schema flag (for W9, out of W6-stale-scope):** `story-ui.yaml`/`story-service.yaml`/`story-agentic.yaml` are not cross-referenced by any skill/agent (grep clean) — possible dead schemas superseded by `00-story.md` + per-state checkpoint. Verify before W9 reorg.

**`value_stream` slot:** not referenced by any template (it's a cockpit `map-zones.ts` concern, charter §3) — no template carries it; listed only for completeness.
