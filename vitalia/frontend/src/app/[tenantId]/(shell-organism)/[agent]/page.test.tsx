/**
 * Unit tests — [agent]/page.tsx (Server Component).
 *
 * Vitest + @testing-library/react.
 *
 * AgentRootPage redirige al defaultSubtab del agente seleccionado.
 * Llama notFound() si agent slug inválido (defense-in-depth).
 *
 * TDD RED-first → GREEN: tests escritos antes de la implementación.
 * spec_anchor: 03-arch-fe.md § 9.5 verbatim + 06-tickets.yaml T-4
 * downstream-regression-na: brand-local route; no cross-brand consumers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted — use vi.fn() inline.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import * as navigation from "next/navigation";
import AgentRootPage from "./page";

const mockRedirect = vi.mocked(navigation.redirect);
const mockNotFound = vi.mocked(navigation.notFound);

const makeParams = (tenantId: string, agent: string) =>
  Promise.resolve({ tenantId, agent });

describe("AgentRootPage", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
    mockNotFound.mockClear();
  });

  it("redirige a /tenantId/valeria/agenda cuando agent=valeria", async () => {
    await expect(
      AgentRootPage({ params: makeParams("clinic-x", "valeria") }),
    ).rejects.toThrow("NEXT_REDIRECT:/clinic-x/valeria/agenda");
    expect(mockRedirect).toHaveBeenCalledWith("/clinic-x/valeria/agenda");
  });

  it("redirige a /tenantId/lisa/marca cuando agent=lisa", async () => {
    await expect(
      AgentRootPage({ params: makeParams("clinic-x", "lisa") }),
    ).rejects.toThrow("NEXT_REDIRECT:/clinic-x/lisa/marca");
    expect(mockRedirect).toHaveBeenCalledWith("/clinic-x/lisa/marca");
  });

  it("redirige a /tenantId/lucas/lanzar cuando agent=lucas", async () => {
    await expect(
      AgentRootPage({ params: makeParams("clinic-x", "lucas") }),
    ).rejects.toThrow("NEXT_REDIRECT:/clinic-x/lucas/lanzar");
    expect(mockRedirect).toHaveBeenCalledWith("/clinic-x/lucas/lanzar");
  });

  it("redirige a /tenantId/adrian/inbox cuando agent=adrian", async () => {
    await expect(
      AgentRootPage({ params: makeParams("clinic-x", "adrian") }),
    ).rejects.toThrow("NEXT_REDIRECT:/clinic-x/adrian/inbox");
    expect(mockRedirect).toHaveBeenCalledWith("/clinic-x/adrian/inbox");
  });

  it("redirige a /tenantId/camila/voz cuando agent=camila", async () => {
    await expect(
      AgentRootPage({ params: makeParams("clinic-x", "camila") }),
    ).rejects.toThrow("NEXT_REDIRECT:/clinic-x/camila/voz");
    expect(mockRedirect).toHaveBeenCalledWith("/clinic-x/camila/voz");
  });

  it("redirige a /tenantId/config/cuenta cuando agent=config", async () => {
    // 'config' no está en AGENT_CATALOG pero defaultSubtab = 'cuenta'
    await expect(
      AgentRootPage({ params: makeParams("clinic-x", "config") }),
    ).rejects.toThrow("NEXT_REDIRECT:/clinic-x/config/cuenta");
    expect(mockRedirect).toHaveBeenCalledWith("/clinic-x/config/cuenta");
  });

  it("llama notFound() cuando agent slug es inválido (foo)", async () => {
    await expect(
      AgentRootPage({ params: makeParams("clinic-x", "foo") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("llama notFound() cuando agent='mateo' (transversal — excluido)", async () => {
    await expect(
      AgentRootPage({ params: makeParams("clinic-x", "mateo") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
