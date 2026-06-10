# WT5 — Technical capability (observability / security / performance / infrastructure) · AS-IS map (operator POV)

> **W0.5 · Process Model · AS-IS reconstruction.** Scope: capabilities that live in the **Infraestructura zone** of the map (`user_visible: false`) — encryption-at-rest, audit logging, idempotency, outbox/events, durable flows, billing guards, the LLM gateway, the agentic-engine runtime, migrations-as-infra, PHI enforcement, observability recorders. They are **NOT user-facing features**. This is the WT flagged **UNDER-DEFINED** in the charter (`harness-refactor-charter-2026-06-08.md:45`). This doc reconstructs the de-facto process and **maps the VOID** that the TO-BE walk with Chris must close.
> **Method note:** every path verified with `ls`/`grep` before citing. Missing/ghost paths are recorded as findings (§8). This is descriptive (what IS), not prescriptive.

---

## 1. Definition + concrete examples

**WT5 (one line):** a capability that delivers a **cross-cutting / non-functional / technical quality-attribute** (the *enabling* tier), lives in `user_visible: false` boxes of the **Infraestructura zone**, has **no demo and no user affordance** — its "user" is another cap, the runtime, or a probe, not a person (`PARADIGM.md:76`; `paradigm-arquitectura.md:28-33`; `capability-protocol.md:252-259`).

| Sub-domain (the 4 Infra boxes) | Concrete WT5 examples (real caps, file:line) |
|---|---|
| **seguridad-cumplimiento** (encryption/audit/PHI/tenant-isolation) | `audit-writer-ssot.yaml` (SSoT audit writer, `agent_owner: seguridad-cumplimiento`, `user_visible: false`, `:18`); `hipaa-dual-filter-decorator.yaml`; `hipaa-lite-defensive-stack.yaml` — **9 caps** registered |
| **observabilidad** (recorders/traces/health) | `api-health-endpoint.yaml`; `otel-sentry-graceful-degradation.yaml`; `vitalia-callback-subclasses.yaml` — **3 caps** |
| **plataforma-tecnica** (idempotency/events/payment/IAM/migrations/shell) | `migrations-slice-1-schema.yaml` (`nature: scaffold`, `:17`); `payment-gateways-latam-recurring.yaml`; `idempotent-cron-arq-scaffold.yaml`; `tenant-switcher.yaml` — **10 caps** |
| **motor-agentico** (engine copilot/sales_agent, RAG, durable flows) | `state-overlay-langgraph.yaml`; `medical-kb-rag.yaml`; **durable-flows engine** `core/luana-core-flows` (lifted 2026-06-02) — **6 caps** + the core package |

These caps **exist and are registered** in vitalia's map: **28 `user_visible: false` caps** across the 4 boxes (`grep -c agent_owner` per box: 9+3+10+6). So the *destination* (Infra zone) is real and populated. The question this doc answers is **how they got there** — and the answer reveals the void.

---

## 2. The AS-IS reality — what process technical caps ACTUALLY follow

There is **no WT5 process.** Technical caps reach `done` through **four de-facto improvised paths**, none of which is a first-class "technical capability" lifecycle:

### Path A — byproduct of a feature/service story (most common, implicit)
A technical cap is created **as a side-effect** of a feature/service story and back-tagged afterward. `audit-writer-ssot.yaml` declares `story_introduced: vitalia-adopt-luana-core-iam` (`audit-writer-ssot.yaml:6`) — the audit writer was built *inside* an IAM-adoption story, then documented as an Infra cap. The cap is real; it was **never refined as a technical cap** (no `01-spec` of its own, no technical-story type). Verification rides on the host story.

### Path B — ad-hoc core/infra work via `/pm-luana` + a **promotion proposal as the lifecycle** (the durable-flows pattern)
Net-new infra that touches `core/` is run as a **promotion-protocol proposal acting as the whole lifecycle vehicle.** The proposal has its OWN state machine, ratification, builder ownership, and even DoD #37 live-verify — **substituting for a story**:
- `2026-06-02-durable-flows-engine.md`: `state: proposed→accepted→migrated` (`:3`), `ratified_by: Chris` (`:6`), `lift_owner: /dev-team (builder-agentic Opus) + builder-backend` (`:38`), `migrated_commits: [c8551ed7…]` (`:8`), live-verify "durable persist + resume proven in Postgres" (`:16-17`). It was explicitly a **"flujo excepcional Chris"** — an out-of-band exception (`:37`).
- The README itself names this an exception path: a lift is "L1 esta conversación (flujo excepcional Chris)" (`durable-flows…:37`), and **net-new L2** (the `FlowCompiler`, no brand origin) is punted: "L2 build = **story siguiente**" (`durable-flows…:37,107,125`) — because "no se puede live-verificar honestamente un compositor cross-brand en una sesión" (`:107`). So the proposal can't even host the net-new infra build; it defers to a future undefined story-type.

### Path C — infra surfaced mid-build, captured as a proposal "to do later"
The **LLM gateway** (pure infra: `deploy/litellm/`, `docker-compose.dev.yml`, root config — no brand mirror) was **opened by `/dev-team` mid-build** of an unrelated brand story: `opened_by: /dev-team (nicolify-r1-abel-icp-buyer)` (`2026-06-04-llm-gateway-chinese-first.md:4`), `origin_story: nicolify/…/nicolify-r1-abel-icp-buyer` (`:11`). It targets ALL 10 brands (`:31`) but has no story of its own; it sits at `state: proposed` (`:3`) waiting for a home. MEMORY confirms the de-facto rule: *"mejorar = `/pm-luana`, stories de marca lo CONSUMEN"* (`llm-gateway-litellm` pointer, MEMORY index).

### Path D — retroactive **`type: technical-story`** (a GHOST type invented ad-hoc)
When the ledger showed ~20 caps `declared-live` but `stub` (built first, never specced), Chris ordered a backfill. That story's checkpoint literally declares **`type: technical-story`** (`vitalia-stub-caps-scenario-backfill/checkpoint.md:3`) and self-describes as "Technical-story no-agentic, ~4 tickets" (`:35`), with a section "C. Infra / BE (NO UI e2e → integration/contract test)" (`:66`). **This type does not exist in the process layer** (§3/§8 F1). It was used by exactly **2 archived vitalia stories** (`vitalia-stub-caps-scenario-backfill`, `vitalia-cockpit-live-reconciliation`) and appears in **ZERO** live lifecycle/skills/templates/rules (`grep technical-story` over `lifecycle.md`, all refiner skills, `checkpoint-template.md`, `.claude/rules/*` = **empty**).

**Summary of the AS-IS:** technical caps are built as **byproducts (A)**, **exception proposals (B)**, **captured-deferred proposals (C)**, or under a **ghost `technical-story` type (D)** that was never cemented. The *verification* side is the ONE modern, defined piece (§4). Everything upstream of `04-validators` is improvised.

---

## 3. Lifecycle states — what a technical cap traverses (and where it has no rails)

A technical cap, when run through Path B/D, traverses the same 10 macro states (`lifecycle.md:52-63`), but the **design-phase rails are undefined**:

| State | Spine (WT1-3) | WT5 technical-cap (de-facto) | Defined? |
|---|---|---|---|
| idea | chris-input + checkpoint, apply zone tree | same; zone tree lands it in **Infraestructura** (`paradigm-arquitectura.md:28-33`) | tree YES; **no refiner owns the idea** |
| refining | `/po-ux` or `/po` writes `01-spec` Gherkin + Mapa funcional | **no refiner**: `/po` covers only `service-story | agentic-story` (`po/SKILL.md:140`), `/po-ux` only `ui-story` (`po-ux/SKILL.md:197`). A pure-infra cap fits none. In practice the proposal-doc or the host story substitutes. | **NO (F2)** |
| refined | `/pm-{brand}` closes | de-facto `/pm-luana` (core) or host story's pm | partial |
| ready | `/architect` 5-artifact package | `/architect` spawn enum has **no technical type** (`architect/SKILL.md:97`); but `nature: technical` IS a `04-validators` value (`:203,964`) → architect can produce a **reduced** package (BE-only, no `02-design`) — *if* a story reaches it | **enum NO, gates YES (split, F3)** |
| developing | `/dev-team` TDD | same (`builder-backend`/`builder-agentic`); for Path B authorized by proposal `accepted` (`durable-flows…:111`) | YES |
| developed | DoD gate, `verification_nature: technical` → **gates only, no demo, no anti-burbuja** (`definition-of-done-live-verify.md:130,214`) | **YES — fully defined** | YES |
| reviewing | `/auditor` | `/auditor` + `auditor-downstream-regression` (R3) for core edits (`auditor-downstream-regression.md`) | YES |
| done | `/pm-{brand}` merge + cap ledger | merge or proposal `state: migrated` + `docs/core-modules/` update | partial (two SSoTs) |

**The shape of the void:** the **back half (developing→done) is fully defined and modern** — `verification_nature: technical`, technical gates, downstream regression, scaffold/extension-point exemptions all exist. The **front half (idea→ready) has no rails** — no story type, no refiner, no owner skill, no artifact template, no `01-spec` analog for a non-user-facing cap.

---

## 4. The ONE thing that IS defined — technical verification (no demo, gates only)

This is the modern, working piece — worth protecting in the TO-BE:

- **`/architect` declares `verification_nature`** in `04-validators`: tree `¿hay UI/endpoint que un user alcanza? NO → verification_nature: technical` (`architect/SKILL.md:958-964`).
- **`technical` ⇒ gates only:** "service/domain logic, migración, cálculo, ETL → **gates automáticos** … NO requiere demo manual" (`definition-of-done-live-verify.md:130`). No anti-burbuja, no `demo_script.md`, no Chris demo (`:214`).
- **Baseline gates always** (tsc/mypy/ruff/eslint/arch-fitness) + opt-in by nature (Schemathesis for new endpoints, Hypothesis for invariants, mutation gate for commit/PHI/pricing surfaces) (`architect/SKILL.md:204-205`).
- **Cap-side exemptions:** `user_visible: false` ⇒ scenarios/access/dev_preview **OPTIONAL** (`capability-protocol.md:478` row `new + user_visible:false → OPTIONAL`); `nature: scaffold` ⇒ exempt from `dev_preview` entirely (`capability-protocol.md:293`).
- **Live-verify still applies for runtime-visible infra:** durable-flows proved "persist + resume in Postgres" as its DoD #37 evidence (`durable-flows…:16-17`) — technical ≠ unverified; it's *verified by exercising the real effect + reading logs*, not by a demo.

So a technical cap that *reaches* `04-validators` is well-handled. The problem is **getting it there.**

---

## 5. Adjacent mechanisms WT5 could ride on — pros/cons as the WT5 home

| Candidate home | Pros | Cons |
|---|---|---|
| **Infra zone of the paradigm** (`PARADIGM.md:76`; `SYSTEM-MAP.yaml:126`) | The *destination* already exists: 4 boxes, `user_visible:false`, 28 caps registered, cockpit renders it (§6). The decision tree already routes infra here (`paradigm-arquitectura.md:28-33`). | It's a **map/home for the finished cap**, NOT a *work lifecycle*. It answers "where does it live" not "how is it built/refined/owned." |
| **promotion-protocol** (`promotion-protocol/README.md`) | Has a full state machine (`proposed→accepted→migrated`), Chris ratify, `/dev-team` owner, downstream regression, DoD #37 (durable-flows proved it). Natural for **core** infra. | Its **rule cardinal #1 forbids net-new core**: *"Brand-first, core-second … NUNCA al revés (no hay 'research en core' sin caso de uso brand concreto)"* (`README.md:13`). Designed for **lifting brand-born mirrors**, not building net-new infra. Durable-flows L2 (net-new) **couldn't** ride it → punted to "story siguiente" (`durable-flows…:107`). Also: a proposal is not a story → not on `/board`, no WIP-cap, no archive path. |
| **service-story** (`/po`, `lifecycle.md:72`) | Closest existing story type; BE-only, full spine, `/architect` accepts `service-story` (`architect/SKILL.md:81,97`); `verification_nature: technical` already wired. | Semantically wrong: a service-story is a **user-invokable backend capability** (an action a user/agent calls), with a `01-spec` of behavior + access roles. An audit-writer/encryption-decorator/idempotency-key has **no caller-facing behavior to spec** — forcing it into service-story produces a hollow spec (the Path A problem). `/po`'s matrix doesn't name infra. |
| **bugfix (WT4)** (`ADR-011`, `lifecycle.md:74`) | Lite ceremony, repro-first, no new design — matches "small infra change." | Only for **fixing broken / completing half-wired** behavior, not **net-new infra**. `cap_change_type: fix/extend`, never `new`. Wrong for greenfield encryption/observability/engine. |
| **ghost `type: technical-story` (Path D)** | It's the only label that *names* the thing; the cockpit board even anticipates `'tech'` (`types.ts:156`, `agent-meta.ts:116`). | **Never cemented** — absent from every live process surface (§8 F1). Used by 2 internal stories only. No refiner, no gates, no template behind it. It's a placeholder, not a process. |

---

## 6. Cockpit view — the Infra zone (`user_visible: false`)

**Two cockpit surfaces, asymmetric:**

- **Map view (`/map`) — RENDERS the Infra zone.** `MapView.tsx` reads `zone.user_visible === false` → `isEnabling` (`:462`), renders the **Infraestructura `ZoneBlock`** collapsed behind a **`showInfra` toggle** (`:77,302-309,465-470`), with a count badge `caps.filter(c => c.user_visible === false).length` (`:309`) and tier label `enabling: 'no-funcional'` (`:423`). The 28 infra caps appear here. **This works** — the finished-cap display side of WT5 is fine.
- **Board view (`/board`) — does NOT model a technical story.** `StoryType = 'ui'|'service'|'agentic'|'tech'|'func'` (`types.ts:156`) and `TYPE_META` has a `tech: {🛠, 'Tech'}` key (`agent-meta.ts:116`) — so the board **anticipates** a tech type — but the **process never emits `type: tech` or `type: technical-story`** (it's a ghost, §8 F1). So a WT5 story (if one existed) would either render as `tech` (orphan, no skill produces it) or fall through to `null` (like bugfix in WT4). **Gap:** the board's `tech` slot is a dangling affordance with no producer.

**Net cockpit gap:** the **destination map is wired**, the **work board has a phantom slot**, and there is **no in-flight visibility** of a technical cap being built (because no technical story type flows through the spine).

---

## 7. Core-vs-Project / Brand split candidate (tags)

| Concept | Tier | Rationale |
|---|---|---|
| **"There must be a non-user-facing technical-capability work-type, with verification-by-effect (gates + runtime evidence, no demo, no UI affordance)"** | **CORE** | Any agentic dev-OS needs a lane for cross-cutting quality attributes (security/observability/idempotency/engine). Tech-agnostic process invariant. **This is the missing CORE primitive WT5 must add.** |
| `verification_nature: technical` + technical_gates (baseline + opt-in) + `nature: scaffold/extension-point` exemptions | **CORE** (schema/doctrine) | generic; no tech named. Already exists — the one piece to keep. |
| Infra zone with `user_visible:false` boxes; "cap = zona→caja→área, derived from registry" | **CORE** (the 3-zone model) — but **box names** (`seguridad-cumplimiento`/`motor-agentico`/…) are **PROJECT** | the *shape* (an enabling zone) is core; the *inventory* is project. |
| promotion-protocol (brand→core lift) as the vehicle for **core** infra | **CORE** (the lift gate) — overlaps WT6 | the gate is generic; its target paths `core/luana-core-*` are PROJECT |
| **The specific infra inventory** — durable-flows, LiteLLM gateway, outbox, observability recorders, MercadoPago, HIPAA dual-filter, Clerk/Qdrant, alembic migrations, `core/luana-core-*` | **PROJECT** | named tech/engine. Seam slots: `engine_prefix`, `toolchain.migrate`, `live_verify_infra[]`. |
| Vitalia-specific: HIPAA-lite, PHI encryption-at-rest, `vitalia_audit_log`, dr.demo creds | **BRAND** | health-vertical compliance; brand creds/URLs |

**Smear example:** `paradigm-arquitectura.md:29` enumerates infra concerns ("cifrado, audit, observabilidad, idempotencia, eventos, pagos, engine") — a CORE decision-tree node naming **PROJECT-specific concerns inline**. The generic node should say "non-functional / quality attribute"; the concrete list belongs in a project profile.

---

## 8. Scatter / contradiction / gap findings — **the VOID, itemized** (file:line evidence)

- **F1 (THE VOID — no technical-story type):** the lifecycle story-type enum is `ui-story | service-story | agentic-story | bugfix` (`lifecycle.md:71-74`) — **no technical type.** Yet `type: technical-story` was used by 2 archived stories (`vitalia-stub-caps-scenario-backfill/checkpoint.md:3`, `vitalia-cockpit-live-reconciliation/checkpoint.md`) and self-described as a real type (`:35`). `grep technical-story` over `lifecycle.md` + all refiner/architect/pm skills + `checkpoint-template.md` + `.claude/rules/*` = **EMPTY**. → it's a **ghost type**: invented in practice, never cemented in process. **The single biggest gap WT5 must close.**

- **F2 (no refiner owns infra):** `/po` scope = `service-story | agentic-story` (`po/SKILL.md:140`); `/po-ux` = `ui-story` (`po-ux/SKILL.md:197`). A pure-infra cap (audit writer, idempotency key, observability recorder) **fits neither refiner.** No skill writes a technical-cap `01-spec`. → caps get built byproduct-style (Path A) or proposal-style (Path B), never refined as themselves.

- **F3 (architect split — enum lacks technical, gates have it):** `/architect` spawn `story_type: {ui-story|service-story|agentic-story}` (`architect/SKILL.md:97`) omits any technical type, **but** `verification_nature: technical` is a first-class `04-validators` value (`:203,964`). → the architect can *verify* a technical cap correctly but cannot be *dispatched* for one as a distinct type.

- **F4 (promotion-protocol can't host net-new infra):** README rule #1 forbids "research en core" without a concrete brand use-case (`promotion-protocol/README.md:13`); states for **lift only** (`:22`). Net-new infra (durable-flows L2, LLM gateway as a from-scratch service) has **no qualifying brand mirror** → durable-flows L2 explicitly deferred to "story siguiente" (`durable-flows…:107`), LLM gateway parked at `state: proposed` opened mid-feature (`llm-gateway…:3-4`). → **net-new infra is homeless.**

- **F5 (proposal-as-lifecycle is undocumented improvisation):** the durable-flows proposal carries builder ownership, commits, and DoD evidence (`durable-flows…:8,16,38,111`) — functioning as a **de-facto story without being one.** This is nowhere codified; it's a Chris "flujo excepcional" (`:37`). A proposal isn't on `/board`, has no WIP-cap, no `story-closure-gate`, no archive path. → infra work is **invisible to the lifecycle machinery** while in flight.

- **F6 (no infra-cap artifact template):** there is no `01-spec`-analog for a non-user-facing cap. `new_cap.py` accepts `agent_owner`/`user_visible` args but is infra-blind (defaults `nature: feature`, `:69`) and has **no infra/technical mode** (`grep technical|infra scripts/new_cap.py` → only the SYSTEM-MAP comment). The 2 ghost technical-stories reused the standard `01-spec…07-merge` set (their folders) with hollowed sections. → no template captures "what a technical cap must specify" (the contract it provides, the consumers, the invariant, the verification-by-effect).

- **F7 (cap built-before-specced — the backfill smell):** ~20 caps reached `status: live` while computing `stub`/`declared-live` — "tienen código + claim live, pero **sin scenario+e2e formal**" (`vitalia-stub-caps-scenario-backfill/checkpoint.md:42`). The backfill story retroactively added scenarios+tests. → the AS-IS for technical caps is **build-first, document-later** — the inverse of the spine's spec-first discipline (and the exact "verde por vacío" the lifecycle consolidation tried to kill, `lifecycle.md:7`).

- **F8 (two done-SSoTs):** a technical cap can close via `/pm-{brand}` merge + cap ledger **OR** via proposal `state: migrated` + `docs/core-modules/` (`durable-flows…:124`). Two parallel completion records for the same kind of work → no single "WT5 done" definition.

- **F9 (pm-luana "infra" ≠ infra build lifecycle):** `/pm-luana`'s only "infra" ownership is **metadata management** — `INFRA-MATRIX.md` auto-gen from `brand.yaml` (ports/DBs/domains) (`pm-luana/SKILL.md:273-307`). It is **not** a build lifecycle for infra *capabilities*. → the de-facto WT5 owner (pm-luana, per MEMORY) owns infra *config*, not infra *caps*.

- **F10 (cockpit board phantom slot):** `StoryType` includes `'tech'` + `TYPE_META.tech` (`types.ts:156`; `agent-meta.ts:116`) with **no process producer** (F1). The board anticipates WT5 but nothing emits it → a dangling affordance. (Mirror of WT4's `bugfix`-absent gap, but inverted: here the cockpit has the slot, the process lacks the type.)

- **F11 (no harness-backlog flag):** `grep WT5|technical-story|infra cap|infraestructura` over `harness-backlog.md` = **empty**. The void is **unflagged** — never captured as an HB. (This W0.5 doc is its first formal articulation.)

---

## 9. Proposed open questions for the TO-BE walk with Chris (decisions that CLOSE WT5)

1. **Own type or reuse?** Cement **`type: technical-story`** (the ghost from Path D) as a 5th first-class type — OR formalize **"infra rides on `service-story` + `user_visible:false` + `nature: scaffold/extension-point`"** and kill the ghost? (F1/F3/F4)
2. **Owner skill?** Who refines a technical cap — a new **`/po-tech`** lane, an extended **`/po`** (BE/infra), the **`/architect` directly** (since infra is often arch-decision-first), or **`/pm-luana` for core-infra + `/pm-{brand}` for brand-infra**? (F2/F9)
3. **Gates — what is "verified" with no demo?** Ratify `verification_nature: technical` (gates + **runtime evidence by effect**, no demo/anti-burbuja) as the WT5 DoD — and define the **runtime-evidence bar** per sub-domain (encryption→decrypt round-trip; idempotency→replay dedup; observability→trace row written; durable-flow→persist+resume). (§4, the one defined piece — keep it.)
4. **Net-new core infra home?** Where does net-new infra (durable-flows L2, LLM gateway) live, given promotion-protocol forbids "research en core" (F4)? A **technical-story with `cap_change_type: new` targeting `core/`** + the lift gate as a sub-step? (F4/F5)
5. **Proposal-vs-story?** Should the **proposal-as-lifecycle** (Path B) be retired in favor of a real technical-story (so infra is on `/board`, has WIP-cap, closure-gate, archive) — or kept as the **WT6 promotion** vehicle and WT5 reserved for the *build*? Clarify the WT5/WT6 boundary. (F5/F8)
6. **Artifact template?** Define the **infra-cap spec analog**: the *contract it provides* (interface/extension-point), *consumers*, *invariant it enforces*, *verification-by-effect* — instead of a hollowed `01-spec`. Teach `new_cap.py` an infra mode. (F6)
7. **Spec-first or build-first?** Forbid the **build-first/document-later** pattern (F7) for technical caps, or accept it for `nature: scaffold` and require a lightweight contract-spec for `extension-point`/`feature` infra?
8. **Cockpit:** wire the board's existing `tech` slot to the new type, and surface **in-flight** technical work (not just finished caps in the Map's collapsed Infra zone). Single "WT5 done" record (kill the two-SSoT split, F8/F10).

---

## 10. Core-vs-Project split — the one-line tag for the TO-BE

> **"There must be a technical-capability work-type with non-user-facing verification-by-effect (gates + runtime evidence, no demo, no UI affordance, lives in the enabling/Infra zone)"** = **CORE** — the missing reusable primitive.
> **The specific infra inventory** (durable-flows, LiteLLM gateway, outbox/events, observability recorders, MercadoPago, HIPAA dual-filter, alembic migrations, `core/luana-core-*`, the box names `seguridad-cumplimiento`/`motor-agentico`/…) = **PROJECT** (with vitalia HIPAA/PHI specifics = **BRAND**).

The CORE owns the *lane*; the PROJECT fills it via the seam (`engine_prefix`, `toolchain.migrate`, `live_verify_infra[]`, `domain_modules[]`).
