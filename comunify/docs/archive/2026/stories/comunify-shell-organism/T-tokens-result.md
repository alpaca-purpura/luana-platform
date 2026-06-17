# T-tokens — Result

**Ticket:** T-tokens (design tokens + fonts + Tailwind config)
**Brand:** comunify
**Commit:** `144c05d8`
**Branch:** `wip/comunify`
**State:** tests-passing

## Files changed

| File | Change |
|---|---|
| `comunify/frontend/src/app/globals.css` | +shell surface tokens + agent ring tokens + `.dark` block + border-color cement rule |
| `comunify/frontend/tailwind.config.ts` | +kit content glob (CRITICAL) + `darkMode:"class"` + shell/agent colors |
| `comunify/frontend/src/app/layout.tsx` | No changes — already correct (Plus Jakarta Sans as Satoshi fallback, all 3 font variables wired to `<html>`) |

## What was added

### globals.css

```css
/* Shell surface tokens (light) */
--bg: 240 20% 99%;
--panel: 0 0% 100%;
--line: 240 14% 92%;
--muted: 240 10% 46%;
--ink: 240 24% 14%;

/* Agent ring tokens */
--agent-luana: 264 92% 58%;
--agent-nina: 252 100% 62%;
--agent-tomas: 217 95% 58%;
--agent-sofia: 152 80% 43%;
--agent-bruno: 38 92% 50%;   /* 38 NOT 45 — distinct from --comunify-warning */
--agent-lucia: 220 84% 45%;

/* Dark mode override */
.dark {
  --bg: 240 18% 8%;
  --panel: 240 16% 12%;
  --line: 240 12% 22%;
  --muted: 240 8% 62%;
  --ink: 240 20% 96%;
}

/* Border cement rule */
*, *::before, *::after { border-color: hsl(var(--line)); }
```

### tailwind.config.ts

- **Kit glob added** (critical footgun fix):
  `"../../core/@luana/ui-kit/src/**/*.{ts,tsx}"`
  Without this, `rounded-full`, `bg-agent-*`, `ring-agent-*` in kit organisms fail silently.
- `darkMode: "class"` (class-based dark mode for next-themes ThemeProvider)
- Shell surface colors: `bg`, `panel`, `line`, `muted`, `ink` (maps to CSS vars)
- Agent colors: `agent-luana` through `agent-lucia`

## Quality gates

| Gate | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src/` | 0 errors |
| Arch fitness (7 tests) | 7/7 PASS |

## Skills consulted

| Skill | Invoked for | Decision |
|---|---|---|
| `frontend-expert` | FSD-Lite boundaries, CSS var HSL pattern, Tailwind content glob footgun | Apply shell tokens in `:root`, kit glob is MANDATORY |
| `brand-expert` (design-system-canon) | Token naming, agent colors SSoT | Agent ring tokens per design-inventory.md §1, golden confirmed via mockup shell.html |
| React patterns baseline | Server Component default, no `"use client"` in layout | layout.tsx is Server Component — no changes needed |
| Tailwind v4/v3 conventions | `darkMode` string vs tuple type | Used `"class"` string form (tuple requires 2 elements per TS type) |

## Notes

- `--agent-bruno: 38 92% 50%` differs from `--comunify-warning: 45 100% 48%` — intentional per design-inventory.md golden.
- `--radius` stays 0.75rem, `--radius-lg` 1.25rem. Controls use `rounded-full` literal class in kit (not via token).
- No new npm dependencies added (per constraint: do NOT edit package.json).
- `layout.tsx` was already complete from prior session — Plus Jakarta Sans as Satoshi fallback (no `Satoshi-Bold.woff2` in assets).
