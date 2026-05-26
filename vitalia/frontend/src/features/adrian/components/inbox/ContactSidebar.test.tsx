/**
 * ContactSidebar.test.tsx — Vitest unit tests.
 * F1-S10 vitalia-fase1-empty-states — T-5
 *
 * TDD RED-first per tdd-mandatory.md.
 * Tests: PHI masking visible (+51 9** pattern) · 3 action buttons rendered
 *        · masked email visible · 🔓 decorative buttons present
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ContactSidebar } from "./ContactSidebar";
import type { ConversationListItem } from "./types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_CONVERSATION: ConversationListItem = {
  leadId: "lead-001",
  displayName: "María González",
  lastMessagePreview: "Hola",
  lastActivityRelative: "hace 2 min",
  channel: "whatsapp",
  temp: "hot",
  stage: "discovery",
  handlerMode: "bot",
  campaign: { id: "camp-001", name: "Limpieza-PE" },
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ContactSidebar", () => {
  describe("PHI masking visual (F1 scope)", () => {
    it("renders masked phone in +51 9** pattern", () => {
      render(
        <ContactSidebar leadId="lead-001" conversation={MOCK_CONVERSATION} />,
      );
      // Pattern: +51 9** ***-4321 (any masked phone)
      expect(screen.getByText(/\+51 9\*\*/)).toBeInTheDocument();
    });

    it("renders masked email with m*** pattern", () => {
      render(
        <ContactSidebar leadId="lead-001" conversation={MOCK_CONVERSATION} />,
      );
      expect(screen.getByText(/m\*\*\*@gmail\.com/)).toBeInTheDocument();
    });

    it("renders 🔓 decorative unlock buttons (disabled)", () => {
      render(
        <ContactSidebar leadId="lead-001" conversation={MOCK_CONVERSATION} />,
      );
      const unlockBtns = screen.getAllByRole("button", {
        name: /Desbloquear/,
      });
      expect(unlockBtns).toHaveLength(2); // phone + email
      unlockBtns.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });
  });

  describe("3 action buttons", () => {
    it("renders 'Agendar cita' button (disabled F1)", () => {
      render(
        <ContactSidebar leadId="lead-001" conversation={MOCK_CONVERSATION} />,
      );
      const btn = screen.getByRole("button", { name: /Agendar cita/ });
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });

    it("renders 'Ver historial paciente' button (disabled F1)", () => {
      render(
        <ContactSidebar leadId="lead-001" conversation={MOCK_CONVERSATION} />,
      );
      const btn = screen.getByRole("button", {
        name: /Ver historial paciente/,
      });
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });

    it("renders 'Pasar a embudo' button (disabled F1)", () => {
      render(
        <ContactSidebar leadId="lead-001" conversation={MOCK_CONVERSATION} />,
      );
      const btn = screen.getByRole("button", { name: /Pasar a embudo/ });
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });
  });

  describe("section fields", () => {
    it("renders 'Detalles paciente' header label", () => {
      render(
        <ContactSidebar leadId="lead-001" conversation={MOCK_CONVERSATION} />,
      );
      expect(screen.getByText(/Detalles paciente/i)).toBeInTheDocument();
    });

    it("renders patient name", () => {
      render(
        <ContactSidebar leadId="lead-001" conversation={MOCK_CONVERSATION} />,
      );
      expect(screen.getByText("María González")).toBeInTheDocument();
    });

    it("renders CampaignTag when conversation has campaign", () => {
      render(
        <ContactSidebar leadId="lead-001" conversation={MOCK_CONVERSATION} />,
      );
      expect(screen.getByText(/Limpieza-PE/)).toBeInTheDocument();
    });
  });

  describe("null conversation", () => {
    it("renders without crash when conversation is null", () => {
      render(<ContactSidebar leadId="lead-001" conversation={null} />);
      // Should still show static mock patient data
      expect(screen.getByText(/\+51 9\*\*/)).toBeInTheDocument();
    });
  });

  describe("close callback", () => {
    it("calls onClose when ⋯ button is clicked", () => {
      const onClose = vi.fn();
      render(
        <ContactSidebar
          leadId="lead-001"
          conversation={MOCK_CONVERSATION}
          onClose={onClose}
        />,
      );
      // The ⋯ overflow button
      screen.getByRole("button", { name: /Opciones del paciente/ }).click();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
