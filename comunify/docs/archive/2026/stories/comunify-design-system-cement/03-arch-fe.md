---
story_id: comunify-design-system-cement
surface: FE
sub_architect: /architect-fe
arch_version: 1
last_modified: 2026-05-18
links:
  parent_arch: "./03-arch.md"
---

# Architecture FE — Comunify Design System Cement

> **Pointer file.** This story's surface is exclusively FE (frontend tokens + typography + arch fitness ratchet). The full architecture content lives in the parent **`./03-arch.md`** — every section there is FE-scoped.

## Why this file exists

`/architect` orchestrator pattern produces one consolidated `03-arch.md` PLUS per-surface `03-arch-{be,fe,agentic}.md` sub-files when a story spans multiple surfaces. This story is single-surface (FE-only), so this sub-file is a pointer to the root — keeping the file naming convention consistent for /dev-team + auditor tooling that expects `03-arch-fe.md` when surface includes FE.

## Where to read what

| Topic | Location in `03-arch.md` |
|---|---|
| Context summary + surface mapping | § 0 |
| Decisión arquitectónica clave (3-layer ratchet) | § 1 |
| Files in scope (CREATE/MODIFY/MIGRATE) | § 2 |
| CSS architecture (`globals.css`) | § 3 |
| Font loading strategy (`layout.tsx`) | § 4 |
| Tailwind config extension | § 5 |
| Token migration mechanics (manual, not sed) | § 6 |
| Arch fitness test design | § 7 |
| Playwright smoke spec design | § 8 |
| TDD sequence of operations | § 9 |
| Tailwind v4.1 specifics (decision log) | § 10 |
| Cross-cutting + brand overlay applicability | § 11 |
| Architecture fitness impact + allowlist policy | § 12 |
| Capability YAML updates required | § 13 |
| Test surfaces (TDD order) | § 14 |
| Research notes (date-aware) | § 15 |
| Open questions (all auto-resolved) | § 16 |
| Risk register | § 17 |
| Decisiones registradas (D1-D8) | § 18 |

## Builder + auditor routing

- **Builder:** `builder-frontend` (Sonnet) for all tickets T-1..T-5 — production_code: true but surface=FE non-agentic per R23 → Sonnet OK.
- **Auditor:** `auditor-frontend` (Opus) for review pass.
- **Skills to load when implementing:** `frontend-expert` (auto-loads `references/frontend-quality.md` + `frontend-fsd.md` + `runtime-quality-checklist.md`) + `playwright-expert` (for T-4 only).

## Why no BE / agentic sub-files exist

Per `03-arch.md § 0` surface mapping:
- BE: NONE — no backend changes, no migrations, no DTOs, no services.
- Agentic: NONE — no LangGraph, no copilot/sales_agent tools, no eval goldens.

If a future story extends this design-system cement into BE schemas (e.g., persisting tenant-overridable brand tokens), a separate story will produce `03-arch-be.md`. NOT this story.

`done -> 03-arch-fe.md`
