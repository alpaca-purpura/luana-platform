/**
 * ConversationItem.test.tsx — Vitest unit tests.
 * F1-S10 vitalia-fase1-empty-states — T-5
 *
 * TDD RED-first per tdd-mandatory.md.
 * Tests: handler_mode='human' renders YouChip + green border · selected renders agent-adrian border
 *        · all temp-dot colors · stage label mapping · campaign tag conditional
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConversationItem } from "./ConversationItem";
import type { ConversationListItem } from "./types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_CONVERSATION: ConversationListItem = {
  leadId: "lead-001",
  displayName: "María González",
  lastMessagePreview: "Hola, vi su anuncio sobre limpieza dental",
  lastActivityRelative: "hace 2 min",
  channel: "whatsapp",
  temp: "hot",
  stage: "discovery",
  handlerMode: "bot",
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ConversationItem", () => {
  describe("basic render", () => {
    it("renders display name and preview", () => {
      render(
        <ConversationItem
          conversation={BASE_CONVERSATION}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText("María González")).toBeInTheDocument();
      expect(screen.getByText(/Hola, vi su anuncio/)).toBeInTheDocument();
    });

    it("renders relative time", () => {
      render(
        <ConversationItem
          conversation={BASE_CONVERSATION}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText("hace 2 min")).toBeInTheDocument();
    });

    it("calls onSelect with leadId when clicked", () => {
      const onSelect = vi.fn();
      render(
        <ConversationItem
          conversation={BASE_CONVERSATION}
          isSelected={false}
          onSelect={onSelect}
        />,
      );
      fireEvent.click(screen.getByRole("button"));
      expect(onSelect).toHaveBeenCalledWith("lead-001");
    });

    it("calls onSelect on Enter key", () => {
      const onSelect = vi.fn();
      render(
        <ConversationItem
          conversation={BASE_CONVERSATION}
          isSelected={false}
          onSelect={onSelect}
        />,
      );
      fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
      expect(onSelect).toHaveBeenCalledWith("lead-001");
    });
  });

  describe("stage label mapping", () => {
    it.each([
      ["rapport", "Nuevo"],
      ["discovery", "Calificando"],
      ["presentation", "Negociando"],
      ["closing", "Cerrando"],
    ] as const)("maps stage '%s' → label '%s'", (stage, expectedLabel) => {
      render(
        <ConversationItem
          conversation={{ ...BASE_CONVERSATION, stage }}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });
  });

  describe("temp dot colors", () => {
    it("hot temp — renders red dot (bg-red-500)", () => {
      const { container } = render(
        <ConversationItem
          conversation={{ ...BASE_CONVERSATION, temp: "hot" }}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      const dot = container.querySelector(".bg-red-500");
      expect(dot).toBeInTheDocument();
    });

    it("warm temp — renders amber dot (bg-amber-500)", () => {
      const { container } = render(
        <ConversationItem
          conversation={{ ...BASE_CONVERSATION, temp: "warm" }}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      const dot = container.querySelector(".bg-amber-500");
      expect(dot).toBeInTheDocument();
    });

    it("cold temp — renders blue dot (bg-blue-500)", () => {
      const { container } = render(
        <ConversationItem
          conversation={{ ...BASE_CONVERSATION, temp: "cold" }}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      const dot = container.querySelector(".bg-blue-500");
      expect(dot).toBeInTheDocument();
    });
  });

  describe("handler_mode='human' — YouChip", () => {
    it("renders YouChip '✋ Tú' when handlerMode='human'", () => {
      render(
        <ConversationItem
          conversation={{ ...BASE_CONVERSATION, handlerMode: "human" }}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText(/✋ Tú/)).toBeInTheDocument();
    });

    it("renders green border class when handlerMode='human' and NOT selected", () => {
      const { container } = render(
        <ConversationItem
          conversation={{ ...BASE_CONVERSATION, handlerMode: "human" }}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      const item = container.firstChild as HTMLElement;
      expect(item.className).toMatch(/border-l-green-500/);
    });

    it("does NOT render YouChip when handlerMode='bot'", () => {
      render(
        <ConversationItem
          conversation={{ ...BASE_CONVERSATION, handlerMode: "bot" }}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.queryByText(/✋ Tú/)).not.toBeInTheDocument();
    });
  });

  describe("selected state", () => {
    it("renders agent-adrian border when selected", () => {
      const { container } = render(
        <ConversationItem
          conversation={BASE_CONVERSATION}
          isSelected={true}
          onSelect={vi.fn()}
        />,
      );
      const item = container.firstChild as HTMLElement;
      expect(item.className).toMatch(/border-l-agent-adrian/);
    });

    it("does NOT render green border when selected (even if human-handled)", () => {
      const { container } = render(
        <ConversationItem
          conversation={{ ...BASE_CONVERSATION, handlerMode: "human" }}
          isSelected={true}
          onSelect={vi.fn()}
        />,
      );
      const item = container.firstChild as HTMLElement;
      // Selected takes priority — no green border
      expect(item.className).not.toMatch(/border-l-green-500/);
      expect(item.className).toMatch(/border-l-agent-adrian/);
    });

    it("has aria-selected=true when selected", () => {
      render(
        <ConversationItem
          conversation={BASE_CONVERSATION}
          isSelected={true}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByRole("button")).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("campaign tag", () => {
    it("renders CampaignTag when campaign is present", () => {
      render(
        <ConversationItem
          conversation={{
            ...BASE_CONVERSATION,
            campaign: { id: "camp-001", name: "Limpieza-PE" },
          }}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText(/Limpieza-PE/)).toBeInTheDocument();
    });

    it("does NOT render CampaignTag when campaign is absent", () => {
      render(
        <ConversationItem
          conversation={{ ...BASE_CONVERSATION, campaign: undefined }}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.queryByRole("button", { name: /Campaña/ })).not.toBeInTheDocument();
    });
  });

  describe("channel abbreviation", () => {
    it.each([
      ["whatsapp", "WA"],
      ["instagram", "IG"],
      ["telegram", "TG"],
    ] as const)("channel '%s' → abbr '%s'", (channel, abbr) => {
      render(
        <ConversationItem
          conversation={{ ...BASE_CONVERSATION, channel }}
          isSelected={false}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByText(abbr)).toBeInTheDocument();
    });
  });
});
