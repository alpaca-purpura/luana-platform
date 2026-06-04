// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
/**
 * extract.ts — TypeScript types for ICP draft-first extraction job.
 *
 * Mirrors IcpExtractJobResponse DTO (03-arch-fe.md §6).
 * Statuses: analizando → done | failed (no spinner infinito — NF-res-extract).
 *
 * Named exports only (NO default exports) per FSD-Lite enforce.
 */

export type ExtractJobStatus = "analizando" | "done" | "failed";

export type SeedType = "url" | "archivo" | "texto";

export interface IcpExtractJob {
  jobId: string;
  status: ExtractJobStatus;
  /** Set when status=done — the ICP that was created/updated as borrador */
  icpId: string | null;
  /** Error message when status=failed */
  errorMessage: string | null;
}

export interface IcpExtractRequest {
  seedType: SeedType;
  /** URL when seedType=url */
  url?: string | null;
  /** Base64-encoded file content when seedType=archivo */
  fileContent?: string | null;
  fileName?: string | null;
  /** Plain text when seedType=texto */
  text?: string | null;
  /** Optional target ICP to update (if null → creates new ICP) */
  icpId?: string | null;
}
