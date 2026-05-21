/**
 * URL state parsers for marketing feature — nuqs (Next.js App Router)
 * SC-MK-03: tab changes use replace (intra-route, no browser history entry)
 * downstream-regression-na: brand-local FE url-state; no cross-brand consumers
 */

import {
  parseAsString,
  parseAsStringEnum,
  parseAsBoolean,
} from "nuqs";

export const marketingParsers = {
  /** Active bowtie tab. replace=true means no new browser history entry (intra-route) */
  tab: parseAsStringEnum([
    "attraction",
    "qualification",
    "reservation",
    "adoption",
    "expansion",
  ] as const)
    .withDefault("attraction")
    .withOptions({ history: "replace" }),

  /** Time period selector */
  period: parseAsStringEnum(["7d", "30d", "90d"] as const)
    .withDefault("30d")
    .withOptions({ history: "replace" }),

  /** Active channel provider filter (optional) */
  channel: parseAsString.withOptions({ history: "replace" }),

  /** Selected recommendation ID (optional) */
  selectedRecommendation: parseAsString.withOptions({ history: "replace" }),

  /** Approval confirmation modal open state */
  approvalModal: parseAsBoolean.withDefault(false).withOptions({ history: "replace" }),

  /** Channel detail sidebar (provider slug, optional) */
  channelDetailSidebar: parseAsString.withOptions({ history: "replace" }),

  /** Connection wizard (provider slug being connected, optional) */
  connectionWizard: parseAsStringEnum(["meta_ads", "google_ads"] as const).withOptions({
    history: "replace",
  }),
};

export type MarketingTab = (typeof marketingParsers.tab)["defaultValue"];
export type MarketingPeriod = (typeof marketingParsers.period)["defaultValue"];
