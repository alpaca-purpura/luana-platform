// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * abel-ui-store.ts — Zustand SSR-safe store for Abel UI state.
 *
 * Manages:
 *   - intakeOverlayOpen: whether the UniversalIntake overlay is visible
 *   - analyzingOverlayVisible: whether the "Abel está leyendo..." overlay is visible
 *   - proposalBannerVisible: whether the ProposalBanner is shown
 *   - intakeMode: last selected intake mode (URL | archivo | texto | conectar)
 *
 * G2 SSR-safe (ADR-nicolify-001 §4 / ADR-vitalia-006):
 * - Uses createSsrSafePersistedStore factory (skipHydration + NO-OP setItem pre-hydration)
 * - Only intakeMode is persisted (user's preference). Overlay/banner state is ephemeral.
 * - useStoreHydration MUST be called from an ssr:false dynamic chunk (IcpMasterListView or
 *   IcpWorkspaceView root client components) — NOT in the skeleton path.
 * - Store MUST NOT be subscribed in any SSR skeleton component (no-store-in-ssr-skeleton gate).
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §4 SSR-safe store (G2)
 * validators_gate: G2 + no-store-in-ssr-skeleton arch test
 */

import {
  createSsrSafePersistedStore,
  type SsrSafeHydration,
} from "@luana/hooks/create-ssr-safe-persisted-store";

// ── Types ─────────────────────────────────────────────────────────────────────

export type IntakeMode = "url" | "archivo" | "texto" | "conectar";

export interface AbelUiState extends SsrSafeHydration {
  /** Whether the UniversalIntake overlay is open */
  intakeOverlayOpen: boolean;
  /** Whether the "Abel está leyendo..." analyzing overlay is shown */
  analyzingOverlayVisible: boolean;
  /** Whether the ProposalBanner is shown (draft proposed by Abel) */
  proposalBannerVisible: boolean;
  /** Last selected intake mode — persisted (user preference) */
  intakeMode: IntakeMode;

  // Setters
  setIntakeOverlayOpen: (open: boolean) => void;
  setAnalyzingOverlayVisible: (visible: boolean) => void;
  setProposalBannerVisible: (visible: boolean) => void;
  setIntakeMode: (mode: IntakeMode) => void;
}

// ── Persisted state shape (excludes setters + _hasHydrated) ──────────────────

type PersistedState = {
  intakeMode: IntakeMode;
};

// ── Store ─────────────────────────────────────────────────────────────────────

/** localStorage key for abel UI preferences */
export const ABEL_UI_STORAGE_KEY = "nicolify-abel-ui-state";

/**
 * useAbelUiStore — Zustand SSR-safe persisted store for Abel UI preferences.
 *
 * Usage in ssr:false client root:
 * ```tsx
 * import { useStoreHydration } from "@luana/hooks/use-store-hydration";
 * import { useAbelUiStore } from "@/features/abel/store/abel-ui-store";
 *
 * export function IcpMasterListView() {
 *   useStoreHydration(useAbelUiStore); // G2: call once in client root
 *   const { intakeOverlayOpen, setIntakeOverlayOpen } = useAbelUiStore();
 *   // ...
 * }
 * ```
 *
 * G2: Skeleton components MUST NOT subscribe to this store.
 */
export const useAbelUiStore = createSsrSafePersistedStore<AbelUiState>(
  (set) => ({
    // ── State ────────────────────────────────────────────────────────────────
    intakeOverlayOpen: false,
    analyzingOverlayVisible: false,
    proposalBannerVisible: false,
    intakeMode: "url",

    // ── SsrSafeHydration ─────────────────────────────────────────────────────
    _hasHydrated: false,
    setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

    // ── Setters ──────────────────────────────────────────────────────────────
    setIntakeOverlayOpen: (open) => set({ intakeOverlayOpen: open }),
    setAnalyzingOverlayVisible: (visible) => set({ analyzingOverlayVisible: visible }),
    setProposalBannerVisible: (visible) => set({ proposalBannerVisible: visible }),
    setIntakeMode: (mode) => set({ intakeMode: mode }),
  }),
  {
    name: ABEL_UI_STORAGE_KEY,
    // Only persist user preferences — overlay/banner states are ephemeral
    partialize: (state): PersistedState => ({
      intakeMode: state.intakeMode,
    }),
  },
);
