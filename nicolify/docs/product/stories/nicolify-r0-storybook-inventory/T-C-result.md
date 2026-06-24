# T-C — Result: TenantBadge + TenantOption lift + SubSubTabsBar cleanup

**Date:** 2026-06-24
**Branch:** wip/nicolify
**Status:** DONE — all verifications GREEN

---

## LIFT 1+2 — TenantBadge + TenantOption → kit

### Files created in kit

- `core/@luana/ui-kit/src/organism/shell/TenantBadge.tsx`
  — Generic atom. Props: `tenant: KitTenant`, `pickPaletteColor: (id) => PaletteColor`, optional `className`.
  — Exports `TenantBadge`, `getTenantInitials` (helper), `KitTenant`, `PaletteColor`, `TenantBadgeProps`.
  — `cn` from `@luana/format/utils` (no brand import). Server Component.

- `core/@luana/ui-kit/src/organism/shell/TenantOption.tsx`
  — Generic molecule. Props: `tenant`, `active`, `pickPaletteColor`, optional `activeLabel` (default `"Espacio activo"`).
  — City rendered with null-check (vitalia pattern — safe for both brands since nicolify's `Tenant.city` is effectively required but the kit type is optional `city?`).
  — Exports `TenantOption`, `TenantOptionProps`.

### Kit barrel updated

- `core/@luana/ui-kit/src/organism/shell/index.ts` — added exports for `TenantBadge`, `getTenantInitials`, `TenantOption` + their types.
- `core/@luana/ui-kit/src/index.ts` — added named re-exports (value + type) for both components.

### Stories created (CSF3, synthetic data)

- `core/@luana/ui-kit/stories/shell.TenantBadge.stories.tsx` — 7 stories covering multi-word, single-word, empty name, no city, custom className.
- `core/@luana/ui-kit/stories/shell.TenantOption.stories.tsx` — 7 stories covering inactive, active, vitalia label, nicolify label, no city variants, list composite.

### Vitalia repainted

- `vitalia/frontend/src/components/shared/shell-organism/TenantSwitcher.tsx`
  — Imports `TenantBadge`, `TenantOption` from `@luana/ui-kit`.
  — Imports `pickPaletteColor` from `@/lib/tenant-palette`.
  — Call-sites updated: `TenantBadge` gets `pickPaletteColor={pickPaletteColor}`, `TenantOption` gets `pickPaletteColor={pickPaletteColor}` + `activeLabel="Clínica activa"`.

- `vitalia/frontend/src/components/shared/shell-organism/__tests__/TenantBadge.test.tsx`
  — Import repainted to `@luana/ui-kit`. All render calls pass `pickPaletteColor={pickPaletteColor}`.

- `vitalia/frontend/src/components/shared/shell-organism/__tests__/TenantOption.test.tsx`
  — Import repainted to `@luana/ui-kit`. Render calls pass `pickPaletteColor` + `activeLabel="Clínica activa"` where needed.

### Deleted local copies (4 files)

- `vitalia/frontend/src/components/shared/shell-organism/TenantBadge.tsx` — DELETED
- `vitalia/frontend/src/components/shared/shell-organism/TenantOption.tsx` — DELETED
- `nicolify/frontend/src/components/shared/shell-organism/TenantBadge.tsx` — DELETED
- `nicolify/frontend/src/components/shared/shell-organism/TenantOption.tsx` — DELETED

---

## REPOINT 3 — SubSubTabsBar nicolify

**Decision: orphan dead code → DELETED (clean)**

Analysis:
- nicolify's local `SubSubTabsBar()` takes **zero props** — reads `AGENT_SUBSUBTABS` directly from `@/lib/routing/shell-routes`.
- Kit's `SubSubTabsBar` takes `{ subSubTabsByKey, validSlugs, onNavigate? }` — catalog-injection contract.
- Contract mismatch: would require a wrapper to repoint call-sites.
- BUT: grep showed **no call-sites** — the local component was never imported by any file outside `shell-organism/`. The shell uses kit's `ShellLayout` which contains the kit's `SubSubTabsBar` internally (fed via `ShellLayoutWire.tsx` `subSubTabsByKey` prop).
- `SubSubTab.tsx` was only imported by the local `SubSubTabsBar.tsx`.

**Result:** Both files deleted as dead code (cleaner than keeping an orphan that's stale vs the kit).

- `nicolify/frontend/src/components/shared/shell-organism/SubSubTabsBar.tsx` — DELETED (orphan dead code)
- `nicolify/frontend/src/components/shared/shell-organism/SubSubTab.tsx` — DELETED (orphan, only consumer was SubSubTabsBar)

**Flag — if future nicolify story adds N3 routing entries to `AGENT_SUBSUBTABS`:** use the kit's `SubSubTabsBar` via `ShellLayout` (already wired in `ShellLayoutWire.tsx` via `subSubTabsByKey` prop). Do NOT recreate a local copy.

---

## Verification results

| Check | Result |
|---|---|
| `cd core/@luana/ui-kit && npx tsc --noEmit` | ✅ 0 errors |
| `cd vitalia/frontend && npx tsc --noEmit` | ✅ 0 errors |
| `cd nicolify/frontend && npx tsc --noEmit` | ✅ 0 new errors (only pre-existing HB-109 zustand/persist in `core/@luana/hooks`) |
| `vitest run TenantBadge.test.tsx TenantOption.test.tsx` (vitalia) | ✅ 23/23 tests PASS |

---

## Design decisions

- **`pickPaletteColor` as required prop** — follows the existing kit prop-injection pattern (e.g., `TopBarShell` / `ShellLayout` accept `getAgentClasses`). The kit must not own brand-specific palettes. Each brand passes its own `pickPaletteColor` from `@/lib/tenant-palette`.

- **`KitTenant.city?: string` (optional)** — vitalia's `Tenant.city` is optional; nicolify's was `required`. The kit type uses optional (more generic). The `TenantOption` renders `city` with a null-check — safe for both.

- **`activeLabel` defaulting to `"Espacio activo"`** — neutral LatAm Spanish (no brand-specific "Clínica"/"Agencia"). Vitalia passes `"Clínica activa"`, nicolify would pass `"Agencia activa"` if/when it wires TenantSwitcher.

- **`getTenantInitials` exported** — allows brands to compute initials independently (e.g., for a11y label) without re-implementing the logic.
