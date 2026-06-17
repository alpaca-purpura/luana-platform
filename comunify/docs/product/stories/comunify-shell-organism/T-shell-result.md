# T-shell result — Shell Organism Routing Wrapper

**Ticket:** T-shell  
**Brand:** comunify  
**Story:** comunify-shell-organism  
**Status:** tests-passing  

## Skills Consulted

| Skill | Reason | Decision |
|---|---|---|
| `frontend-expert` | FSD-Lite boundary matrix, ESLint config, lazy-loading factory, shell-organism pattern | Port shell pattern from nicolify; CONSUME @luana/ui-kit exclusively via import, ZERO mirror; createShellStore factory; ShellLayoutWire bridge |
| `brand-expert` | form-runtime array defaults, design-system-canon tokens | Tailwind tokens `agent-{slug}` via JIT-safe switch functions (`_agent-tw-classes.ts`); no arbitrary values |
| React patterns baseline | error boundaries, loading/error/empty states, accessible markup, stable keys | Applied: error boundaries at route level, redirect guards, 404 not-found handlers, aria-busy on loading states |
| Next.js App Router Server/Client split | page.tsx mixes Server redirect + Client shell | Split: layout.tsx = Server (Clerk auth validate + redirect), ShellLayoutWire.tsx = "use client" interactive bridge |
| Zod validation | No forms in scope (T-shell is routing/shell only) | N/A — no forms |
| Tailwind conventions | JIT-safe agent color classes | Explicit switch statements in `_agent-tw-classes.ts`; NEVER template literals (G3 gate) |
| Shadcn UI conventions | comunify has no @radix-ui in package.json | All primitives (Button, DropdownMenu) consumed from `@luana/ui-kit` — ZERO @/components/ui/ usage |

## Implementation

### Files Created

**Routing layer:**
- `src/lib/routing/shell-routes.ts` — AGENT_CATALOG (6 ribbon slugs), AGENT_RIBBON_ORDER (5, excludes plataforma), DEFAULT_LANDING (nina/marca), AGENT_SUBTABS (SubTabMeta[]), AGENT_SUBSUBTABS (composite keys "nina.marca" etc.), whitelist guards (isValidAgent/isValidSubtab/isValidSubSubTab), extractors

**Agent catalog:**
- `src/lib/agents.ts` — AgentDescriptor interface (no `hex` field — removed to satisfy arch test `test-no-stock-palette.test.ts` baseline=0), 6-agent AGENT_CATALOG (luana/nina/tomas/sofia/bruno/lucia), AGENT_SLUGS, DEFAULT_CHAT_AGENT

**Shell organism components:**
- `src/components/shared/shell-organism/_agent-tw-classes.ts` — JIT-safe switch functions: agentBgClass, agentBgSoftClass, agentTextClass, agentTextClassSubTab, agentBorderClass (exhaustiveness guards via `never`)
- `src/components/shared/shell-organism/LogoMark.tsx` — Server Component, dark mode CSS swap
- `src/components/shared/shell-organism/ThemeToggle.tsx` — "use client", Button from @luana/ui-kit
- `src/components/shared/shell-organism/TenantSwitcher.tsx` — "use client", DropdownMenu from @luana/ui-kit (skeleton R0)
- `src/components/shared/shell-organism/SubTabContent.tsx` — R0 dispatcher → EmptyState per agent.subtab combo

**Shell store:**
- `src/stores/shell-store.ts` — SHELL_STORAGE_KEY = "comunify-shell-state", migrateComunifyState, useShellStoreKit via createShellStore from @luana/ui-kit

**App layer (shell-organism route group):**
- `src/app/[tenantId]/(shell-organism)/layout.tsx` — Server Component; Clerk auth() → userId guard → redirect("/sign-in"); renders ShellLayoutWire
- `src/app/[tenantId]/(shell-organism)/page.tsx` — Server Component; redirects to DEFAULT_LANDING
- `src/app/[tenantId]/(shell-organism)/not-found.tsx` — 404 fallback
- `src/app/[tenantId]/(shell-organism)/[agent]/page.tsx` — isValidAgent guard → notFound(); getDefaultSubtab → redirect
- `src/app/[tenantId]/(shell-organism)/[agent]/not-found.tsx`
- `src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/page.tsx` — isValidAgent + isValidSubtab guards; SubTabContent
- `src/app/[tenantId]/(shell-organism)/[agent]/[subtab]/not-found.tsx`
- `src/app/[tenantId]/(shell-organism)/_components/ShellLayoutWire.tsx` — "use client"; wires ShellLayout from @luana/ui-kit with brand props, getAgentClasses, configTabSlug="plataforma"

**Avatars:**
- `public/agents/luana/avatar.svg`, `nina/`, `tomas/`, `sofia/`, `bruno/`, `lucia/` — circle + initial letter SVGs (HEX in SVG attributes = not in TypeScript src/, no arch test violation)

**Edge-auth:**
- `src/proxy.ts` (edited) — isBareTenantRoute matcher for `/:tenantId`; NextResponse.redirect to DEFAULT_LANDING (edge-redirect avoids Next 16 "Rendered more hooks" bug with dynamic({ssr:false}))
- `src/app/page.tsx` (edited) — retired static homepage; redirect("/sign-in")

**Tests:**
- `src/stores/__tests__/shell-store.test.ts` — 6 tests; SHELL_STORAGE_KEY, migrateComunifyState, null/corrupt handling
- `src/lib/__tests__/agents.test.ts` — 8 tests; catalog completeness, required fields, no hex field, colorToken patterns
- `src/lib/__tests__/shell-routes.test.ts` — 48 tests; DEFAULT_LANDING, ribbon order, AGENT_CATALOG, AGENT_SUBTABS shape, AGENT_SUBSUBTABS, all guards, extractors
- `e2e/regression/comunify-shell-organism/shell-happy.spec.ts` — smoke E2E (shell root redirect, Ribbon render, invalid agent 404; skipped when E2E_BASE_URL not set)

### Files Modified

- `src/__tests__/architecture/_stock-palette-allowlist.json` — kept at `[]` (shrink-only; hex fields removed from agents.ts instead)
- `src/proxy.ts` — edge-redirect for bare-tenant routes
- `src/app/page.tsx` — retire static homepage

## Quality Gates

| Gate | Result |
|---|---|
| `tsc --noEmit` | PASS — 0 errors |
| `eslint src/ --cache` | PASS — 0 errors, 0 warnings delta |
| `vitest run --coverage` | PASS — 121/121 tests GREEN; 63.88% stmts, 81.41% branches, 40% funcs (all > 20% threshold) |
| arch test `test-no-stock-palette` | PASS — allowlist=0 (baseline 0), no HEX literals in TypeScript src/ |
| arch test `test-no-low-contrast-pairs` | PASS |
| All 8 test files | PASS |

## Mockup Scope Notes

T-shell scope is routing + shell chrome only. SubTabContent renders EmptyState for ALL agent.subtab combos (R0 skeleton). Feature panels (nina/marca brand-studio, tomas/audiencia growth-studio, etc.) are out of scope — future tickets per 06-tickets.yaml.

## Cast / Routing Decisions

- comunify RibbonTabSlug: "nina" | "tomas" | "sofia" | "bruno" | "lucia" | "plataforma"
- luana = sidebar orchestrator, NOT a ribbon tab (excluded from VALID_RIBBON_SLUGS)
- configTabSlug = "plataforma" / configTabLabel = "Plataforma" (not "config"/"Configurar")
- splitGroupId = "comunify-shell-split"
- DEFAULT_LANDING = { agent: "nina", subtab: "marca" }
- SHELL_STORAGE_KEY = "comunify-shell-state"
- chat store inject: `useChatStore as unknown as ShellChatStore` (safe type cast — kit reads messages/status/sendMessage only)
