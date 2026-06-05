// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
/**
 * features/abel/index.ts — Public API barrel for abel feature module.
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * Cross-feature imports MUST go through this barrel (not deep imports).
 *
 * T-FE-1: ICP entity layout client (structural base).
 * T-FE-2: Extract API + hook, abel-ui-store, types.
 * T-FE-3: IcpMasterListView, IcpCard, IcpWorkspaceView (master + forms).
 * T-FE-4: IcpDatosForm, BuyerLeafForm.
 */

// ── T-FE-1 ────────────────────────────────────────────────────────────────────
export { IcpEntityLayoutClient } from "./components/icp/IcpEntityLayoutClient";

// ── T-FE-2: Types ─────────────────────────────────────────────────────────────
export type {
  Icp,
  IcpListItem,
  IcpCreatePayload,
  IcpPatchPayload,
  IcpStatus,
  IcpOrigin,
} from "./types/icp";
export type { Buyer, BuyerListItem, DecisionPower } from "./types/buyer";
export type { IcpExtractJob, IcpExtractRequest, ExtractJobStatus, SeedType } from "./types/extract";

// ── T-FE-2: Extract API ───────────────────────────────────────────────────────
export { extractApi } from "./api/extract-api";

// ── T-FE-2: Extract hook ──────────────────────────────────────────────────────
export { useIcpExtract, extractQueryKeys } from "./hooks/use-icp-extract";
export type { UseIcpExtractReturn } from "./hooks/use-icp-extract";

// ── T-FE-2: Abel UI store ─────────────────────────────────────────────────────
export { useAbelUiStore, ABEL_UI_STORAGE_KEY } from "./store/abel-ui-store";
export type { IntakeMode } from "./store/abel-ui-store";

// ── T-FE-3: ICP API ───────────────────────────────────────────────────────────
export { icpApi } from "./api/icp-api";
export type { IcpApiOptions } from "./api/icp-api";

// ── T-FE-3: Buyer API ─────────────────────────────────────────────────────────
export { buyerApi } from "./api/buyer-api";
export type { BuyerApiOptions, BuyerCreatePayload, BuyerPatchPayload } from "./api/buyer-api";

// ── T-FE-3: ICP hooks ─────────────────────────────────────────────────────────
export { useIcps, useIcp, icpQueryKeys } from "./hooks/use-icps";
export { useBuyers, useBuyer, buyerQueryKeys } from "./hooks/use-buyers";
export {
  useCreateIcp,
  usePatchIcp,
  useMarkReadyIcp,
  useDeleteIcp,
} from "./hooks/use-icp-mutations";
export {
  useCreateBuyer,
  usePatchBuyer,
  useSetPrimaryBuyer,
  useDeleteBuyer,
} from "./hooks/use-buyer-mutations";

// ── T-FE-3: Zod schemas ───────────────────────────────────────────────────────
export { icpFormSchema, buyerFormSchema, icpCreateSchema } from "./types/icp-schema";
export type { IcpFormValues, BuyerFormValues, IcpCreateFormValues } from "./types/icp-schema";

// ── T-FE-3: Components ────────────────────────────────────────────────────────
export { IcpCard } from "./components/icp/IcpCard";
export { IcpMasterListView } from "./components/icp/IcpMasterListView";
// T-FE-FIX-intake: overlay wiring (Bug A fix — orphan integration)
export { IcpIntakeOverlay } from "./components/icp/IcpIntakeOverlay";

// ── T-FE-4: Detail forms ──────────────────────────────────────────────────────
export { IcpWorkspaceView } from "./components/icp/IcpWorkspaceView";
export { IcpDatosForm } from "./components/icp/IcpDatosForm";
export { BuyerLeafForm } from "./components/icp/BuyerLeafForm";
