// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
/**
 * AdrianToolsSheet.stories.tsx — Storybook stories for the Adrián tools panel.
 *
 * Mocks useToolsState so stories render without API calls.
 * Cubre: panel abierto con herramientas, cargando, vacío, panel cerrado.
 *
 * downstream-regression-na: brand-local story; no cross-brand consumers
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { vi } from "vitest";
import { AdrianToolsSheet } from "./AdrianToolsSheet";
import type { ToolInvocation } from "../types/tools-state";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_INVOCATIONS: ToolInvocation[] = [
  {
    tool_name: "schedule_appointment",
    status: "success",
    result_summary: "Turno agendado para el 15 de junio a las 10:00 hs.",
    invoked_at: "2026-05-20T14:32:00.000Z",
  },
  {
    tool_name: "send_follow_up_message",
    status: "success",
    result_summary: "Mensaje de seguimiento enviado correctamente.",
    invoked_at: "2026-05-20T14:35:10.000Z",
  },
  {
    tool_name: "check_availability",
    status: "error",
    result_summary: "Error al consultar disponibilidad. Reintentando.",
    invoked_at: "2026-05-20T14:30:05.000Z",
  },
  {
    tool_name: "send_payment_link",
    status: "skipped",
    result_summary: null,
    invoked_at: "2026-05-20T14:28:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Module-level mock
// ---------------------------------------------------------------------------

vi.mock("../api/use-tools-state", () => ({
  useToolsState: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof AdrianToolsSheet> = {
  title: "Features/Inbox/AdrianToolsSheet",
  component: AdrianToolsSheet,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "vitalia-surface" },
    layout: "fullscreen",
  },
  args: {
    open: true,
    onClose: fn(),
    conversationId: "conv-abc-123",
  },
  argTypes: {
    open: {
      control: "boolean",
      description: "Visibilidad del panel lateral",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AdrianToolsSheet>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const ConHerramientas: Story = {
  name: "Panel abierto con herramientas",
  beforeEach: async () => {
    const { useToolsState } = await import("../api/use-tools-state");
    (useToolsState as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { invocations: MOCK_INVOCATIONS },
      isLoading: false,
      isError: false,
    });
  },
};

export const Cargando: Story = {
  name: "Estado: cargando herramientas",
  beforeEach: async () => {
    const { useToolsState } = await import("../api/use-tools-state");
    (useToolsState as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
  },
};

export const SinHerramientas: Story = {
  name: "Estado: sin herramientas",
  beforeEach: async () => {
    const { useToolsState } = await import("../api/use-tools-state");
    (useToolsState as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { invocations: [] },
      isLoading: false,
      isError: false,
    });
  },
};

export const PanelCerrado: Story = {
  name: "Panel cerrado (no renderiza)",
  args: { open: false },
  beforeEach: async () => {
    const { useToolsState } = await import("../api/use-tools-state");
    (useToolsState as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { invocations: MOCK_INVOCATIONS },
      isLoading: false,
      isError: false,
    });
  },
};
