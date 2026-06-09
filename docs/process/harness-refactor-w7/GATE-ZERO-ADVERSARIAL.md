# GATE ZERO — Adversarial Verification of W7 Load-Bearing Claims

**Role:** Adversarial verification subagent. Default = REFUTED/uncertain unless official docs confirm.
**Run date (UTC):** 2026-06-09 (`date -u` = 2026-06-09)
**Doc source of truth:** Claude Code docs migrated `docs.claude.com/en/docs/claude-code/*` → **`code.claude.com/docs/en/*`** (301 redirects observed live). All citations below are the post-redirect canonical URLs, fetched 2026-06-09.
**Method:** Live `WebFetch` of the current official docs (memory, skills, sub-agents, permissions, plugins-reference), plus `gh`/GitHub issue + CHANGELOG cross-check. No training memory trusted.

---

## CLAIM A — A plugin cannot contribute always-on rules

**Statement under test:** "A Claude Code PLUGIN cannot contribute always-on rules (the `.claude/rules/` whole-dir context-injection channel). Plugins contribute skills/agents/hooks/commands/MCP, but a plugin's CLAUDE.md or any 'rules' are NOT auto-loaded as always-on context."

### VERDICT: **CONFIRMED** (with one important caveat — see "de facto channel" below)

**Controlling text — plugin components are an explicit closed list that does NOT include rules:**
> "A **plugin** is a self-contained directory of components that extends Claude Code with custom functionality. Plugin components include **skills, agents, hooks, MCP servers, LSP servers, and monitors**." — `https://code.claude.com/docs/en/plugins-reference`

The full `plugin.json` manifest schema (Complete schema + Component path fields table) enumerates: `skills`, `commands`, `agents`, `hooks`, `mcpServers`, `outputStyles`, `lspServers`, `experimental.themes`, `experimental.monitors`, `userConfig`, `channels`, `dependencies`, `settings.json` (only `agent` + `subagentStatusLine` keys). **There is NO `rules` field, NO `context` dir, NO `.claude/rules/` channel, and NO CLAUDE.md channel.** `claude plugin init --with` valid values are likewise `skills, agents, hooks, mcp, lsp, output-style, channel` — no rules.

**Controlling text — plugin CLAUDE.md is explicitly NOT loaded as context (direct kill shot for the claim):**
> "A `CLAUDE.md` file at the plugin root is **not loaded as project context**. Plugins contribute context through skills, agents, and hooks rather than CLAUDE.md. To ship instructions that load into Claude's context, put them in a [skill](#skills)." — `https://code.claude.com/docs/en/plugins-reference` § Plugin directory structure

**Cross-confirmation (skills doc):** the documented way for a plugin to ship always-on-ish instructions is a skill, and **skill descriptions are always-on but skill bodies are NOT** — they load only on invoke. So even via the sanctioned channel, a plugin gets an always-on *description line*, not an always-on *rule body*:
> "In a regular session, skill descriptions are loaded into context so Claude knows what's available, but full skill content only loads when invoked." — `https://code.claude.com/docs/en/skills`

### Caveat — a plugin's `SessionStart`/`UserPromptSubmit` hook IS a de-facto context-injection channel
Plugins **can** ship hooks for `SessionStart` and `UserPromptSubmit` (both are in the plugin-reference hook events table). A hook that prints to stdout injects text into the model's context at that event. This is a *de facto* rules channel — but it is materially different from the `.claude/rules/` whole-dir mechanism:
- It is **not declarative** (a script must run; subject to trust gate / `allowManagedHooksOnly` / `strictPluginOnlyCustomization`).
- It is **not the `.claude/rules/` injection path** (no `paths:` frontmatter scoping, no `InstructionsLoaded` semantics, no `/memory` listing).
- For **project-scope** `@skills-dir` plugins, "Background monitors do not load" and component-running surfaces sit behind the workspace trust dialog.

**Bottom line for Claim A:** The literal claim ("a plugin cannot contribute the `.claude/rules/` always-on channel; plugin CLAUDE.md/rules are not auto-loaded") is **CONFIRMED by explicit doc text**. The only honest asterisk: a plugin hook can *simulate* context injection at SessionStart/UserPromptSubmit. If the W7 reshape relies on "plugins literally cannot inject any always-on context," tighten the wording to "no declarative rules channel; only a hook can simulate it."

---

## CLAIM B — CC following SYMLINKS for rules/agents/skills discovery is UNDOCUMENTED & untrustworthy

**Statement under test:** "CC following SYMLINKS for rules/agents discovery is UNDOCUMENTED; cannot be trusted without an empirical session-restart test."

### VERDICT: **MIXED** (REFUTED for `.claude/rules/`; CONFIRMED for `.claude/agents/` and `.claude/skills/`)

The claim is **wrong for rules** and **right for agents/skills**. Break it apart:

#### B.1 `.claude/rules/` symlinks — **DOCUMENTED (REFUTES the claim for rules)**
> "The `.claude/rules/` directory **supports symlinks**, so you can maintain a shared set of rules and link them into multiple projects. **Symlinks are resolved and loaded normally**, and **circular symlinks are detected and handled gracefully**." — `https://code.claude.com/docs/en/memory` § Share rules across projects with symlinks
> Example shown: `ln -s ~/shared-claude-rules .claude/rules/shared` and `ln -s ~/company-standards/security.md .claude/rules/security.md`.

For rules, symlink-following is an **explicit documented guarantee** (both a symlinked dir and a symlinked single file). The "UNDOCUMENTED" claim is REFUTED here. **SAFE-PER-DOCS.**

#### B.2 `.claude/agents/` symlinks — **UNDOCUMENTED**
The sub-agents doc documents discovery paths and recursion but says **nothing about symlinks**:
> "Claude Code scans `.claude/agents/` and `~/.claude/agents/` **recursively** ... identity comes only from the `name` frontmatter field." — `https://code.claude.com/docs/en/sub-agents`
No symlink statement anywhere in that page. **Official docs silent as of 2026-06-09.** The claim ("undocumented") is CONFIRMED for agents.

#### B.3 `.claude/skills/` symlinks — **UNDOCUMENTED in docs + ACTIVELY BUGGY in practice**
The skills doc documents discovery (parent + nested) and `--add-dir`, but says **nothing about symlinks**. Worse, GitHub shows symlink discovery for skills is historically **broken / inconsistent**, which is the strongest possible support for "cannot be trusted without an empirical test":
- **#14836 `[BUG] /skills command doesn't find skills in symlinked directories` — OPEN** (v2.0.73). Reporter's own demo: `find -L ~/.claude/skills` finds the symlinked `SKILL.md`; `find ~/.claude/skills` (no `-L`) finds nothing. **Discovery does not follow symlinks; execution does.** `https://github.com/anthropics/claude-code/issues/14836`
- **#764 `[BUG] Symlink Resolution Failure: Claude Code Unable to Traverse Symlinked Directory` — OPEN** (since 2025-04-11). `https://github.com/anthropics/claude-code/issues/764`
- **#36659 `Skills not shown in autocomplete when .claude is a symlink` — CLOSED** (2026-03-20). `https://github.com/anthropics/claude-code/issues/36659`
- **#25367 `Custom skills via symlinked ~/.claude/skills/ fail validation but execute correctly` — CLOSED** (2026-02-12). `https://github.com/anthropics/claude-code/issues/25367`

CHANGELOG corroborates symlinks as a recurring patch area but **never** establishes a general "agents/skills discovery follows symlinks" guarantee. Relevant entries (raw `CHANGELOG.md`, anthropics/claude-code main):
> "Fixed duplicate slash commands appearing when ~/.claude is symlinked to a project directory" · "Fixed an issue where skill files inside symlinked skill directories could become circular symlinks" · multiple settings/plugin-marketplace symlink fixes.

**Conclusion B:** The claim is **MIXED**. For **rules**, symlink-following is documented and SAFE. For **agents and skills**, it is **UNDOCUMENTED** and, for skills, **empirically flaky (open bugs)** — exactly the "do not trust without a session-restart test" posture. Do NOT assume a symlinked `.claude/agents/` or `.claude/skills/` is discovered the same way a symlinked `.claude/rules/` is.

---

## SUPPORTING FACTS (quick verdicts)

| # | Fact under test | Verdict | Controlling citation |
|---|---|---|---|
| S1 | Rules load default path = `.claude/rules/`; recurses into subdirs (would `.claude/rules/core/foo.md` load?) | **CONFIRMED — recursive** | memory doc: "All `.md` files are **discovered recursively**, so you can organize rules into subdirectories like `frontend/` or `backend/`." Also `~/.claude/rules/` (user-level) + path-scoped `paths:` frontmatter. Non-`paths` rules "loaded at launch with the same priority as `.claude/CLAUDE.md`." |
| S2 | Agents excluded from `--add-dir` | **CONFIRMED** | sub-agents doc: "Directories added with `--add-dir` **grant file access only** ... and are **not scanned for subagents**." permissions doc exceptions table: "Subagents, commands, and output styles are discovered from the current working directory and its parents, your user directory at `~/.claude/`, and managed settings" (not `--add-dir`). |
| S3 | Skills NOT loaded by `permissions.additionalDirectories` (issue #43267) | **CONFIRMED** | permissions doc: "Directories listed in `permissions.additionalDirectories` in a settings file **grant file access only and do not load any of the configuration below**." skills doc: "The `permissions.additionalDirectories` setting ... grants file access only and **does not load skills**." Issue **#43267 CLOSED** (2026-04-03) `additionalDirectories ... does not trigger discoverability of skill`. |
| S4 | Skills DO load recursively (parent + nested) | **CONFIRMED** | skills doc § Automatic discovery: project skills load from `.claude/skills/` in start dir + every parent up to repo root; nested `.claude/skills/` discovered on demand for files in subdirs (monorepo). |
| S5 | `--add-dir` DOES load skills | **CONFIRMED (documented exception)** | skills doc: "skills are an exception: `.claude/skills/` within an added directory is loaded automatically. **This exception applies only to `--add-dir` and `/add-dir`.**" permissions exceptions table: "Skills in `.claude/skills/` — Yes, with live reload." |
| S6 | A plugin's `skills/` dir loads | **CONFIRMED** | skills doc location table: Plugin `<plugin>/skills/<skill-name>/SKILL.md`, namespaced `plugin-name:skill-name`. plugin-reference: skills are auto-discovered when plugin installed. |
| S7 | `--add-dir` rules loading requires env flag | **CONFIRMED** | memory doc: `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` loads `CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/*.md`, `CLAUDE.local.md` from the added dir. Otherwise NOT loaded. |
| S8 | `InstructionsLoaded` hook treats `.claude/rules/*.md` as real loaded context | **CONFIRMED** | plugin-reference hook table: `InstructionsLoaded` = "When a **CLAUDE.md or `.claude/rules/*.md`** file is **loaded into context**. Fires at session start and when files are lazily loaded during a session." This independently confirms `.claude/rules/` is a first-class always-on (or path-lazy) context channel. |

---

## EXTRACTION-MECHANISM SAFETY RATING (for W7)

The W7 reshape implies moving harness content (`core-harness/`) and re-exposing it via some mechanism. Per the docs as of 2026-06-09:

### SAFE-PER-DOCS
- **Symlinking into `.claude/rules/`** (dir or single file): explicitly documented, circular symlinks handled. Recursion into subdirs documented. This is the one clean always-on channel that is symlink-safe by spec. ✅
- **Copy/sync-on-bootstrap into `.claude/rules/`, `.claude/agents/`, `.claude/skills/`**: real files (no symlink) in the documented discovery paths are unambiguously loaded. The recursion guarantees (rules recursive, agents recursive, skills parent+nested) all hold for real files. ✅ (Safest, lowest-surprise option.)
- **Tier subdirs INSIDE `.claude/rules/` / `.claude/agents/` / `.claude/skills/`** (e.g. `.claude/rules/core/`, `.claude/agents/review/`): documented to load recursively for all three. Note agents/skills identity is by `name` frontmatter / directory name, not subpath (keep names unique). ✅
- **Shipping content as a SKILL via a plugin**: documented; but always-on cost = description only, body loads on invoke (NOT an always-on rule body). ✅ for skills, ✗ if you need always-on rule semantics.

### NEEDS-EMPIRICAL-TEST (session-restart smoke test before relying on it)
- **Symlinking into `.claude/agents/`**: UNDOCUMENTED. No doc guarantee; agent symlink behavior never stated. Test before trusting.
- **Symlinking into `.claude/skills/`**: UNDOCUMENTED **and** open bugs (#14836, #764) show discovery does NOT follow symlinks even when execution does, plus `.claude`-as-symlink autocomplete breakage (#36659, closed). High risk. Test, and expect `/skills` listing to lie.
- **`.claude` itself being a symlink**: history of breakage (#36659, #3249-era changelog). Test.

### UNSAFE-PER-DOCS (will silently fail)
- **`permissions.additionalDirectories` to surface rules/agents/skills**: explicitly grants file access only; loads NONE of them (#43267). ✗
- **`--add-dir` to surface AGENTS, rules, commands, output-styles**: `--add-dir` loads ONLY skills (auto) + `enabledPlugins`/`extraKnownMarketplaces`; rules only with the env flag; agents/commands/output-styles never. Relying on `--add-dir` for agents = silent miss. ✗
- **A plugin shipping a `rules/`/`context/` dir or a plugin-root `CLAUDE.md` as always-on context**: plugin CLAUDE.md is explicitly NOT loaded; there is no plugin rules channel. ✗ (only a SessionStart/UserPromptSubmit hook can simulate it).
- **Path traversal outside a plugin root** (`../shared-utils`) after marketplace install: not copied to cache, won't resolve. ✗

---

## ONE-LINE BOTTOM LINE
- **Claim A: CONFIRMED** — no plugin rules channel; plugin CLAUDE.md explicitly not loaded (only a plugin hook can *simulate* context injection).
- **Claim B: MIXED** — symlink-following is DOCUMENTED & SAFE for `.claude/rules/`, but UNDOCUMENTED for `.claude/agents/` and UNDOCUMENTED + buggy (open #14836/#764) for `.claude/skills/`. The "untrustworthy without an empirical test" posture is correct only for agents/skills, not for rules.

**Net verdict for the gate (the W7 pivot rests on BOTH claims holding):** Claim A holds; Claim B holds for agents/skills but is REFUTED for rules. Because B is partly refuted, the overall gate is **MIXED** — the reshape must not treat all three dirs identically: rules-symlink is doc-blessed, agents/skills-symlink is not. Prefer **copy-sync-on-bootstrap** (or rules-symlink) as the only doc-safe extraction mechanisms.
