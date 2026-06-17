# T-0 result — Hygiene (lockfiles + next-env + @luana/* deps)

**Owner:** /dev-team orchestrator (config, directo — no builder spawn). **State:** pushed.

## Done
- DELETE `comunify/frontend/package-lock.json` + `comunify/frontend/pnpm-lock.yaml` (tracked) → root `pnpm-lock.yaml` es SSoT (align vitalia/nicolify: sin lockfile frontend per-brand).
- TRACK `comunify/frontend/next-env.d.ts` (git add — como nicolify/vitalia).
- EDIT `comunify/frontend/package.json` deps:
  - `@luana/ui-kit: workspace:*` + `@luana/design-tokens: workspace:*` (lo que el shell MVP importa directo).
  - leaf deps que el wrapper comunify importa directo: `zustand` (chat-store/shell-store), `lucide-react` (AgentAvatar/ThemeToggle/icons), `next-themes` (ThemeToggle), `class-variance-authority` (_agent-tw-classes).
  - NO declaré `@luana/{api-client,hooks,format,schemas}`: comunify ya tiene `lib/fetch-client.ts` + `lib/use-tenant-id.ts` propios; el kit trae sus deps transitivas (lucide/sonner/react-resizable-panels) en su propio package.json. Si un ticket FE importa @luana/format/hooks → lo agrega ahí.

## Gate (AC-8)
- `pnpm install` (root) → **exit 0** ✓ (warnings de peer react-19-vs-libs son pre-existentes, mismos que nicolify: visx/react-query-devtools/next-themes@0.3.0-del-kit — no bloquean).
- `comunify/frontend/node_modules/@luana/ui-kit` → symlink a `core/@luana/ui-kit` ✓
- `npx tsc --noEmit` (comunify/frontend) → exit 0 ✓

## Validator
- `nf-pnpm-install`: GREEN.

## Files
- `comunify/frontend/package.json` (M), `comunify/frontend/next-env.d.ts` (A), `comunify/frontend/package-lock.json` (D), `comunify/frontend/pnpm-lock.yaml` (D), `pnpm-lock.yaml` (M, root).
