# @luana/hooks — CHANGELOG

## 0.2.0 — 2026-05-29

### Added
- **`createSsrSafePersistedStore`** — factory for SSR-safe Zustand 5 persisted stores under Next.js App Router.
  Wraps `persist` with `skipHydration:true` + a storage wrapper whose `setItem` is a NO-OP until `_hasHydrated`
  (neutralizes the spurious default-write during SSR/skeleton/pre-hydration that clobbers localStorage on reload)
  + `onRehydrateStorage` flag flip. Exports `SsrSafeHydration` interface.
- **`useStoreHydration(store)`** — idempotent client-side rehydration hook (StrictMode-safe via ref guard).
- Subpath exports `@luana/hooks/create-ssr-safe-persisted-store` + `@luana/hooks/use-store-hydration`
  (leaf imports that bypass the feature-coupled barrel — required by consumers without `@/features/copilot`).
- `peerDependencies.zustand >=5`.

### Origin
Lift desde `vitalia/frontend/src/lib/store/` (story `vitalia-shell-state-persistence` / `ADR-vitalia-006`,
promotion `docs/promotion-protocol/proposals/2026-05-29-lift-ssr-safe-persisted-store.md`). vitalia consume
ahora vía subpath. nicolify (`dismiss-store`) es consumer candidate (opt-in via `/pm-nicolify`).

### Consumers
- `@luana/vitalia-web` — 4 persisted stores (shell, tenant, agenda, agenda-filters) + shell layout client.
