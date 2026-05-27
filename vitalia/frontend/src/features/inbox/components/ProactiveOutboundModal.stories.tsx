/**
 * ProactiveOutboundModal.stories.tsx — Storybook stories for the proactive outbound modal.
 *
 * Mocks useProactiveOutbound. Cubre: modal abierto vacío, con template seleccionado,
 * enviando, enviado con éxito, modal cerrado.
 *
 * downstream-regression-na: brand-local story; no cross-brand consumers
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { vi } from "vitest";
import { ProactiveOutboundModal } from "./ProactiveOutboundModal";

// ---------------------------------------------------------------------------
// Module-level mock
// ---------------------------------------------------------------------------

vi.mock("../api/use-proactive-outbound", () => ({
  useProactiveOutbound: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ProactiveOutboundModal> = {
  title: "Features/Inbox/ProactiveOutboundModal",
  component: ProactiveOutboundModal,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "vitalia-surface" },
    layout: "fullscreen",
  },
  args: {
    open: true,
    onClose: fn(),
  },
  argTypes: {
    open: {
      control: "boolean",
      description: "Visibilidad del modal",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ProactiveOutboundModal>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const AbiertoPorDefecto: Story = {
  name: "Modal abierto (sin template seleccionado)",
  beforeEach: async () => {
    const { useProactiveOutbound } =
      await import("../api/use-proactive-outbound");
    (useProactiveOutbound as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: fn(),
      isPending: false,
      isSuccess: false,
    });
  },
};

export const Enviando: Story = {
  name: "Estado: enviando mensaje",
  beforeEach: async () => {
    const { useProactiveOutbound } =
      await import("../api/use-proactive-outbound");
    (useProactiveOutbound as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: fn(),
      isPending: true,
      isSuccess: false,
    });
  },
};

export const Enviado: Story = {
  name: "Éxito: mensaje enviado",
  beforeEach: async () => {
    const { useProactiveOutbound } =
      await import("../api/use-proactive-outbound");
    (useProactiveOutbound as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: fn(),
      isPending: false,
      isSuccess: true,
    });
  },
};

export const Cerrado: Story = {
  name: "Modal cerrado (no renderiza)",
  args: { open: false },
  beforeEach: async () => {
    const { useProactiveOutbound } =
      await import("../api/use-proactive-outbound");
    (useProactiveOutbound as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: fn(),
      isPending: false,
      isSuccess: false,
    });
  },
};
