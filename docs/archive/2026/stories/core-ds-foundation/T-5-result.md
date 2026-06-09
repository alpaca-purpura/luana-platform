# T-5 result — EntityInfoCard (Opción B) in @luana/ui-kit

**Ticket:** core-ds-foundation T-5
**Canon:** `design-system-canon.md §2.3` — grid-friendly entity card, brand-agnostic.
**Status:** done (gate GREEN, committed + pushed).

## Files

| File | Action |
|---|---|
| `core/@luana/ui-kit/src/EntityInfoCard.tsx` | NEW — `EntityInfoCard` + `EntityInfoCardSkeleton` + `EntityInfoCardEmpty` |
| `core/@luana/ui-kit/src/__tests__/EntityInfoCard.test.tsx` | NEW — validator F-8 (12 tests) |
| `core/@luana/ui-kit/src/index.ts` | EDIT — `export * from "./EntityInfoCard"` |

## Component

Lifted/generalized 3 brand sources (read-only): vitalia `StaffCard` (circular media + title/subtitle badge + metrics grid), nicolify `IcpCard` (agent-color icon media + status chip + focus-visible ring), vitalia `ReEngagementCard` (declarative token-driven color map + `stopPropagation` action pattern).

- Circular media: `Avatar` (image | initials | `icon` node), token-driven `mediaClass`.
- TOP-border accent: structural `border-t-4` + `accentClass` (Tailwind utility) OR `accentVar` (CSS var → `borderTopColor: hsl(var(...))`). **No hex.**
- Title (truncate) + subtitle `Badge`.
- Metrics row: `<dl>` with equal cols (`gridTemplateColumns: repeat(N, minmax(0,1fr))`), centered.
- Footer status chip (`Badge`).
- Whole card clickable: `role="button"` + `tabIndex=0` + Enter/Space activation + hover/focus-visible/selected/inactive states; `role` omitted when no `onClick`.
- Kebab `⋮`: ui-kit `DropdownMenu`, trigger button `onClick={e => e.stopPropagation()}` so kebab clicks never fire card `onClick`. Renders only when `actions` provided.
- Strings default Spanish neutro LatAm.
- Header: `// canon: design-system-canon.md §2.3 · story-origin: core-ds-foundation` (brand `// cap:` headers stripped on lift).

## Gate output

```
npx vitest run src/__tests__/EntityInfoCard.test.tsx
 ✓ src/__tests__/EntityInfoCard.test.tsx (12 tests) 95ms
 Test Files  1 passed (1) | Tests  12 passed (12)

npx tsc --noEmit 2>&1 | grep "src/EntityInfoCard"
 (empty — source tsc-clean; index.ts clean)
```

Test-file tsc noise (`toHaveAttribute`/`toBeInTheDocument` not on `Assertion`) is the SAME pre-existing jest-dom matcher noise present in `EntitySubNavBar.test.tsx` (T-4) — not introduced by T-5.

Note: the "kebab opens menu (items in DOM)" assertion was replaced by a stopPropagation + trigger-aria assertion — Radix `DropdownMenu` portal does not open under `fireEvent.click` in jsdom (missing pointer-capture APIs), a harness limitation, not a component defect. The load-bearing contract (kebab click does NOT fire card `onClick`; card still clickable) is asserted directly.

## Skills consulted

- `.claude/rules/frontend-visual-fidelity.md` (Design System Canon §2.3 binding)
- `.claude/rules/frontend-fsd.md`, `.claude/rules/anti-duplication.md` (lift, no mirror)
- `.claude/rules/tdd-mandatory.md`, `.claude/rules/spanish-text.md`

## SHA

`f7176445` — `feat(core-ds): T-5 EntityInfoCard + Skeleton + Empty in @luana/ui-kit` (branch `wip/vitalia`)
