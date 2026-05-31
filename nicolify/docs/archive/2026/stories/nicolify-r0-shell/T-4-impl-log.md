# T-4 Implementation Log — Panel Luana skeleton
**Ticket:** T-4 · Story: nicolify-r0-shell · Brand: nicolify
**Date:** 2026-05-30
**Agent:** builder-frontend (Sonnet 4.6)

## Plan

### Design-system-first (D1)
Atoms consumed from `components/ui/` (Button existing + Badge/Input/Tooltip added from vitalia port):
- Button, Tooltip, TooltipTrigger, TooltipContent — LuanaRail
- Input — LuanaHistory search
- Badge — ChatHeader mode pill
- No primitives recreated from scratch.

Shell organism components: all portated verbatim from `vitalia/frontend/src/components/shared/shell-organism/` with re-theming (Valeria→Luana, vitalia agents→nicolify agents, `bg-agent-valeria→bg-agent-luana`).

### Mockup adherence + scope
Implemented per 01-spec.md § Bloque D:
- D1: 3 states (collapsed/history/full) — history=compact icon rail (60px), full=280px history panel + chat
- D2: mobile drawer independent slice (mobileDrawerOpen, no coupling to luanaState)
- ChatComposer placeholder "Escríbele a Luana…" (tuteo) — NON-functional skeleton
- AgentAvatar with initial fallback if 404 (E4 scenario)
- Luana avatar color #635BFF in ChatHeader

**Mockup scope notes:** All 01-spec.md D scenarios for Bloque D are covered. Visual goldens (luana-chat-skeleton + luana-rail) declared in 04-validators.yaml — Playwright goldens deferred to T-6 (routing+e2e delivery).

### Test battery
- RED first: LuanaSidebar.test.tsx + LuanaChat.test.tsx + AgentAvatar.test.tsx written before implementation
- Component tests: 13 new tests (role=complementary gate, 3 state transitions, D2 mobile closed default, aria-label, E4 fallback)
- No E2E smoke for this ticket (route-level E2E is T-6 deliverable)

### Integration (CONN)
- LuanaSidebar is already referenced in ShellOrganismLayoutClient.tsx (imported from T-3)
- T-3 placeholder stub is REPLACED with full implementation — no new import chain needed
- `agent-catalog.ts` + `chat-store.ts` added to `src/lib/` and `src/stores/` respectively

## Files created / modified

| File | Action |
|---|---|
| `LuanaSidebar.tsx` | REPLACED T-3 stub with full 3-state implementation |
| `LuanaRail.tsx` | NEW — 60px icon rail |
| `LuanaHistory.tsx` | NEW — conversation list + search |
| `LuanaChat.tsx` | NEW — 3-row grid organism |
| `ChatHeader.tsx` | NEW — avatar + status + mode pill |
| `ChatComposer.tsx` | NEW — placeholder textarea (NON-functional R0) |
| `ChatMessages.tsx` | NEW — message log + EmptyStateChat |
| `MessageBubble.tsx` | NEW — bot/user bubbles |
| `TypingIndicator.tsx` | NEW — animated dots indicator |
| `DelegateMarker.tsx` | NEW — delegation handoff marker |
| `HistoryGroup.tsx` | NEW — conversation group |
| `HistoryItem.tsx` | NEW — conversation row |
| `EmptyStateInline.tsx` | NEW — search no-results |
| `_mock-conversations.ts` | NEW — B2B agency mock history |
| `_mock-messages.ts` | NEW — Luana B2B mock chat |
| `components/shared/agents/AgentAvatar.tsx` | NEW — img + fallback initial |
| `hooks/use-keyboard-shortcuts.ts` | NEW — keyboard shortcuts hook |
| `lib/agent-catalog.ts` | NEW — nicolify 6-agent catalog |
| `stores/chat-store.ts` | NEW — ephemeral chat Zustand store |
| `components/ui/badge.tsx` | NEW — from vitalia port |
| `components/ui/input.tsx` | NEW — from vitalia port |
| `components/ui/tooltip.tsx` | NEW — from vitalia port |
| `public/agents/{6 slugs}/avatar.svg` | NEW — placeholder SVGs |
| `__tests__/LuanaSidebar.test.tsx` | NEW — 7 tests (RED first) |
| `__tests__/LuanaChat.test.tsx` | NEW — 3 tests (RED first) |
| `__tests__/AgentAvatar.test.tsx` | NEW — 3 tests (RED first) |

## Gate results

| Gate | Result |
|---|---|
| TypeScript `--noEmit` | ✅ 0 errors |
| ESLint (60+ rules, --cache) | ✅ 0 errors, 66 warnings (baseline maintained) |
| Vitest run --coverage | ✅ 173 tests pass, 33.41% statements coverage |
| Architecture fitness (existing) | ✅ all passing |

## Skills consulted (must_load enforcement v4.1)

| Skill | Why invoked | Decision |
|---|---|---|
| `nicolify-design-system` | T-4 assignment mandatory; nicolify agent catalog + tokens | Used `_agent-tw-classes.ts` static lookup (G3 gate), `agentBgClass(slug)` for avatar colors |
| `frontend-expert` | Always — FSD-Lite boundary, Server-First, SSR patterns | LuanaSidebar under `components/shared/`, not `features/`; chat-store in `stores/` |
| `tessl__react-patterns` | Always — error boundaries, loading/error/empty states, accessible markup | role=complementary, role=region, role=log, aria-label everywhere; img fallback pattern |
| `tessl__shadcn-ui` | UI atoms needed (Badge/Input/Tooltip) | Ported from vitalia port, never recreated from scratch |
| `brand-expert` | T-4 touches brand-specific agent catalog | agent-catalog.ts mirrors nicolify brand (6 agents, Luana orchestrator) |

## Cross-story observed bugs
None observed. T-3 components (ShellOrganismLayoutClient, AppPanelSlot, useViewportGuard) compile and integrate cleanly with T-4 LuanaSidebar replacement.

## Notes
- Vitalia ValeriaSidebar uses `ValeriaState = "collapsed" | "rail" | "full"`. Nicolify uses `LuanaState = "collapsed" | "history" | "full"` — "rail" renamed to "history" (more intuitive for B2B context). This required updating all references.
- `useKeyboardShortcuts` renamed to `use-keyboard-shortcuts.ts` (kebab-case per `check-file/filename-naming-convention` ESLint rule).
- cognitive-complexity in use-keyboard-shortcuts refactored from 16→<15 by extracting `matchesShortcut()` helper.
- Offline env: push deferred per T-4 gate instructions.
