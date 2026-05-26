/**
 * Unit tests — [agent]/[subtab]/page.tsx (Server Component).
 *
 * Vitest + @testing-library/react.
 *
 * SubtabPage valida tanto el agent como el subtab. Si inválido → notFound().
 * Si válido → renderiza placeholder hasta F1-S10.
 *
 * TDD RED-first → GREEN: tests escritos antes de la implementación.
 * spec_anchor: 03-arch-fe.md § 9.6 verbatim + 06-tickets.yaml T-4 SC-3
 * downstream-regression-na: brand-local route; no cross-brand consumers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// vi.mock is hoisted — use vi.fn() inline.
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(),
}));

import * as navigation from "next/navigation";
import SubtabPage from "./page";

const mockNotFound = vi.mocked(navigation.notFound);

const makeParams = (tenantId: string, agent: string, subtab: string) =>
  Promise.resolve({ tenantId, agent, subtab });

describe("SubtabPage", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
  });

  describe("happy path — agent y subtab válidos", () => {
    it("renderiza placeholder para valeria/agenda", async () => {
      render(
        await SubtabPage({ params: makeParams("clinic-x", "valeria", "agenda") }),
      );
      expect(screen.getByText(/Contenido próximamente/)).toBeInTheDocument();
    });

    it("renderiza placeholder para lisa/marca", async () => {
      render(
        await SubtabPage({ params: makeParams("clinic-x", "lisa", "marca") }),
      );
      expect(screen.getByText(/Contenido próximamente/)).toBeInTheDocument();
    });

    it("renderiza placeholder para lucas/lanzar", async () => {
      render(
        await SubtabPage({ params: makeParams("clinic-x", "lucas", "lanzar") }),
      );
      expect(screen.getByText(/Contenido próximamente/)).toBeInTheDocument();
    });

    it("renderiza placeholder para camila/reputacion", async () => {
      render(
        await SubtabPage({
          params: makeParams("clinic-x", "camila", "reputacion"),
        }),
      );
      expect(screen.getByText(/Contenido próximamente/)).toBeInTheDocument();
    });

    it("renderiza placeholder para config/cuenta", async () => {
      render(
        await SubtabPage({
          params: makeParams("clinic-x", "config", "cuenta"),
        }),
      );
      expect(screen.getByText(/Contenido próximamente/)).toBeInTheDocument();
    });

    it("renderiza placeholder para config/avanzado", async () => {
      render(
        await SubtabPage({
          params: makeParams("clinic-x", "config", "avanzado"),
        }),
      );
      expect(screen.getByText(/Contenido próximamente/)).toBeInTheDocument();
    });
  });

  describe("error path — subtab inválido → notFound()", () => {
    it("llama notFound() cuando subtab es inválido para camila (foo)", async () => {
      await expect(
        SubtabPage({ params: makeParams("clinic-x", "camila", "foo") }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it("llama notFound() cuando subtab es inválido para lisa (agenda — de valeria, no lisa)", async () => {
      await expect(
        SubtabPage({ params: makeParams("clinic-x", "lisa", "agenda") }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it("llama notFound() cuando subtab vacío", async () => {
      await expect(
        SubtabPage({ params: makeParams("clinic-x", "valeria", "") }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });
  });

  describe("error path — agent inválido → notFound()", () => {
    it("llama notFound() cuando agent es inválido (mateo — transversal)", async () => {
      await expect(
        SubtabPage({ params: makeParams("clinic-x", "mateo", "ia") }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it("llama notFound() cuando agent es inválido (foo)", async () => {
      await expect(
        SubtabPage({ params: makeParams("clinic-x", "foo", "bar") }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });
  });
});
