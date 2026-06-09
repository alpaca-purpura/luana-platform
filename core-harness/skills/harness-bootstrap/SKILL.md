---
name: harness-bootstrap
description: Bootstrap the extractable dev-process harness into a fresh product repo — copy the core rules into .claude/rules/, write a project.config.yaml stub, and run the doctor to list the slots the new product must fill. Use when dropping core-harness/ into a new repo, or when the user asks to "bootstrap the harness", "set up the process kit", "install core-harness", or "qué le falta al harness en este proyecto".
---

# /harness:bootstrap — install the dev-process kit into a new product

> **The extraction-bootstrap (program DoD).** Runs in the ADOPTER's repo after `core-harness/` is dropped in. Inert in the source product (whose harness is already live natively via `.claude/`); shipped via the `harness` plugin for OTHER products. The kit (`core-harness/rules,skills,agents,hooks,templates,process,scripts`) is populated and W8-verified (extraction-test passing).

## What this does (the "detect what's missing + fill it" step)

A new product drops `core-harness/` + an empty `project.config.yaml` into its repo. This skill:

1. **Re-expose the core to Claude Code** (the ratified Option-C mechanism · see `core-harness/README.md`):
   - **rules** → `ln -s` each `core-harness/rules/*.md` into `.claude/rules/` (symlink is DOCUMENTED-SAFE for `.claude/rules/`; recursive, circular-safe).
   - **agents** → copy `core-harness/agents/*` into `.claude/agents/` (agents-symlink is undocumented — copy is safe).
   - **skills** → the harness plugin already namespaces them; OR copy into `.claude/skills/`.
   - **hooks** → ensure `settings.json` (or the plugin `hooks.json`) points at `core-harness/hooks/*` (incl. the SessionStart slim-rule injector).
   - **templates / process-docs / scripts** → symlink-back at the conventional path (read-by-path → OS resolves).
2. **Write a `project.config.yaml` stub** (all slots `__FILL_ME__`) at the repo root if absent.
3. **Run the doctor:** `python core-harness/scripts/harness_config.py --doctor` → it walks the schema and lists every unfilled slot (toolchain · brands · locale · engine_prefix · live_verify_infra · design_system_ref · domain_modules · agent_roster · value_stream · wip_caps). Exit 3 while any `__FILL_ME__` remains.
4. **Report** the unfilled slots + a one-line "fill these, then idea→done runs without editing the CORE" (multibrand = `brands.active` with a single entry).

## The contract (what the adopter fills, what the core never names)

The CORE reads the **seam** (`project.config.yaml`) for every tech/brand/locale/engine/live-env fact. The adopter fills the slots; the CORE rules/skills/agents/hooks/templates/process stay byte-identical across products. A new tech stack = new `toolchain`/`domain_modules` slot values; a single-brand product = `brands.active: [one]`. **No core file is edited to adopt the harness.**

## Pointers
- `core-harness/README.md` — the kit structure + the Option-C re-expose mechanism + the extraction procedure.
- `core-harness/scripts/harness_config.py --doctor` — the slot-gap detector (the W8 extraction-test gate).
- `docs/process/harness-refactor-charter-2026-06-08.md §8` — the program DoD (the extraction test).
