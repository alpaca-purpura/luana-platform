# W7 Gate-Zero Research — Does moving harness files out of `.claude/` break Claude Code auto-load?

> **Date:** 2026-06-09 (verified `date -u`). **Sources:** official `code.claude.com/docs` (June 2026) + `anthropics/claude-code` issue tracker. **Method:** fetched live docs, did NOT trust model memory. URLs cited at bottom.

## TL;DR verdict

**The charter's "physical move to repo-root `core-harness/`" does NOT survive as-is for `rules/` and `agents/`. The extraction model must be RESHAPED.**

- **Rules** — load **only** from `.claude/rules/` (and nested `.../.claude/rules/`). **No** config-dir option, **no** plugin pathway (a plugin's `CLAUDE.md` is explicitly *not* loaded as context — plugins contribute via skills/agents/hooks only). Cannot live in a bare `core-harness/rules/` and still inject always-on.
- **Agents** — load **only** from `.claude/agents/`. Explicitly **excluded** from `--add-dir`/`additionalDirectories`. Can be shipped via a **plugin** `agents/` dir.
- **Skills** — most flexible: walk-up + nested `.claude/skills/`, **plus** `--add-dir` loads external `.claude/skills/`, **plus** plugin `skills/`. But `permissions.additionalDirectories` (settings.json) does **NOT** load skills (bug #43267, closed).
- **Hooks** — fully path-referenced. A hook script can live **anywhere** (incl. `core-harness/`) as long as `.claude/settings.json` points at it via absolute or `${CLAUDE_PROJECT_DIR}`-relative path. Trivially survives a physical move.

The one mechanism that lets all four surfaces live under `core-harness/` is **packaging `core-harness/` as a Claude Code PLUGIN** loaded via an **in-repo local marketplace** (`./core-harness` relative source or `git-subdir`). BUT: plugins **cannot ship always-on `.claude/rules/`** — rules-as-always-on context has no plugin equivalent. So even the plugin route forces the rules surface to be reshaped (rules → either stay in `.claude/`, or convert each always-on rule into a skill/agent system-prompt).

## Surface × mechanism matrix

| Surface | Default load path | Follows symlink? | Config-dir / external option? | Can live OUTSIDE `.claude/` & still load? |
|---|---|---|---|---|
| **Rules** (`.claude/rules/*.md`, whole-dir always-on; subdirs recursive) | `.claude/rules/` only (no `paths:` = session-start always-on; `paths:` = read-trigger; subdirs like `.claude/rules/frontend/react.md` auto-discovered) | **UNDOCUMENTED** for plain `.claude/rules/` — needs empirical session-restart test | **NO.** No settings key adds an external rules dir. Plugin `CLAUDE.md`/rules NOT loaded as context (docs explicit). | **NO** (only as a plugin skill/agent, losing always-on semantics) |
| **Skills** (`.claude/skills/{name}/SKILL.md`) | Personal `~/.claude/skills/`, Project `.claude/skills/` (walk-up to repo root + on-demand nested e.g. `packages/x/.claude/skills/`), plugin `skills/` | **UNDOCUMENTED** for plain skills — needs empirical test. Plugin symlinks: see below | **PARTIAL.** `--add-dir DIR` loads `DIR/.claude/skills/` (CLI flag only). `permissions.additionalDirectories` does **NOT** (bug #43267, design gap, closed). | **NO** if you mean a bare `core-harness/rules`-style dir. **YES** via (a) a `.claude/skills/` placed *anywhere on the walk-up/nested tree*, (b) `--add-dir`, or (c) a plugin |
| **Agents** (`.claude/agents/*.md`) | Project `.claude/agents/`, `~/.claude/agents/` (+ plugin `agents/`) | UNDOCUMENTED — needs empirical test | **NO.** Docs: "subagents...not loaded from additional directories" (excluded from `--add-dir`/`additionalDirectories`). | **NO** standalone. **YES** only via a plugin `agents/` dir |
| **Hooks** (`.claude/settings.json` `hooks` block → script paths) | `settings.json` (project/local/user) references scripts by path | N/A — path-referenced; OS resolves symlink at exec | **YES.** Path is explicit. Use absolute or `${CLAUDE_PROJECT_DIR}/...`. Plugin hooks use `${CLAUDE_PLUGIN_ROOT}` + `hooks/hooks.json`. | **YES** — script body lives wherever; only the path string must point at it |

### Key doc quotes (load-bearing)
- Rules: *"A rule without `paths:` frontmatter loads at session start like CLAUDE.md... Subdirectories work: `.claude/rules/frontend/react.md` is discovered automatically."* (claude-directory)
- Skills walk-up/nested: *"Project skills load from `.claude/skills/` in your starting directory and in every parent directory up to the repository root... also discovers skills from nested `.claude/skills/` directories on demand."* (skills)
- `--add-dir` vs settings: *"The `--add-dir` flag... grant file access rather than configuration discovery, but skills are an exception: `.claude/skills/` within an added directory is loaded automatically. This exception applies only to `--add-dir`... The `permissions.additionalDirectories` setting in `settings.json` grants file access only and does not load skills."* (skills) + bug #43267 (closed, design gap).
- Agents/commands excluded: *"Other `.claude/` configuration such as subagents, commands, and output styles is not loaded from additional directories."* (skills)
- **Plugin rules killer:** *"A `CLAUDE.md` file at the plugin root is not loaded as project context. Plugins contribute context through skills, agents, and hooks rather than CLAUDE.md."* (plugins-reference §793). **No `rules` field exists in the plugin manifest.**
- Plugin hooks path var: *`"command": "\"${CLAUDE_PLUGIN_ROOT}\"/scripts/format-code.sh"`* (plugins-reference).
- Plugin symlink caveat for local/`--plugin-dir`: *"For plugins installed with `--plugin-dir` or from a local path, only symlinks that resolve within the plugin's own directory are preserved. All others are skipped."* (plugins-reference §732).

## Extraction-pattern candidates evaluated

### A. Symlink pattern (`.claude/rules/` → `core-harness/rules/`)
**Status: UNDOCUMENTED for the standalone `.claude/` scanners — MUST be empirically tested (session restart).** Docs never state whether the plain `.claude/{rules,skills,agents}` scanners traverse symlinks. The only symlink behavior *documented* is for **plugins** (and there, local/`--plugin-dir` plugins drop any symlink resolving *outside the plugin's own dir* — which is exactly the cross-tree case we'd want). So if standalone scanners behave similarly, an outside-pointing symlink would be skipped.
- Tradeoff: zero config if it works; but undocumented = fragile across CC upgrades, and the plugin-symlink precedent suggests cross-dir symlinks are *deliberately* skipped for security. **Do not bet the charter on this without a live test.**

### B. Config-directory pattern (settings.json key registering an external rules/skills/agents dir)
**Status: does NOT exist for rules or agents. For skills, only the CLI `--add-dir` flag works — not a persistent settings key.** `permissions.additionalDirectories` grants file access only (bug #43267). There is **no** `extraKnownProjectDirs`/`rulesPath`/`skillsPath` setting. (`extraKnownMarketplaces` exists but only registers *marketplaces*, see D.)
- Tradeoff: dead end for rules/agents. `--add-dir core-harness` could pull skills but is a launch-flag, not committed config, and still ignores rules/agents.

### C. Plugin / marketplace pattern (package `core-harness/` AS a plugin)
**Status: DOCUMENTED and viable for skills + agents + hooks + commands — but NOT for always-on rules.** A plugin contributes `skills/`, `agents/`, `hooks/hooks.json`, `commands/`, `.mcp.json`, `.lsp.json`, `settings.json` — **no rules/always-on-context channel** (plugin CLAUDE.md ignored).
- **In-repo packaging works:** put `core-harness/.claude-plugin/plugin.json` + `core-harness/{skills,agents,hooks}/`, and a repo-root `.claude-plugin/marketplace.json` whose plugin entry uses **`"source": "./core-harness"`** (relative path resolves to repo root, must start with `./`, no `../`) or **`git-subdir`** (`{url, path: "core-harness"}`, sparse clone — ideal for monorepo). Register via `extraKnownMarketplaces` in settings.json so it auto-adds.
- **Caveat for fresh-repo droppability:** relative-path sources only resolve when the marketplace is added via Git (not raw-URL). And install copies the plugin into `~/.claude/plugins/cache/` — so it's a *copy-on-install*, not a live in-tree read. Skills/agents edits then need `/plugin marketplace update` + `/reload-plugins`, OR develop with `--plugin-dir ./core-harness` / a `@skills-dir` plugin for live iteration.
- Tradeoff: this is THE documented way to make harness droppable into a fresh repo (it's literally "convert `.claude/` to a plugin → distribute via marketplace"). **But rules must be handled separately.**

### D. Under-`.claude/` pattern (`core-harness/` lives at `.claude/core-harness/`)
**Status: does NOT help.** The scanners look for `.claude/rules/`, `.claude/skills/`, `.claude/agents/` — not `.claude/<anything>/rules/`. Nesting a `core-harness/` *inside* `.claude/` puts the files at `.claude/core-harness/rules/...`, which is **not** on any discovery path (rules/agents are single-segment under `.claude/`; skills walk-up/nested but still require a `.claude/skills/` segment). So `.claude/core-harness/` is just inert files. (Recursion that *does* work: `.claude/rules/<subdir>/` for rules, and nested `.../.claude/skills/` for skills — but that's subdirs *under* the canonical dir, not a sibling kit dir.)

### E. Copy-on-bootstrap (extract a `core-harness/` *template*; bootstrap script copies into `.claude/`)
**Status: always works — it sidesteps auto-load entirely.** Keep `core-harness/` as the SSoT *source*, and a `make harness-install` / bootstrap step copies (or symlinks per-file *into* `.claude/` from within the same tree, where intra-tree symlinks are most likely fine) `core-harness/{rules,skills,agents}` → `.claude/{rules,skills,agents}` and merges hook entries into `settings.json`.
- Tradeoff: a sync step (drift risk between `core-harness/` source and the installed `.claude/` copy — needs a `make` target + a freshness gate, exactly like the existing `BACKLOG`/auto-gen pattern). But it's the only mechanism that preserves ALL FOUR surfaces including always-on rules with zero dependence on undocumented behavior.

## Ranked recommendation

1. **HYBRID = Copy/sync-on-bootstrap (E) for rules + agents, with the kit SSoT in `core-harness/`; hooks point at `core-harness/` directly (no copy needed).** Rules and agents have **no** external-load path, so `core-harness/{rules,agents}` must be *installed into* `.claude/` by a bootstrap/`make` target (freshness-gated against drift). Hooks are pure path-reference → `settings.json` can point straight at `core-harness/hooks/*.sh` via `${CLAUDE_PROJECT_DIR}/core-harness/...` with **no** copy. This makes `core-harness/` the extractable kit; the only "magic" is one install step. **Lowest risk, fully documented.**
2. **PLUGIN (C) for the skills+agents+hooks+commands portion**, if the goal is *true* drop-in distribution to a fresh repo via marketplace. `core-harness/` becomes a plugin (`./core-harness` relative source or `git-subdir`). Best for sharing/versioning. **But rules still need (E).** Slightly more moving parts (marketplace.json + cache + reload). Pick this if "droppable kit" means "a teammate runs `/plugin install`."
3. **`--add-dir core-harness` (B-skills) only as a dev convenience** for skills — never as the production mechanism (launch-flag, ignores rules/agents).
4. **Symlink (A) — only after an empirical session-restart test confirms standalone scanners traverse symlinks.** Treat as UNDOCUMENTED until proven; the plugin-symlink precedent (cross-dir symlinks skipped) is a red flag.
5. **Under-`.claude/` (D) — reject.** Doesn't load.

## Direct answer to the gate question

> Does moving harness files out of `.claude/` BREAK auto-load?

- **Hooks: NO** (path-referenced — move freely, just fix the path in settings.json).
- **Skills: PARTIALLY** — break under a bare `core-harness/skills/`, but recoverable via plugin, `--add-dir`, or a nested `.claude/skills/`.
- **Rules: YES, BREAKS** — no external-load path exists, and plugins can't ship always-on rules. **This is the hard gate.**
- **Agents: YES, BREAKS** standalone — recoverable only by packaging as a plugin.

**Therefore: the charter's literal "physical move to repo-root `core-harness/` with same-load" must be RESHAPED.** Viable reshape: `core-harness/` is the kit SSoT; **rules + agents are installed into `.claude/` by a bootstrap/sync step** (or agents shipped via plugin), **hooks point at `core-harness/` directly**, and **skills go via plugin or sync**. There is no single config flag or symlink that the docs guarantee will keep all four surfaces loading from a repo-root `core-harness/`.

## Sources fetched
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/plugins
- https://code.claude.com/docs/en/plugins-reference
- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/claude-directory
- https://github.com/anthropics/claude-code/issues/43267 (additionalDirectories ≠ skill discovery; closed as duplicate / design gap)
