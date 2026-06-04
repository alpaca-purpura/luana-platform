// cap: abel.icp-buyer
/**
 * extract-api.test.ts — FE↔BE CONTRACT guard for the draft-first extractor.
 *
 * Origin: live-verify 2026-06-04 caught a 422 on the modal submit because the FE
 * sent its camelCase + Spanish shape ({seedType:"texto", text:...}) raw, but the
 * BE DTO wants snake_case + English ({seed_type:"text", payload:...}); and the BE
 * job response ({job_id, icp_id}) was not mapped back to the FE ({jobId, icpId})
 * → icpId undefined → no navigation. fetchClient does NO camel↔snake conversion.
 *
 * This test asserts BOTH directions of the mapping so the contract can't silently
 * drift again (HB-42: contract-test FE↔BE). It mocks fetchClient at the wire layer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

import { extractApi } from "./extract-api";

const mockFetchClient = vi.fn();
vi.mock("@/lib/api/fetch-client", () => ({
  fetchClient: (...args: unknown[]) => mockFetchClient(...args),
}));

const opts = { token: "t", tenantId: "7f464ab7-137b-5e3a-af13-3020aa18814a" };

beforeEach(() => mockFetchClient.mockReset());

describe("extractApi.startExtraction — request maps FE→BE wire shape", () => {
  it("texto → seed_type:text + payload (NOT seedType:texto/text)", async () => {
    mockFetchClient.mockResolvedValueOnce({ job_id: "j1", status: "analizando", icp_id: null });
    await extractApi.startExtraction(opts, { seedType: "texto", text: "  agencias B2B  " });
    const [, init] = mockFetchClient.mock.calls[0];
    const body = JSON.parse((init as { body: string }).body);
    expect(body).toEqual({ seed_type: "text", payload: "agencias B2B", file_ref: null });
  });

  it("url → seed_type:url + payload", async () => {
    mockFetchClient.mockResolvedValueOnce({ job_id: "j2", status: "analizando", icp_id: null });
    await extractApi.startExtraction(opts, { seedType: "url", url: "https://x.com" });
    const body = JSON.parse((mockFetchClient.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ seed_type: "url", payload: "https://x.com", file_ref: null });
  });

  it("archivo → seed_type:file + file_ref", async () => {
    mockFetchClient.mockResolvedValueOnce({ job_id: "j3", status: "analizando", icp_id: null });
    await extractApi.startExtraction(opts, { seedType: "archivo", fileName: "icp.pdf" });
    const body = JSON.parse((mockFetchClient.mock.calls[0][1] as { body: string }).body);
    expect(body).toEqual({ seed_type: "file", payload: null, file_ref: "icp.pdf" });
  });
});

describe("extractApi — response maps BE→FE (job_id→jobId, icp_id→icpId)", () => {
  it("done → icpId set for navigation (the bug: icp_id was dropped)", async () => {
    mockFetchClient.mockResolvedValueOnce({ job_id: "j9", status: "done", icp_id: "icp-xyz" });
    const job = await extractApi.startExtraction(opts, { seedType: "texto", text: "x" });
    expect(job).toEqual({ jobId: "j9", status: "done", icpId: "icp-xyz", errorMessage: null });
  });

  it("poll failed → errorMessage surfaced", async () => {
    mockFetchClient.mockResolvedValueOnce({
      job_id: "j10",
      status: "failed",
      error_message: "no se pudo leer",
    });
    const job = await extractApi.pollExtraction(opts, "j10");
    expect(job).toEqual({
      jobId: "j10",
      status: "failed",
      icpId: null,
      errorMessage: "no se pudo leer",
    });
  });
});
