<!-- voseo-allowed: doc interno de proceso (harness refactor W0.5 AS-IS), no user-facing -->
# WT3 — Agentic (conversational flow / AI action) · AS-IS reconstruction

> **W0.5 process-model · operator POV.** Reconstructs how an *agentic capability* really flows idea→done, emphasizing the DELTAS from the shared product-dev spine (the SPINE agent reconstructs the common backbone; this doc only covers what is DIFFERENT for agentic work). Every claim cites `file:line` of the real surface. Verified against the live `.claude/` + `docs/` surface 2026-06-08.
> **Inputs:** charter `docs/process/harness-refactor-charter-2026-06-08.md` §1 (3-layer model) + §1.5 (WT taxonomy: WT3 row = `po+ux-agentico→…`, cockpit `/board · agents`, maturity "mature").

---

## 1. Definition

**WT3** = building (or extending/modifying) a **Plano-3 worker capability** — a conversational/agentic flow where an AI agent operates a Plano-2 action *for* the user — on **brand-extension surfaces only** (`{brand}/backend/src/modules/{brand}/{copilot,sales_agent}/`), with the shared engine (`core/luana-core-{copilot,sales-agent}/`) off-limits behind the `/pm-luana` lift gate.

The spine (idea→refining→refined→ready→developing→developed→[G/R]→reviewing→done; pm/po/architect/dev/auditor; TDD/DoD/git-safety) is identical. WT3 swaps **what each phase produces and gates on**.

---

## 2. Delta table vs spine (per phase)

| Phase | Agentic specifics (DELTA) | Shared with spine |
|---|---|---|
| **refine — spec** | `/po` writes `01-spec.md` with `type: agentic-story`; the spec is the SAME skill as service-stories but the graders are richer: `tool_calls` (required/forbidden/max), `llm_rubric`, `voice_fidelity`, `state_check target: copilot_trace_event`, `transcript_constraint` (`po/SKILL.md:170-187`). Personas+rubrics+`trial_policy` (pass^k) assigned at spec time (`po/SKILL.md:189-202`). Agentic-story stays in `refining` after spec ratify — NOT promoted to `refined` until design exists (`po/SKILL.md:245,257-263`). | §Mapa funcional + §Matriz de cobertura (human layer) (`po/SKILL.md:131-133`); 4-scenario floor happy/negative/edge/adversarial; Chris ratify loop; chris-input append. |
| **refine — design (2nd pass)** | **WT3-ONLY 2nd skill** `/ux-agentico` (Opus, `ux-agentico/SKILL.md:5`) consumes `01-spec.md` → produces `02-design-agentic.md`: 13 steps — turn-by-turn happy path, state machine, tools sequence, **prompt slot architecture (cache TTL 5min/1h)**, voice constraints, error-recovery matrix, eval policy (personas+rubrics+pass^k), cost/latency budget, observability (`ux-agentico/SKILL.md:82-229`). HARD-GATE skills: `copilot-expert`/`sales-agent-expert` + LangGraph docs + `claude-api` + graceful-degradation (`ux-agentico/SKILL.md:72-80`). **delta-spec loop back to /po** when design discovers a new persona/rubric/edge/tool (`ux-agentico/SKILL.md:231-239`, `po/SKILL.md:266-272`). Only on design ratify → `refining→refined` (`ux-agentico/SKILL.md:274-282`). | Chris ratify loop; cap_target + cap_change_type validation (`ux-agentico/SKILL.md:272`); caja/zona derived from SYSTEM-MAP (paradigm tree). |
| **arch — ready package** | Same `/architect` orchestrator, but with agentic surfaces: `03-arch.md` carries a `§ AGENTIC` section (LangGraph state shape, deepagents subagents, prompt-cache slots, observability writes); `04-validators.yaml` adds the **`agentic_eval` category** (pass^k, rubrics, trajectory, cost/latency budgets) (`architect/SKILL.md:297-325`). Reads `02-design-agentic.md` as required input when agentic (`architect/SKILL.md:33`). **Engine-boundary ticket ban** — NEVER emit tickets editing `core/luana-core-*/src/`; brand-extension `{copilot,sales_agent}/{tools,extractors,workflows,personas,goldens,kb}/` IS editable (`architect/SKILL.md:135-136`). | 4-5 artifacts (`03-arch`+`04-validators`+`05-guidelines`+`06-tickets`+`dispatch-plan`); CONN Integration design; Prior-art audit; Test Construction Plan; refined→ready. |
| **arch — ticket split + assignment** | AGENTIC tickets **ALWAYS separated** from BE/FE (so the model assignment is unambiguous) (`architect/SKILL.md:603-604,131`). R23: AGENTIC `production_code:true` → `claude_opus_required:true` / `model_preference: opus` HARD (`architect/SKILL.md:617,795`; `architect-autonomous-mode.md` ref `:85-99`). `primary_agent: builder-agentic`, `forbidden_to_touch: core/luana-core-{copilot,sales-agent}/src/` (`autonomous-mode.md:81-99`). | `assignment` block per ticket; `dispatch-plan.md`; `forbidden_to_touch`; `must_load_skills`. |
| **dev — build** | Owner is **`builder-agentic` (Opus 4.8 obligatorio, in-same-session)** for AGENTIC `production_code:true` — opencode/sonnet HARD-BANNED (`dev-team/SKILL.md:209,215,824`; `builder-agentic.md:26`). Mandatory date-aware research (Step 0 `date`) + LangGraph/deepagents/prompt-cache canonical-docs WebFetch (`builder-agentic.md:53-58,143-152`). Brand-extension surfaces only; engine = `BLOCKED -> requires /pm-luana lift` (`builder-agentic.md:35-51,76`). TDD: **eval goldens RED first** + graph integration tests (`builder-agentic.md:431-434`; `dev-team/SKILL.md:386`). | ticket-by-ticket implement→validators→fix→GREEN; impl-log; context-builder brief; gate-runner; Step 4.6 live-verify HARD gate (`dev-team/SKILL.md:915`). |
| **dev — agentic invariants** | Prompt-cache slot integrity (no timestamps/conv_id/tenant_name mid-prefix; `cache_control` on last cacheable block; `cache_read_tokens>0` validated) (`builder-agentic.md:549-572,856`). Every LLM call wrapped with `copilot_llm_call`+`copilot_trace_event` observability (best-effort try/except) — naked LLM call = audit FAIL (`builder-agentic.md:574-631,813`). `AsyncPostgresSaver` not `MemorySaver`; max-iter guard; `tenant_id` in every state/tool/RAG query; model from `luana_core_llm.router.get_for_role` not hardcoded (`builder-agentic.md:214-222,811,816`). | DDD Inside-Out; tenant isolation; structlog; conventional commits; native-first gates. |
| **verify — G/R** | Agentic live-verify bar (DoD #37): **run the real turn/tool + read `copilot_trace_event` traces + eval goldens** — "the endpoint responded" does NOT count (`definition-of-done-live-verify.md:108`). `chris_verify.signoff` in G as for any functional story. | G `AWAIT_CHRIS_VERIFY` pause-y-ofrece; R reconcile by pm; `chris_verify.signoff`; reconciled:true precondition. |
| **verify — audit** | `auditor-agentic` (Opus, 14-16 categories) (`auditor.md:136`, `auditor-agentic.md`). **Self-fix is RESTRICTED to mechanical only** — ANY behavior change (prompt slots, eval goldens, state machine, tool logic, brand voice) → Carril B/C because agentic gates are non-deterministic and a self-fix would *overfit the golden* (`auditor-agentic.md:33,444`; `auditor-self-fix-policy.md:37-38,58`). Cat 3 prompt-cache, Cat 5 observability, Cat 6 eval goldens, Cat 13 mirror, engine-edit AUTO-FAIL (`auditor-agentic.md:158-343`). | gate-runner verdict; gherkin matrix Phase D; downstream regression; APPROVED→pm merge; verdict math mechanical. |

---

## 3. Actors / skills specific to WT3

| Actor | Type | Role in WT3 | File |
|---|---|---|---|
| `/po` | skill (Opus) | agentic-story SPEC (richer graders, personas, pass^k) | `.claude/skills/po/SKILL.md` |
| `/ux-agentico` | skill (Opus) | **2nd refine pass** — `02-design-agentic.md` (the WT3-defining artifact) | `.claude/skills/ux-agentico/SKILL.md` |
| `/architect` (+`architect-orchestrator`) | skill+agent | ready package with `§ AGENTIC` + `agentic_eval` validators + R23 ticket split | `.claude/skills/architect/SKILL.md` |
| `builder-agentic` | agent (Opus, `maxTurns:150`) | exclusive owner of brand-extension `{copilot,sales_agent}/` build | `.claude/agents/builder-agentic.md` |
| `auditor-agentic` | agent (Opus, `memory:user`) | 14-16 category mechanical review, restricted self-fix | `.claude/agents/auditor-agentic.md` |
| `copilot-expert` | skill | internal-agent domain (LangGraph state, deepagents, trace schema, slot architecture) | `.claude/skills/copilot-expert/SKILL.md` |
| `sales-agent-expert` | skill | external-agent domain (PersonalityProfile SSoT, compiler-v2 6-block, voice grader, goldens) | `.claude/skills/sales-agent-expert/SKILL.md` |

Loaded-on-demand (cited HARD GATE but NOT local `.claude/skills/`): `claude-api` (global/plugin), LangGraph canonical docs (WebFetch), graceful-degradation (**no local skill** — see findings).

---

## 4. Gates that differ (WT3-specific)

| Gate | What it enforces | file:line |
|---|---|---|
| **R23 Opus-obligatorio** | AGENTIC `production_code:true` → Opus only; opencode/sonnet HARD-BANNED | `architect/SKILL.md:617`; `dev-team/SKILL.md:824`; `builder-agentic.md:26`; `auditor-self-fix-policy.md:235`(ref) |
| **Engine-boundary / lift gate** | builder/architect NEVER edit `core/luana-core-{copilot,sales-agent}/src/`; requires `/pm-luana` promotion proposal | `builder-agentic.md:35-51,76`; `auditor-agentic.md:54,353`; `ux-agentico/SKILL.md:18-29` |
| **Eval golden pass^k** | `agentic_eval` validators: `trials:3, per_trial:0.66, pass_k:0.5`; specialist added → ≥3 goldens | `architect/SKILL.md:300-310`; `po/SKILL.md:196-202`; `auditor-agentic.md:197-202`(Cat 6) |
| **Prompt-slot / state-machine = stake-asimétrico Carril C** | behavior change in prompt slots / eval goldens / state machine / brand voice can NEVER be auditor self-fixed (overfit risk) — always Carril C (or B) | `auditor-self-fix-policy.md:11-12,37-38,58`; `auditor-agentic.md:33,444`; `auditor.md:295` |
| **Agentic live-verify (real turn + traces)** | DoD bar: run real turn/tool + read `copilot_trace_event` + eval goldens; GET-200 insufficient | `definition-of-done-live-verify.md:108`; `dev-team/SKILL.md:915`(Step 4.6 HARD) |
| **Observability wrapper mandatory** | naked LLM call (no `copilot_llm_call`/trace) = audit FAIL | `builder-agentic.md:813`; `auditor-agentic.md:193-196`(Cat 5) |
| **Cross-brand mirror → core** | agentic mirror across brands must lift to `core/luana-core-*` | `auditor-agentic.md:249-269`(Cat 13); `anti-duplication.md` |
| **autonomous_mode HARD false** | any AGENTIC `production_code:true` ticket forces `autonomous_mode:false` (Chris supervises Opus) | `autonomous-mode.md:41,46` |

---

## 5. Artifacts that differ

| Artifact | Why WT3-specific | file:line |
|---|---|---|
| **`02-design-agentic.md`** | the defining WT3 artifact — produced ONLY for agentic by `/ux-agentico`; no UI/service equivalent | template `docs/specs/templates/02-design-agentic-template.md`; `ux-agentico/SKILL.md:96-229` |
| **eval goldens** | golden conversations per specialist (≥3); real home `{brand}/backend/tests/agentic_evals/{copilot,sales_agent}/` | `builder-agentic.md:657-673`; verified dir `vitalia/backend/tests/agentic_evals/sales_agent/test_pass_k_evaluation.py` |
| **`delta-spec.md`** | agentic-only loop: design discovers edge → back to /po | `ux-agentico/SKILL.md:231-239`; `po/SKILL.md:266-272` |
| **prompt slot specs** | slot 1-6 cache layout in 02-design + 03-arch `§ AGENTIC` | `ux-agentico/SKILL.md:149-177`; `02-design-agentic-template.md:92-104` |
| **trace evidence** | `copilot_trace_event`/`copilot_llm_call` rows as live-verify evidence | `definition-of-done-live-verify.md:108`; `builder-agentic.md:574-631` |
| **personas + rubrics** | `docs/specs/personas/`(archetype-aware) + `docs/specs/rubrics/`(10 .md verified) consumed, not reinvented | `po/SKILL.md:62-63,189-194`; verified `docs/specs/rubrics/voice-fidelity.md` etc. |

---

## 6. Cockpit view

Charter §1.5 maps WT3 to **`/board · agents`**. The "Agentes" zone is one of the 3 SYSTEM-MAP zones (`PARADIGM.md:74`): the boxes of the 5 specialists (Lisa·Valeria/Mateo·Adrián·Lucas·Camila), `user_visible:true`. An agentic cap shows up by: (a) `agent_owner` declaring its box (Plano-3 worker) (`capability-protocol.md:205,232`); (b) the **Agentes zone** derived from that box via `SYSTEM-MAP.yaml` `zones[].boxes` (`PARADIGM.md:70,135`); (c) N1 cap-levels badge (`verified_real` / `e2e_test` / debt) driving whether the agentic turn was truly verified (`capability-protocol.md:616,621-625`). **Valeria = supervisor with NO value box** — her runtime lives in `infraestructura · motor-agentico`, surfaced as `ValeriaSidebar` (`SYSTEM-MAP.yaml:194,270-280`). The **engine** (`motor-agentico.copilot`/`sales-agent-engine`) is `user_visible:false` Infraestructura — the worker's runtime, NOT a feature box competing with the agents (`PARADIGM.md:76`; `SYSTEM-MAP.yaml:190`).

**Cockpit gaps:** (1) charter §1.5 says "unify cockpit visibility" — the **session-mapping `🔨 lane`** and the agents-zone board are separate views; no single view ties an in-flight WT3 story (developing) to its target agent box. (2) Cap-levels badge `verified_real` is cabled (`capability-protocol.md:625`) but there is no cockpit widget that surfaces the *agentic-specific* live-verify (turn ran + traces) vs ordinary functional live-verify — they collapse to one badge. (3) The Plano-3 supervisor (Valeria) has no value-box, so an auto-extension / multi-step-compose capability (ADR-013 §5b) has no obvious cockpit home today.

---

## 7. Core-vs-Project split candidate (tag the deltas)

| Concept | tier | rationale |
|---|---|---|
| "Agentic flow has a **design pass** (2nd refine skill) on top of spec" | **CORE** | tech-agnostic: any agent product separates *what the flow does* (spec) from *how it converses* (design). |
| "Agentic capabilities have an **eval gate** (golden + multi-trial pass^k) distinct from deterministic tests" | **CORE** | the non-determinism gate (overfit-aware self-fix ban) is a generic doctrine, not luana-specific. |
| "Agentic build sits behind an **engine-boundary / lift gate**" | **CORE** | "shared agent runtime is owned centrally; instances extend it" is a clean-arch invariant (DIP). |
| "Behavior changes (prompt/state/voice) are **stake-asimétrico**, never mechanical self-fix" | **CORE** | risk doctrine, generic. |
| "**Opus-obligatorio for agentic production code**" (R23) | **CORE-as-policy / PROJECT-as-value** | the *principle* "use your strongest model for agent correctness" is CORE; the literal model name `Opus 4.8` is a PROJECT slot. |
| LangGraph 2.0 / deepagents / `SubAgentMiddleware` / `AsyncPostgresSaver` | **PROJECT** | concrete framework. CORE should say "state machine + subagent isolation + durable checkpointer"; the names are slots. |
| Anthropic prompt-cache slots / 5min-1h TTL / `cache_read_input_tokens` | **PROJECT** | concrete provider mechanic. |
| Qdrant / `KnowledgeService` RAG | **PROJECT** | concrete vector store. |
| `copilot_trace_event` / `copilot_llm_call` / `model_pricing_snapshot` tables | **PROJECT** | concrete observability schema. CORE = "every agent turn is traced + costed". |
| `core/luana-core-copilot` / `core/luana-core-sales-agent` engine prefix | **PROJECT** | `engine_prefix` seam slot (charter §3). |
| Valeria supervisor + Lisa/Adrián/Lucas/Camila/Mateo roster + internal(copilot)/external(sales_agent) audience split | **BRAND** (roster) / **PROJECT** (the engine-pair pattern) | charter: "stage = stable interface (core); roster + processes = brand instance" (`PARADIGM.md:102`). |
| `docs/specs/personas/` + `docs/specs/rubrics/` libraries | **PROJECT** (structure CORE; content PROJECT/BRAND) | rubric *format* is generic; `vertical-medical-fidelity.md` is brand. |

---

## 8. Scatter / contradiction / gap findings (file:line)

1. **Eval-runner scripts cited in validators DO NOT EXIST anywhere in the repo.** `architect/SKILL.md:303,315,322` templates `scripts/run_agent_evals.py`, `scripts/run_trajectory_eval.py`, `scripts/check_cost_budget.py` — `find` over the whole repo returns nothing. The REAL agentic eval suite is `vitalia/backend/tests/agentic_evals/sales_agent/test_pass_k_evaluation.py` (pytest, `trials_per_scenario=3`, `pass_k_threshold=0.5`), and the auditor runs `pytest --trials=3 tests/agentic_evals/` (`auditor.md:485`). So the architect template prescribes a **non-existent invocation mechanism** while the auditor/dev use a different real one → architect-generated `04-validators.yaml` agentic validators are unrunnable as written. **High-signal: the WT3 eval gate's SSoT invocation is split between a phantom (architect template) and the real pytest suite.**

2. **`graceful-degradation` skill is cited as a HARD GATE but has no local home.** `ux-agentico/SKILL.md:79`, `builder-agentic.md:135,344,398` and `architect/SKILL.md:119` all load "graceful-degradation (timeout + fallback + circuit breaker)" as a mandatory skill — but `.claude/skills/graceful-degradation/` does not exist (it reads as inline prose, not an invocable skill). Skipping a "mandatory skill" = audit FAIL (`builder-agentic.md:139`), yet the skill is unmaterialized → either a phantom dependency or it should be downgraded from "skill" to "rule/inline doctrine".

3. **Eval-policy SSoT is scattered across ≥4 surfaces with no single home.** pass^k thresholds live verbatim in `po/SKILL.md:196-202`, `ux-agentico/SKILL.md:202-211`, `02-design-agentic-template.md:124-140`, `architect/SKILL.md:300-310`, the rule `definition-of-done-live-verify.md:108`, AND the real test file. There is no `docs/process/agentic-eval-policy.md` SSoT — the same `trials:3/0.66/0.5` numbers are re-stated in 5 places (charter "high cohesion" smell: "3 rules re-state what is verified").

4. **Agentic process is under-specified vs UI process in the human-layer.** The §Mapa funcional + gherkin-matrix machinery (`po/SKILL.md:131`) was designed UI-first; `ux-agentico/SKILL.md:116-122` *bolts on* a note telling the designer to sync the turn-by-turn happy path with the spec's §Mapa funcional, but there is no agentic-shaped template for "branch tree of a conversation → eval" the way UI has `scenario_to_test` + POMs (`architect/SKILL.md:384-477` is entirely Playwright/POM/route-shaped, zero agentic-trajectory analogue). An agentic branch (intent-out-of-scope, loop, recovery, injection) maps to a rubric/golden, but the architect's `test_construction_plan` has **no agentic creation_order/trajectory_to_golden mapping** — only the Playwright one. WT3 reuses a UI-shaped plan that doesn't fit.

5. **Engine-vs-brand boundary is consistent but the lift workflow is a dead-end in autonomous mode.** Every WT3 surface correctly says "engine edit → `/pm-luana` lift" (`builder-agentic.md:76`, `auditor-agentic.md:353`, `architect/SKILL.md:135`). But `builder-agentic.md:357-381` (Step 0.5) describes default-flip detection for `core/luana-core-platform/config.py` flags **then immediately notes the flip itself requires a lift outside the agent's scope** — i.e., the agent carries dead detection logic it can never act on. Minor: the boundary is over-described in the builder where it can only `BLOCKED ->` escalate.

6. **`02-design-agentic-template.md` frontmatter `story_yaml` path is stale.** Line 16 points to `../../../../../product/stories/{module}/{story-id}.yaml` (pre-2026-05-28 4-eje / pre-multibrand layout) — story YAMLs are dead (atomics+outcome killed, `MEMORY sdd-consolidation`), and post-reorg paths are `{brand}/docs/product/stories/{id}/`. The template's `links:` block references a layout that no longer exists.

7. **Enforcement-layer ⏳ rot in autonomous-mode.** `autonomous-mode.md:218-227` lists 5 of 7 enforcement layers as `⏳` (template update / skill update / hook TBD) — including layer 6 "Auditor Phase D detects `forbidden_to_touch`/`playwright_visual_scope` violation". Per the program's own learning ("rule with ⏳ filas in enforcement = paper rule"), the agentic `forbidden_to_touch` (engine paths) gate may be partially aspirational at the auditor layer.

---

(End AS-IS WT3.)
