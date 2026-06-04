// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
/**
 * features/abel/index.ts — Public API barrel for abel feature module.
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 * Cross-feature imports MUST go through this barrel (not deep imports).
 *
 * T-FE-1: ICP entity layout client (structural base).
 * T-FE-3: IcpMasterListView, IcpCard, IcpWorkspaceView (master + forms).
 * T-FE-4: IcpDatosForm, BuyerLeafForm.
 */

export { IcpEntityLayoutClient } from "./components/icp/IcpEntityLayoutClient";
