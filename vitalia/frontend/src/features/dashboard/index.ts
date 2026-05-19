/**
 * features/dashboard — public barrel export.
 *
 * Per FSD-Lite rules: NO default exports.
 * Arch fitness test checks every feature has this index.ts.
 */

export { DashboardWelcome } from "./components/DashboardWelcome";
export { SliceOneStubsRow } from "./components/SliceOneStubsRow";
export type { DashboardUserData, DashboardWelcomeProps } from "./types/DashboardData";
