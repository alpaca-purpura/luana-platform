# AS-IS · The Luana Cockpit — views, WT→view map, read-schema contract

> **W0.5 · Process Model · AS-IS reconstruction.** Scope: `tools/luana-cockpit/` (Next.js 16, filesystem-as-DB, per-worktree). The cockpit is the operator's window into BOTH processes (product-dev WT1-7 + harness-improvement). This doc reconstructs what the cockpit ACTUALLY renders today + maps each work-type to its view (or exposes the gap). Every claim is `file:line`. Descriptive (what IS), not prescriptive. Charter input: `harness-refactor-charter-2026-06-08.md:39-49` (WT table + "unify cockpit visibility"). Sibling AS-IS: `SPINE-as-is.md` (the spine), `WT4-bugfix-as-is.md` (bugfix gaps F4), `WT3-agentic-as-is.md`.

---

## 1 · Cockpit inventory — the actual routes/views that exist today

The cockpit ships **8 page routes** (`app/*/page.tsx`) + **22 API routes** (`app/api/`). README claims "Las 7 vistas" (`README.md:99`) but there are 8 pages — README undercounts (`/arquitectura` is a 7th brand-scoped view it lists separately at `:106`; the prose header "7 vistas" is stale → finding G7). Pages are thin wrappers (`board/page.tsx:1-5`) delegating to `components/{view}/{View}.tsx`.

| Route | View component | Brand-scoped? | What it renders (file:line) |
|---|---|---|---|
| `/roadmap` (default) | `roadmap/` (StoryChip) | yes | Stories grouped by Release F0..FN. Drag stories between releases (only idea/refining/refined). Merge-release-to-main when all done. (`README.md:104`) |
| `/board` | `board/BoardView.tsx` | yes | **The 10-state kanban.** `STATES_ORDER` 10 cols (`BoardView.tsx:36-47`); drag only CHRIS_ALLOWED (`:172-181`); WIP cap badges (`:49-56,294-313`); type filter (`:264-275`); 🔨 lane overlay franja "Construyendo ahora" (`:316-328`). Cards via `BoardCard.tsx`. |
| `/map` | `map/MapView.tsx` | yes | **Mapa Implementado** — `ProductHealthBanner` (`:209`) + zone→box→area tree from `SYSTEM-MAP.zones` (`:371-391`, `buildZoneTree` `map-zones.ts:145`). Two lenses: trabajadores / proceso (`:324-358`). Infra zone collapsed behind `showInfra` toggle (`:298-310`, `ZoneBlock` `:465-474`). Orphan-cap panel (`:393-413`). Click cap → CapDrawer. Legacy fallback by `agent_owner` if no `zones` (`:702-807`). |
| `/arquitectura` | `architecture/ArchitectureView.tsx` | yes | SYSTEM-MAP global: agents × functional_areas + `cross_agent_flows` + `data_ownership`. (`README.md:106`) |
| `/drift` | `drift/DriftView.tsx` | yes | **Caps not verified-live**, ranked by severity (stub/wip/partial/drift). Reads `_status-computed.json` via `getCapabilityStatus` (`DriftView.tsx:13`). **= CIL carril L4** (`README.md:107`). |
| `/learnings` | `learnings/` | yes | Learnings timeline (chronological desc, search, tags). **= CIL carril L2** (`README.md:108`). |
| `/harness` | `harness/HarnessView.tsx` | **transversal** (core) | **Harness · CIL monitor.** 4-carril franja chips (`:271-283`); L1 board (harness-backlog.md, `:315-329`); L3 board (tech-debt.md, `:331-348`); links to L2 `/learnings` + L4 `/drift` (`:350-360`). Read-only. |
| `/` (root) | `page.tsx` | — | Landing/redirect. |

**Drawers (slide-in, not routes):** Story Drawer (7 tabs, `README.md:136-146`: Checkpoint/chris-input/Spec/Diseño/Arq/Audit/Files) + Cap Drawer (N0-N4 levels + changelog, `CapDrawer.tsx:89-451`). **6 modals** (`README.md:163-169`).

**Navigation** (`layout/Sidebar.tsx`): 6 brand-scoped items (`NAV_ITEMS` `:29-36`) + 1 transversal "Transversal · core" section with `/harness` (`CORE_NAV_ITEMS` `:39-41`, rendered `:115-125`). `/harness` carries a live badge = `l1.open + l3.open` open CIL items (`:86-94,123`).

**Pseudo-brand "⬡ Platform · core"** (`README.md:115-122`, `platform-context.ts`): a traceability-only context pointing at root `docs/`; only `board` + `learnings` apply (`PLATFORM_VIEWS` `platform-context.ts:27-30`), rest dimmed (`Sidebar.tsx:112`). Read-only — platform stories transition via `/pm-luana`.

---

## 2 · WT → cockpit view map

Charter (`:39-49`) asserts every WT maps to a view. Reconstruction of the ACTUAL surface:

| WT | Cockpit view today | What it shows | GAP |
|---|---|---|---|
| **WT1 · UI cap** | `/board` (kanban) + `/roadmap` + `/map` + Cap Drawer N0-N4 | Story walks 10 states on `/board`; type icon `🖥 UI` via `typeMetaOf` (`agent-meta.ts:118,122`); merged cap appears on `/map` under its agent box; N0-N4 in Cap Drawer. **Best-supported WT.** Charter's "/functionality" view does NOT exist — its content lives in the Cap Drawer (`README.md:113`). | Minor: README "no existe tab `/functionality`" (`:113`) — charter's `/functionality` column (`:41`) is aspirational; real home is the drawer. |
| **WT2 · Service cap** | `/board` + `/map` (infra/non-visible box) | Type icon `🔌 Service` (`agent-meta.ts:114`); service cap with `user_visible:false` renders in Infra zone (collapsed) or its agent box. | Service caps without a clear `agent_owner` land in the orphan panel (`MapView.tsx:393`). No service-specific affordance — rides WT1's surface. |
| **WT3 · Agentic** | `/board` + Story Drawer "🎨 Diseño" tab (`02-design-agentic.md`) + `/arquitectura` (cross_agent_flows) | Type icon `🤖 Agentic` (`agent-meta.ts:113`); the agent boxes ARE the agentic surface (`map-zones.ts`); Valeria = supervisor sidebar (`map-zones.ts:181-184`, `MapView.tsx:352-356`). | No agentic-specific level in Cap Drawer (eval goldens/prompt-slots/trace not surfaced). The 02-design tab renders MD only. |
| **WT4 · Bugfix/hotfix** | `/board` + `/roadmap` (via `typeMetaOf`) | **Renders as NOTHING.** `StoryType` (`types.ts:156`) lacks `bugfix`; `TYPE_META` (`agent-meta.ts:112-119`) lacks `bugfix`; `typeMetaOf` substring-loop (`:126`) returns `null` for `"bugfix"` → BoardCard (`BoardCard.tsx:84-88`) renders no type icon. No `repro_verified` indicator. | **HARD GAP (G-WT4).** The 4th first-class story type (ADR-011, 2026-05-30) was never wired into the cockpit type model. A bugfix is visually indistinguishable from an untyped story. Corroborates `WT4-bugfix-as-is.md` F4. Board type filter (`BoardView.tsx:269-274`) also has no `bugfix` option. |
| **WT5 · Technical cap** (obs/security/perf/infra) | `/map` Infra zone (collapsed behind `showInfra`) + `user_visible:false` filter (`MapView.tsx:298-310`) | Infra zone IS populated from `SYSTEM-MAP.zones` (`ZoneBlock` `:450-491`, `BOX_EMOJI` infra entries `map-zones.ts:65-70`); the 4 infra boxes (seguridad-cumplimiento/observabilidad/plataforma-tecnica/motor-agentico) render when toggle on. | **Charter-flagged GAP (G-WT5).** Two parts: (1) the *map* surface exists but is **collapsed by default** → infra caps invisible unless operator hunts the toggle; (2) there is **no `technical` story spine entry** upstream (`SPINE-as-is.md` F5) so technical caps arrive as `service`/`bugfix` with `user_visible:false`. Cockpit type enum HAS `'tech'` (`types.ts:156`, `🛠 Tech` `agent-meta.ts:116`) — but no story type produces it (orphan badge). |
| **WT6 · Promotion** (brand→engine lift) | **NONE** | — | **HARD GAP (G-WT6).** Zero cockpit surface. `grep promotion\|lift\|EP-\|extension.sdk` across `lib components app` = **0 hits**. `CapLicense` (`types.ts:42`: brand-local/core-shared/proprietary) is the only schema trace; `cap.license` shows in the YAML ledger pill (`CapDrawer.tsx:144-149`) but no promotion-proposal view, no brand→core flow, no `/pm-luana` modo-core surface. Promotion lives entirely in `docs/promotion-protocol/` + `/pm-luana` skill, invisible to the operator window. |
| **WT7 · Harness improvement** | `/harness` (CIL monitor) | 4-carril board: L1 (harness-backlog), L3 (tech-debt) as kanban-by-lifecycle (`HarnessView.tsx:94-141`); L2/L4 as chip+link (`:273-283`). Sidebar badge = open items (`Sidebar.tsx:88-93`). | **Mostly complete** but: (1) L2/L4 are links not in-board (the "unified board" is 2 lanes + 2 redirects); (2) lifecycle states (reported→triaged→ratified→applied→verified+deferred, `md-lifecycle-table.ts:25-32`) are a DIFFERENT state machine than product-dev's 10 states — two state vocabularies, no cross-walk shown; (3) HLP/`/harness-issue` capture is NOT in the cockpit (read-only, `HarnessView.tsx:263-268`). |

**WT→view summary:** WT1-3 well-served (shared `/board` + `/map` + drawers). **WT4 invisible** (no type badge). **WT5 half-served** (infra map exists but collapsed + no upstream type). **WT6 zero view.** **WT7 a 2-lane board + 2 links** (not the unified 4-lane board the charter wants).

---

## 3 · State / level / zone rendering — wired vs aspirational

### 3a · The 10 macro states — WIRED
`StoryState` enum complete (`types.ts:12-22`). `/board` `STATES_ORDER` renders all 10 columns (`BoardView.tsx:36-47`); `parked`/`dropped` toggle-hidden (`:143-146`). `StateBadge` per state (`CheckpointTab.tsx:136`). WIP caps badged (`WIP_CAPS` `BoardView.tsx:49-56`). `CHRIS_ALLOWED_TRANSITIONS` whitelist enforced for drag (`:172-181`) + transition buttons (`CheckpointTab.tsx:76-105`) — matches `cockpit-permissions.md:13-23` verbatim (`types.ts:431-439`).

### 3b · phase / G AWAIT_CHRIS_VERIFY / chris_verify / reconciled / dod_evidence — NOT WIRED (aspirational)
**The proceso-v5 G/R gate is invisible to the cockpit.** `grep AWAIT_CHRIS_VERIFY|chris_verify|reconciled|dod_evidence|dod_live_verified|signoff` across `lib components app` = **0 functional hits** (only a comment `types.ts:600`). Concretely:
- `Story.phase` / `phase_workflow` (`types.ts:182,194`) are read but NOT in `RICH_FIELDS` (`CheckpointTab.tsx:37-49`) → rendered as a generic raw key in "Metadata adicional" (`:204-218`), NOT as a gate-state.
- A story sitting in `developed` + `phase: AWAIT_CHRIS_VERIFY` (the G pause-and-offer of `story-closure-gate.md`) shows on `/board` in the `developed` column with **no signal that it's parked awaiting Chris**. The operator can't tell "blocked on me" from "auditor running".
- `chris_verify.signoff` (the consolidated G signoff, DoD #37 §5) — no badge, no surface. `dod_evidence` / `dod_live_verified` (the live-verify gate) — no surface. These exist only in checkpoint YAML, visible only via "Editar raw" (`CheckpointTab.tsx:247-258`).

**→ The cockpit's state model is the OLD 10-state machine; the proceso-v5 phase/gate refinements (G/R/signoff/live-verify) were never added to the read-schema or the render.** (Finding G3.)

### 3c · 🔨 lane overlay — WIRED
`.session-locks/*.lock` read via `lib/sessions.ts` (`README.md:124-134`); `/api/sessions` polls every 5s, filters dead PIDs (`BoardView.tsx:97-113`); franja + per-card 🔨 badge (`BoardView.tsx:316-328`, `BoardCard.tsx:116-123`). `ActiveSession` schema (`types.ts:680-691`).

### 3d · Cap levels N0-N4 — WIRED (loader bug FIXED)
N0 = "Cómo verlo" card (`CapDrawer.tsx:247-351`); N1 scenarios (`:356-362`); N2 business_rules (`:365-369`); N3 access (`:372-376`); N4 code+related+bidirectional (`:379-400`). `CapLevel` collapsible (`CapLevel.tsx`). The passthrough bug the proposal flagged (`cockpit-capability-levels-proposal.md:35-40`: loader dropped scenarios/business_rules/access/related) is **FIXED** — `readCapability` now passes them through (`cap-ledger.ts:67-70`). N1 truth badge (✅/🟠/⚪ via `verified_real`) wired in `ScenariosSection`.
**Residual (NOT a cockpit bug):** the *content presence* gap — 39 caps `live`+`user_visible`+`0 scenarios` render as empty N1, with **no presence gate upstream** (`cockpit-capability-levels-proposal.md` §3 table). The cockpit honestly shows the hole; the hole is in the producing process (WT spine), not the render.

### 3e · zone / caja map — WIRED (data-driven from SYSTEM-MAP)
3 zones (agentes/plataforma/infraestructura) derived from `SYSTEM-MAP.zones` (`map-zones.ts:120-129` boxZoneIndex — "NUNCA se escribe a mano"). Zone tier badges (`MapView.tsx:420-424`). Infra zone `user_visible:false` → collapsed teaser (`:465-474`). Box emoji map for transversal boxes (`map-zones.ts:60-70`). Process lens orders agent boxes by value-stream (`buildProcessLens` `map-zones.ts:239-268`). Matches `paradigm-arquitectura.md` 3-zone model. **Caveat:** depends on `SYSTEM-MAP.yaml` having `zones` (v2.0); without it → legacy fallback by `agent_owner` (`MapView.tsx:702-807`).

---

## 4 · The two-process visibility — does it cleanly show BOTH?

| | Product-dev process (WT1-6) | Harness-improvement process (WT7) |
|---|---|---|
| Home view | `/board` (10 states) + `/map` + `/roadmap` | `/harness` (4-carril CIL) |
| State machine | 10 macro states (`types.ts:12-22`) | lifecycle: reported→triaged→ratified→applied→verified+deferred (`md-lifecycle-table.ts:25-32`) |
| Capture | via skills (cockpit read+limited-write) | read-only; capture = `/harness-issue` (`HarnessView.tsx:263-268`) |
| Nav grouping | brand-scoped `NAV_ITEMS` (`Sidebar.tsx:29-36`) | "Transversal · core" section (`Sidebar.tsx:39-41,115`) |

**Where they BLUR:**
1. **Two state vocabularies, no cross-walk.** A product story uses 10 states; a harness item uses 6 lifecycle states. Both render as "kanban-by-state" boards but the columns mean different things. An operator switching `/board`→`/harness` gets a similar-looking board with an unannounced different semantic. (Blur B1.)
2. **L2 (learnings) and L4 (drift) are SHARED surfaces double-claimed.** `/learnings` is both a product-dev view AND CIL carril L2; `/drift` is both a product-dev view AND CIL carril L4 (`README.md:107-108`). The `/harness` board links OUT to them (`HarnessView.tsx:350-360`) rather than embedding — so the "unified CIL monitor" is really 2 lanes (L1+L3) + 2 cross-links. The same `/drift` page serves two mental models without saying which. (Blur B2.)
3. **The harness-improvement WT is itself a product-dev-shaped use-case** (the charter's dogfood, `:34-36`) but does NOT ride `/board` — harness work has no story/checkpoint/cap; it's backlog-item rows. So the two processes are **structurally different**, not just two filters of one board. The cockpit reflects this honestly (separate view) but the charter's "both modeled, both visible" goal implies a tighter unification than the current link-out. (Blur B3.)

**Verdict:** the cockpit shows both processes but as **two parallel, weakly-bridged surfaces** with overlapping/aliased sub-views (L2/L4) and divergent state vocabularies.

---

## 5 · Cockpit-as-CORE-contract — the READ-SCHEMA (what a new product must produce)

The charter (`:148` W4b, `:70`) splits the cockpit: **READ-SCHEMA = CORE contract** (the fields/files it depends on); **RENDER = PROJECT tool**. Reconstruction of the read-schema the cockpit binds to (the data a new product MUST emit for the cockpit to work):

### Files it reads (filesystem-as-DB, `README.md:212-224`)
| File (glob) | Read by | Tier |
|---|---|---|
| `{brand}/docs/product/stories/{id}/checkpoint.md` (frontmatter v2) | `/api/stories`, `/board`, `/roadmap`, Story Drawer | **CORE** schema / PROJECT path-shape |
| `{brand}/docs/product/stories/{id}/chris-input.md` | `/api/chris-input`, drawer | CORE |
| `{brand}/docs/archive/{year}/stories/{id}/` | `/api/stories` (dedup) | CORE |
| `{brand}/docs/product/capabilities/{module}/{cap}.yaml` (ledger v2, scenarios+change_log) | `/api/capabilities`, `/map`, Cap Drawer | CORE schema / **BRAND smear** (agent_owner) |
| `{brand}/docs/product/capabilities/_status-computed.json` | `/api/capabilities/status`, `/map`, `/drift` | CORE (output of `compute_capability_status.py`) |
| `{brand}/docs/product/releases/{id}.yaml` | `/api/releases`, `/roadmap` | CORE |
| `{brand}/docs/architecture/SYSTEM-MAP.yaml` (zones+agents+flows) | `/api/system-map`, `/map`, `/arquitectura` | **BRAND** (agents are per-brand) |
| `{brand}/docs/learnings/{date}-{slug}.md` | `/api/learnings`, `/learnings` (L2) | CORE |
| `docs/process/harness-backlog.md` (root, transversal) | `/api/harness`, `/api/cil`, `/harness` (L1) | CORE |
| `docs/process/tech-debt.md` (root) | `/api/cil`, `/harness` (L3) | CORE |
| `.session-locks/*.lock` (runtime, gitignored) | `/api/sessions`, `/board` 🔨 | CORE |
| code-to-cap index + bidirectional report (generated) | `/api/capabilities/code-index`,`/bidirectional`, Cap Drawer N4 | CORE |

### Schema contract (the typed read-shape, `lib/types.ts`)
- **Story** (`types.ts:163-232`): `story_id, state, release, cap_target, cap_change_type, type, agent_owner, module, surfaces, priority, goal/anti/reuse, next_action, parse_error, dup_collision, hotfix_metadata` — **CORE**, except `agent_owner` (BRAND).
- **Capability** (`types.ts:248-300`): `capability_id, module, slug, status, license, change_log[], scenarios[], business_rules[], access, related_capabilities, dev_preview, user_visible, agent_owner, functional_area, nature` — CORE schema, BRAND values (`agent_owner`, `hipaa_lite_overlay` `:265`).
- **SystemMap** (`types.ts:645-670`): `zones[]` (3-zone), `agents[]`, `cross_agent_flows[]`, `data_ownership` — **BRAND** (the agent roster is per-brand).
- **ComputedStatusReport** (`types.ts:73-88`): `verified-live|declared-live|partial|wip|stub|drift|...` — CORE.
- **CHRIS_ALLOWED_TRANSITIONS** (`types.ts:431-439`) — CORE invariant (= `cockpit-permissions.md`).

### Tier tagging of the cockpit code (core-vs-project)
| File | What | Tier | Why |
|---|---|---|---|
| `lib/types.ts` | the read-schema + transition whitelist | **CORE** (schema) with BRAND fields embedded (agent_owner/hipaa) | the contract a new product must satisfy |
| `lib/fs-reader.ts`, `fs-writer.ts`, `git.ts`, `workspace.ts`, `chris-input-parser.ts`, `cap-ledger.ts`, `release-resolver.ts`, `md-lifecycle-table.ts`, `harness-backlog.ts`, `tech-debt.ts`, `sessions.ts`, `drift-helpers.ts`, `edit-permissions.ts` | parsers/loaders against the schema | **CORE** (generic mechanism) | tech/domain-agnostic |
| `lib/map-zones.ts` | zone tree + **`VALUE_STREAM_STAGES`** (`:201-226`: atraer/vender/operar/fidelizar, "pacientes"/"reservas prepagadas"/"día clínico") | **PROJECT/BRAND smear** | hardcoded vitalia value-stream + Spanish clinical copy in a generic file |
| `lib/agent-meta.ts` | `AGENTS` roster (`:40-57`: lisa/valeria/…+luana/abel/…) + `TYPE_META` | **BRAND** (rosters) hardcoded cross-brand superset | the agent slugs/colors are per-brand; should come from SYSTEM-MAP/config |
| `components/map/MapView.tsx` | render + **`VITALIA_ROLES`** (`:41-49`) + **`FALLBACK_AGENTS_BY_BRAND`** (`:714-733`) | **PROJECT render** with BRAND literals inlined | render is project-tool, but vitalia/nicolify rosters + roles are hardcoded |
| `components/**` (render) | React views | **PROJECT** (render = project tool per charter) | — |

**Smear count:** `grep vitalia|nicolify|comunify|lupulo|hipaa|clinic|paciente|clerk` in `lib`+`components` (excl. tests) = **67 hits across 16 files** (`lib/agent-meta.ts`, `lib/map-zones.ts`, `lib/tooltips.ts`, `lib/types.ts`, `lib/workspace.ts`, `lib/story-paths.ts`, `lib/chokidar-watcher.ts`, `lib/cap-ledger.ts` + 8 components). For the cockpit-as-CORE-contract to hold, the **read-schema (`types.ts` shape + the file paths) is the CORE seam**; the **agent rosters + value-stream + roles must move to PROJECT/BRAND config** (SYSTEM-MAP already holds agents — `agent-meta.ts` duplicates them; `map-zones.ts` VALUE_STREAM should read a config).

---

## 6 · Gaps for the TO-BE walk (what unified-visibility implies)

1. **Wire WT4 (bugfix) into the type model.** Add `bugfix` to `StoryType` (`types.ts:156`) + `TYPE_META` (`agent-meta.ts:112-119`) + `typeMetaOf` loop (`:126`) + board filter (`BoardView.tsx:269-274`); add a `repro_verified` indicator on `BoardCard`. (Closes G-WT4 / `WT4-bugfix-as-is.md` F4.)
2. **Make WT5 (technical caps) first-class & visible.** Define the upstream `technical` story type so `'tech'`/`user_visible:false` caps have a real producer (`SPINE-as-is.md` F5); surface the Infra zone less buried (a count badge / non-collapsed-by-default option) so technical caps aren't invisible behind `showInfra`.
3. **Add a WT6 (promotion) view.** Zero surface today. Needs a brand→core lift board reading `docs/promotion-protocol/proposals/` + surfacing `cap.license` transitions (brand-local→core-shared). The operator currently can't see promotion in the cockpit at all.
4. **Surface the proceso-v5 phase/gate states on `/board`.** Render `phase: AWAIT_CHRIS_VERIFY` (G pause → "blocked on Chris" badge), `chris_verify.signoff`, `reconciled`, `dod_live_verified`/`dod_evidence` as first-class gate indicators, not raw YAML. Add these to the read-schema (`types.ts`) + RICH_FIELDS. (Closes G3.)
5. **Unify the harness board (WT7).** Embed L2/L4 in `/harness` (or clearly co-locate) instead of link-out; show a cross-walk between the 6 lifecycle states and the product-dev semantics; consider showing the `/harness-issue` capture affordance (currently read-only).
6. **Bridge the two state vocabularies.** A legend or shared visual grammar so `/board` (10 states) and `/harness` (6 lifecycle states) don't look identical-but-mean-different (Blur B1).
7. **Extract the read-schema as the CORE seam; push rosters/value-stream/roles to config.** `agent-meta.ts` AGENTS + `map-zones.ts` VALUE_STREAM_STAGES + `MapView.tsx` VITALIA_ROLES/FALLBACK_AGENTS must read from SYSTEM-MAP/`project.config.yaml`, leaving `types.ts` (schema) + parsers as the agnostic CORE the cockpit renders.
8. **Resolve "7 vistas" stale count + `/functionality` aspirational column.** README says 7, ships 8; charter WT1/WT2 map to a `/functionality` view that does not exist (content is the Cap Drawer). Decide: rename the column or build the view.

---

## 7 · Scatter / contradiction / gap findings (file:line)

- **G1 (read-schema drift — fields the cockpit IGNORES that stories DO write):** `phase`/`phase_workflow` (`types.ts:182,194`) read but only rendered as generic raw YAML (`CheckpointTab.tsx:37-49` RICH_FIELDS excludes them, fall to `:204-218`). `chris_verify`, `reconciled`, `dod_evidence`, `dod_live_verified`, `demo_signoff` — **not in the schema at all** (`grep`=0 in `lib/types.ts` except comment `:600`). Stories DO write these (proceso-v5, DoD #37). → the cockpit's read-schema is **behind** the checkpoint schema by the whole G/R/live-verify refinement.
- **G2 (read-schema drift — type enum vs producers):** `StoryType` (`types.ts:156`) = `ui|service|agentic|tech|func` — **missing `bugfix`** (a real story type, ADR-011) and uses short forms while lifecycle writes `ui-story`/`service-story` (normalized by `typeMetaOf` substring `agent-meta.ts:122-130`). `TYPE_META` (`agent-meta.ts:112-119`) ALSO has `design` (not in `StoryType`) but lacks `bugfix`. → enum, TYPE_META, and the producing process disagree.
- **G3 (G/R gate invisible):** the whole proceso-v5 Chris-verify (G) + reconcile (R) + signoff machinery (`story-closure-gate.md`, `definition-of-done-live-verify.md` §5) has **0 render** (§3b). A story awaiting Chris is indistinguishable from one being audited.
- **G4 (WT6 promotion — zero surface):** `grep promotion|lift|EP-|extension.sdk` in `lib components app` = 0. Only `cap.license` (`types.ts:42`) traces it.
- **G5 (PROJECT/BRAND smear in CORE-tier files):** `map-zones.ts:201-226` (VALUE_STREAM vitalia copy), `agent-meta.ts:40-57` (hardcoded rosters duplicating SYSTEM-MAP), `MapView.tsx:41-49,714-733` (VITALIA_ROLES + FALLBACK_AGENTS). 67 brand/tech literal hits in 16 non-test files. Violates charter dependency rule (`:107` CORE names no brand).
- **G6 (L2/L4 view aliasing):** `/learnings` and `/drift` each serve a product-dev role AND a CIL carril role (`README.md:107-108`), with `/harness` linking out (`HarnessView.tsx:350-360`). One page, two mental models, undeclared.
- **G7 (doc/count drift):** README "Las 7 vistas" (`:99`) vs 8 page routes; README "Endpoints API (20)" (`:185`) vs 22 `route.ts` files. `agent-meta.ts:7-10` comment lists Config/Infra as "comunes" but they're DEPRECATED pseudo-agents (`types.ts:141`).
- **G8 (cap content presence — honest hole, not a render bug):** Cap Drawer N1 wired correctly (loader bug fixed, `cap-ledger.ts:67-70`) but 39 caps render empty N1 (live+user_visible+0 scenarios) with no upstream presence gate (`cockpit-capability-levels-proposal.md` §3). The cockpit honestly shows the gap; the producer must close it.
