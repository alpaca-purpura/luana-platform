// Leaf hooks (no feature module deps) — exported from @luana/hooks
export * from "./use-debounce";
export * from "./use-intersection-observer";
export * from "./use-is-mounted";
export * from "./use-local-storage";
export * from "./use-viewport";
// SSR-safe Zustand persisted store factory + rehydration hook (lift 2026-05-29 desde vitalia / ADR-vitalia-006)
export * from "./create-ssr-safe-persisted-store";
export * from "./use-store-hydration";
// Module-coupled hooks (require app feature context — @/ resolves via nicolify/frontend tsconfig)
export * from "./use-copilot-offset"; // @/features/copilot resolves in workspace consumer (T-8.bis D2)
// export * from "./use-shell-mutex";      // requires @/components/shared + @/stores — T-12
// export * from "./use-currency-catalog"; // requires @/lib/api — T-12
// Autosave primitive — primitiva de autoguardado compartida (ADR-012, build-autosave-primitive-luana T-1)
export { useAutosave } from "./useAutosave";
export type { AutosaveStatus, UseAutosaveOptions, UseAutosaveReturn } from "./useAutosave";
