/**
 * ActionReceiptUndoChip.stories.tsx — Storybook stories for the AI message undo chip.
 *
 * Mocks useActionReceiptTimer + useRetractMessage para evitar API real.
 * Cubre: chip visible (SC-01), estado revirtiendo, chip expirado (oculto).
 *
 * downstream-regression-na: brand-local story; no cross-brand consumers
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { vi } from "vitest";
import { ActionReceiptUndoChip } from "./ActionReceiptUndoChip";

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

vi.mock("../hooks/use-action-receipt-timer", () => ({
  useActionReceiptTimer: vi.fn(),
}));

vi.mock("../api/use-retract-message", () => ({
  useRetractMessage: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ActionReceiptUndoChip> = {
  title: "Features/Inbox/ActionReceiptUndoChip",
  component: ActionReceiptUndoChip,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "vitalia-bg" },
    layout: "padded",
  },
  args: {
    messageId: "msg-001",
    conversationId: "conv-abc-123",
    expiresAt: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
    conversationUpdatedAt: new Date().toISOString(),
  },
};

export default meta;
type Story = StoryObj<typeof ActionReceiptUndoChip>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const ChipVisible: Story = {
  name: "SC-01: Chip visible (4:58 restantes)",
  beforeEach: async () => {
    const { useActionReceiptTimer } =
      await import("../hooks/use-action-receipt-timer");
    const { useRetractMessage } = await import("../api/use-retract-message");

    (useActionReceiptTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      isExpired: false,
      formattedRemaining: "4:58",
    });
    (useRetractMessage as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    });
  },
};

export const Revirtiendo: Story = {
  name: "Estado: revirtiendo mensaje",
  beforeEach: async () => {
    const { useActionReceiptTimer } =
      await import("../hooks/use-action-receipt-timer");
    const { useRetractMessage } = await import("../api/use-retract-message");

    (useActionReceiptTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      isExpired: false,
      formattedRemaining: "4:45",
    });
    (useRetractMessage as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: fn(),
      isPending: true,
      isSuccess: false,
      isError: false,
    });
  },
};

export const Expirado: Story = {
  name: "Chip expirado (no renderiza)",
  beforeEach: async () => {
    const { useActionReceiptTimer } =
      await import("../hooks/use-action-receipt-timer");
    const { useRetractMessage } = await import("../api/use-retract-message");

    (useActionReceiptTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      isExpired: true,
      formattedRemaining: "0:00",
    });
    (useRetractMessage as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    });
  },
};

export const UltimoSegundo: Story = {
  name: "Último segundo (0:01)",
  beforeEach: async () => {
    const { useActionReceiptTimer } =
      await import("../hooks/use-action-receipt-timer");
    const { useRetractMessage } = await import("../api/use-retract-message");

    (useActionReceiptTimer as ReturnType<typeof vi.fn>).mockReturnValue({
      isExpired: false,
      formattedRemaining: "0:01",
    });
    (useRetractMessage as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    });
  },
};
