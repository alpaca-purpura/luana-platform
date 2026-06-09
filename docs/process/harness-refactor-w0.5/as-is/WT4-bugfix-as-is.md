# WT4 — Bugfix / Hotfix (technical or UI) · AS-IS map (operator POV)

> **W0.5 · Process Model · AS-IS reconstruction.** Scope: the 4th story type (`bugfix`, ADR-011) — the *lite* lifecycle: repro-first, less design ceremony, same 10 states, `cap_change_type=fix/extend`. Plus the orthogonal `hotfix-repro-mandatory` ticket gate. Every claim is `file:line`. This doc is descriptive (what IS), not prescriptive.
> **Method note:** every path verified with `ls`/`grep` before citing. Missing/stale paths are recorded as findings (§8).

---

## 1. Definition + the (a)/(b) split

**WT4 (one line):** a story that **fixes broken behavior** OR **completes half-wired functionality**, surgical scope (1-N files, ≤1-2 days), **no new design** — same 10 macro states, reduced *design* ceremony, never reduced *verification*. (`ADR-011-bugfix-story-type.md:17-18`; `docs/process/lifecycle.md:74,76`.)

WT4 in practice is **two distinct things that the harness conflates under one banner**:

| Variant | What it is | Origin | First-class as | SSoT |
|---|---|---|---|---|
| **(a) planned bugfix story** | a `bugfix`-typed story that runs the full 10-state spine in lite mode (po/po-ux → architect lite → dev → auditor → pm merge) | backlog item, known broken behavior, or a `completion` of half-wired work | **story type** `type: bugfix` | `ADR-011`, `lifecycle.md:74-82` |
| **(b) urgent hotfix** | a *ticket-level* gate (R26) that fires when a fix originates from a handoff/incident/escalation, forcing local repro BEFORE the builder is spawned | handoff doc / `pase-producción` failed / auditor escalation / `T-N.bis` sub-ticket | **ticket flag** `repro_verified` | `hotfix-repro-mandatory.md`, `rules-detail/hotfix-repro-mandatory.md` |

**The relationship (per ADR-011):** (b) is the older, narrower mechanism (PI-12 S1 T-1.bis, 2026-05-05) operating "a nivel de **ticket**, no como **tipo de story**" (`ADR-011:11`). (a) was created 2026-05-30 to lift repro-first "blindado a nivel story (no solo ticket)" (`ADR-011:28`) and the `bugfix` story **inherits** the R26 gate: `repro_verified: true` in `checkpoint.md` before `developing` (`ADR-011:19`, `lifecycle.md:77`). So conceptually **one repro-first doctrine, two enforcement altitudes** (story-level for planned bugfix, ticket-level for any hotfix ticket inside any story type). They are NOT cleanly merged in the docs — see §8 finding F1.

---

## 2. Lifecycle states — what is LIGHTER, what is NOT

WT4 traverses **all 10 macro states** (`idea → refining → refined → ready → developing → developed → reviewing → done`, + `parked`/`dropped`) — identical to WT1/2/3 (`ADR-011:18`; `lifecycle.md:76`; `bugfix-story-type.md:12`). The compression is in **artifacts of design only**.

| State | Spine (WT1-3 full) | WT4 bugfix (lite) | LIGHTER? |
|---|---|---|---|
| idea | chris-input + checkpoint | same | = |
| refining | `01-spec.md` full Gherkin + `§ Mapa funcional` (happy path narrado + bifurcaciones + RN + AC) | `01-spec.md` **corto** with **regression scenarios**; happy path **opcional**, foco en repro + branch + RN (`po/SKILL.md:133`; `po-ux/SKILL.md:214`); **no `02-design-*`/mockups** salvo UI nueva (`lifecycle.md:78`) | **YES (design)** |
| refined | `/pm-{brand}` closes | same | = |
| ready | 5-artifact ready package (`03-arch`+`04-validators`+`05-guidelines`+`06-tickets`+`dispatch-plan`) (`ADR-011:7`) | **reduced**: `06-tickets` + `04-validators` con regression scenarios; `03-arch`/`05-guidelines`/`dispatch-plan` **opcionales o inline**; "puede ir directo a tickets si no hay decisión arquitectónica" (`ADR-011:21`; `lifecycle.md:79`) | **YES (arch)** |
| developing | TDD build | **same TDD** + repro-first HARD gate must already be `true` | = (+gate) |
| developed | DoD gate | **same DoD** (`ADR-011:23` "No se reduce") | **NO** |
| reviewing | auditor full | **same auditor** + story-closure-gate auto-handoff (`ADR-011:23`) | **NO** |
| done | pm merge + cap ledger + archive | same; `cap_change_type: fix`/`extend` (`lifecycle.md:80`) | **NO** |

**Explicitly NOT lighter (`ADR-011:23`; `lifecycle.md:81`):** TDD (RED→GREEN), story-closure-gate (G/R/auditor auto-handoff), anti-orphan CONN, quality gates (lint/arch-fitness/coverage/jscpd), **and DoD live-verify** (a `bugfix` is `dev_app_verified: required: true` by default in vitalia because it touches a user-reachable surface — `pm-vitalia/SKILL.md:245`). The bug-fix verification is a **modification of feature** → governed by DoD §6: `new_coverage` "Bug fix → test que reproduce el bug PRIMERO (RED), luego fix (GREEN)" + `regression_guard` intact (`definition-of-done-live-verify.md:175-183`).

**Escape (reclassification):** if new design emerges (mockups, arch decision, ≥1 feature scenario) → `/pm-{brand}` reclassifies `type` (bugfix → ui/service/agentic) **before closing `ready`** (`ADR-011:24`; `lifecycle.md:82`).

---

## 3. Actors / skills per transition

| Transition | Actor | Notes |
|---|---|---|
| idea → refining → refined | **`/po`** (BE/service bugfix) **or `/po-ux`** (UI bugfix), **modo lite** | po lists `bugfix` in its scope matrix (`po/SKILL.md:23`); **po-ux does NOT** (finding F2). Both fire Step 2.5 hotfix repro gate (`po/SKILL.md:96`; `po-ux/SKILL.md:167-169`). |
| refined → ready | **`/architect` lite** | reduced package (`ADR-011:21`). BUT architect SKILL has **no `bugfix` story_type** (finding F3) — only emits R26 ticket-level repro_evidence (`architect/SKILL.md:660-668`). |
| ready → developing | **`/dev-team`** | Step 0.6 hotfix repro gate: REFUSE spawn if `repro_verified` false/absent (`dev-team/SKILL.md:159-170`). |
| developing → developed | **`/dev-team`** builders | HARD developed-boundary gate (DoD `dod_evidence`) — same as spine (`definition-of-done-live-verify.md:190`). |
| developed → reviewing → done | **`/auditor`** (auto-handoff) → **`/pm-{brand}` merge** | auditor Carril R is the default for "bug funcional / build roto" → auditor self-fixes via TDD (`auditor/SKILL.md:700`). pm merge REFUSE without `dev_app_verified` (`pm-vitalia/SKILL.md:245`). |

---

## 4. Gates (file:line)

| Gate | Where enforced | file:line |
|---|---|---|
| **Repro-first (story-level, HARD)** — `repro_verified: true` before `developing` | ADR-011 + lifecycle + checkpoint | `ADR-011:19`; `lifecycle.md:77`; `checkpoint-template.md:36-37` |
| **Repro-first (ticket-level, R26)** — `/po` repro before spec | `po/SKILL.md:96-125` ("Sin Step 2.5 → /architect refuses … /dev-team refuses build") |
| **Repro-first (ticket-level, R26)** — `/dev-team` REFUSE spawn if `repro_verified` false/absent | `dev-team/SKILL.md:165-170` |
| **Repro-first (ticket-level, R26)** — `/architect` emits `repro_evidence` per ticket | `architect/SKILL.md:660-668` |
| **Repro-real, not GET 200** — repro = ejercer acción/write + leer logs | `ADR-011:19`; `lifecycle.md:77`; `bugfix-story-type.md:15` |
| **Regression-test-RED-first** — TDD bug fix reproduces bug first | `tdd-mandatory.md:6`; `debugging.md:52`; `definition-of-done-live-verify.md:181` |
| **Root-cause-only** — "Root cause only. … Una hipótesis por fix. Regression test FIRST" | `debugging.md:51-52` |
| **regression_guard intact** — untouched-behavior tests stay green unmodified | `definition-of-done-live-verify.md:179,183` |
| **Live-verify if user-reachable** — `dev_app_verified` required for bugfix | `pm-vitalia/SKILL.md:245`; `definition-of-done-live-verify.md:175-183` |
| **Diagnosis-validation** — match/mismatch/no-repro decision tree | `rules-detail/hotfix-repro-mandatory.md:54-69`; `po/SKILL.md:110-113` |

**repro_evidence schema** (`rules-detail/hotfix-repro-mandatory.md:74-84`): `repro_verified`, `repro_evidence.{brand,command,output,diagnosis_validates_handoff,diagnosis_correction}`. In checkpoint it's `hotfix_metadata.{repro_verified,repro_command,diagnosis_validates_handoff,diagnosis_correction}` (`po/SKILL.md:116-122`; `checkpoint-template.md:36-37`) — **two slightly different key names** (finding F5).

---

## 5. Artifacts — present vs omitted

| Artifact | Full story | WT4 bugfix |
|---|---|---|
| `checkpoint.md` | yes | yes (`type: bugfix`, `repro_verified`, `cap_change_type: fix/extend`) |
| `chris-input.md` | yes | yes (R4 brand-docs-schema) |
| `01-spec.md` | full Gherkin + Mapa funcional | **short**, regression scenarios, repro evidence in `§ Context` |
| `02-design-ui.md` / `02-design-agentic.md` | yes (ui/agentic) | **OMITTED** unless UI nueva (`lifecycle.md:78`) |
| `03-arch.md` | yes | **optional/inline** (`ADR-011:21`) |
| `04-validators.yaml` | yes | **yes (reduced)** — regression scenarios, `regression_guard` |
| `05-guidelines.md` | yes | **optional/inline** |
| `06-tickets.yaml` | yes | **yes** + `repro_evidence` per ticket |
| `dispatch-plan.md` | yes | **optional** |
| regression test (RED) | per nature | **mandatory** (reproduces bug first) |
| `demo-script.md` | if `demo_required` | yes if user-reachable |

---

## 6. Cockpit view (gaps)

A bugfix story shows on `/board` (`BoardCard.tsx:43`) and `/roadmap` (`StoryChip.tsx:34`) via `typeMetaOf(story.type)`. **It does NOT render distinctly — it renders as nothing:**

- `lib/types.ts:156` `StoryType = 'ui' | 'service' | 'agentic' | 'tech' | 'func'` — **`bugfix` is absent** (and uses short forms `ui`/`service`/`agentic`, not the lifecycle's `ui-story`/`service-story`).
- `lib/agent-meta.ts:112-119` `TYPE_META` has keys `agentic|service|design|tech|func|ui` — **no `bugfix` key**.
- `typeMetaOf` (`agent-meta.ts:122-130`) matches by substring over `['agentic','service','design','tech','func','ui']`; `"bugfix"` contains none → returns `null` → BoardCard/StoryChip render **no type icon/label** for a bugfix story.

**Gap:** the 4th first-class story type (ADR-011, 2026-05-30) was **never wired into the cockpit** (post-dates or was missed by the cockpit type model). On `/board` a bugfix is visually indistinguishable from an untyped story — no badge, no repro-status indicator, no "lite" marker. (Finding F4.)

---

## 7. Core-vs-Project / Brand split candidate (tags)

| Concept | Tier | Rationale |
|---|---|---|
| "Bugfix is a lite lifecycle, repro-first, no new design, same 10 states, never-reduced verification" (ADR-011 doctrine) | **CORE** | tech/domain-agnostic process invariant; any agentic dev-OS needs a lite repair lane |
| Repro-first gate (story + ticket); diagnosis match/mismatch/no-repro tree; regression-RED-first; root-cause-only; reclassification escape | **CORE** | generic gates; no tech named |
| `repro_evidence`/`hotfix_metadata` schema shape | **CORE** (schema) — but its `command`/`brand` field **values** are PROJECT/BRAND |
| Repro **commands**: `cd ${WS}/{brand}/backend && ${WS}/.venv/bin/pytest …`, `core/luana-core-{pkg}` engine path, multibrand ripple "reproducir en ≥1 brand consumer" | **PROJECT** | hardcoded `pytest`/`.venv`/`alembic`/`luana-core-*` literals — seam slots `toolchain.*`, `engine_prefix` |
| Debugging runbook: `luana-dev-{brand}_{service}_dev-1` container names, `docker logs`, alembic workdir `/workspace/{brand}/backend`, brand ports 8001/3001…, top-12 bug patterns (tenant_id, SA 1.x, Qdrant, Clerk 401) | **PROJECT/BRAND** | `debugging.md` is entirely luana stack — seam slots `live_verify_infra[]`, `brands[]` |
| `dev_app_verified` gate, `dr.demo@vitalialat.com`, `CLERK_TESTING_TOKEN_VITALIA`, dev-app URLs | **BRAND** | vitalia-specific creds/URLs in `pm-vitalia/SKILL.md:245` |

**Smear example:** `hotfix-repro-mandatory.md` mixes the CORE gate ("repro before builder spawn") with PROJECT command literals in the same normative body (`rules-detail/hotfix-repro-mandatory.md:42-52,76-84`) — exactly the outward-pointing dependency the charter §1 wants removed.

---

## 8. Scatter / contradiction / gap findings (file:line)

- **F1 (gap, doctrine fragmentation):** "is hotfix-repro vs bugfix-story-type one flow or two?" — **two mechanisms, never unified.** ADR-011 itself flags it: R26 "a nivel de **ticket**, no como **tipo de story**" (`ADR-011:11`), and bugfix "hereda" R26 (`ADR-011:19`). Result: the repro gate is restated **4 times in 4 skills with drift** (`po/SKILL.md:96`, `po-ux/SKILL.md:167`, `dev-team/SKILL.md:159`, `architect/SKILL.md:660`) instead of one SSoT (charter "1 SSoT per concern" smell). A bugfix story that is ALSO a hotfix re-runs the gate at story-level AND ticket-level.

- **F2 (contradiction):** **`/po-ux` decision matrix does NOT list `bugfix`** (`po-ux/SKILL.md:20-27`) — only mentions it obliquely as "happy path opcional" at `:214`. But ADR-011:20 names `/po-ux` as the UI bugfix refiner and lists po-ux's SKILL as a cementation site (`ADR-011:37`). `/po`'s matrix DOES list it (`po/SKILL.md:23`). → UI bugfix has no explicit home in the po-ux scope table.

- **F3 (contradiction, biggest):** **`/architect` does not recognize `bugfix` as a story_type.** Its decision table (`architect/SKILL.md:76-81`) and spawn enum `story_type: {ui-story|service-story|agentic-story}` (`architect/SKILL.md:97`) omit `bugfix`. ADR-011:21,37 cement a "ready package **reducido**" for bugfix into the architect SKILL — but **no bugfix-lite mode exists** in the skill; the only bugfix-relevant architect content is the R26 ticket repro block (`:660`). The "go straight to tickets, skip 03-arch/05-guidelines/dispatch-plan" path is undefined in the skill.

- **F4 (gap, cockpit):** `bugfix` is absent from cockpit `StoryType` (`lib/types.ts:156`) and `TYPE_META` (`agent-meta.ts:112-119`) → renders with no badge/icon on `/board` + `/roadmap` (§6). The cockpit also uses `ui/service/agentic` while the process uses `ui-story/service-story/agentic-story` (handled by substring match, but `bugfix` falls through).

- **F5 (scatter, stale path):** the canonical ticket template is **`06-tickets-template.yaml`**, but `rules-detail/hotfix-repro-mandatory.md` cites the dead **`04-tickets.yaml`** at lines 72, 122, 157 (and `docs/rules-detail/story-closure-gate.md`). The slim stub `hotfix-repro-mandatory.md:30` correctly says `06-tickets-template.yaml`. → stub and detail contradict; detail points to a non-existent file.

- **F6 (scatter, schema drift):** the repro schema key is `repro_evidence.{...}` in the rule (`rules-detail/hotfix-repro-mandatory.md:76`) but `hotfix_metadata.{repro_verified,repro_command,...}` in po/SKILL + checkpoint (`po/SKILL.md:116`; `checkpoint-template.md:36`). Two names for the same concept.

- **F7 (gap, broken enforcement-layer claim):** `rules-detail/hotfix-repro-mandatory.md:123` claims "Layer 4 — Auditor REVIEW Cat 11 verifica repro_verified." The auditor SKILL has **no `repro_verified`/repro check** — cross-cutting is "C4" (`auditor/SKILL.md:523`), not "Cat 11", and contains no repro mention. The auditor enforcement of the repro gate is a paper layer.

- **F8 (gap, template):** the canonical `checkpoint-template.md` header (lines 7-35) has **no top-level `type:` field** at all — yet `type: bugfix` is the entire basis of WT4 classification and ADR-011:36 lists this template as a cementation site for "`type` enum". `type` is only referenced indirectly via comments on `cap_change_type` (`:14`) and `hotfix_metadata` (`:36`). No `bugfix` learning file exists in `docs/learnings/`; the learning lives only in the MEMORY store (`bugfix-story-type.md`).
