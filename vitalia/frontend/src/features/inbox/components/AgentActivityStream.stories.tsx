// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
/**
 * AgentActivityStream.stories.tsx — Storybook stories for the sticky activity stream bar.
 *
 * Mocks useInboxStore + useActivityStream so stories render sin API.
 * Cubre: colapsado, expandido con eventos, expandido vacío, cargando.
 *
 * downstream-regression-na: brand-local story; no cross-brand consumers
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
import { vi } from "vitest";
import { AgentActivityStream } from "./AgentActivityStream";
import type { ActivityEvent } from "../types/activity-event";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_EVENTS: ActivityEvent[] = [
  {
    id: "evt-1",
    conversation_id: "conv-abc-123",
    kind: "turn_start",
    summary: "Adrián inicia respuesta",
    payload_redacted: null,
    occurred_at: "2026-05-20T14:32:00.000Z",
  },
  {
    id: "evt-2",
    conversation_id: "conv-abc-123",
    kind: "tool_call",
    summary: "schedule_appointment → éxito",
    payload_redacted: null,
    occurred_at: "2026-05-20T14:32:05.000Z",
  },
  {
    id: "evt-3",
    conversation_id: "conv-abc-123",
    kind: "message_sent",
    summary: "Mensaje enviado al paciente por WhatsApp",
    payload_redacted: null,
    occurred_at: "2026-05-20T14:32:10.000Z",
  },
  {
    id: "evt-4",
    conversation_id: "conv-abc-123",
    kind: "turn_end",
    summary: "Turno completado sin errores",
    payload_redacted: null,
    occurred_at: "2026-05-20T14:32:12.000Z",
  },
  {
    id: "evt-5",
    conversation_id: "conv-abc-123",
    kind: "proposal_generated",
    summary: "Propuesta generada para revisión del operador",
    payload_redacted: null,
    occurred_at: "2026-05-20T14:33:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------

vi.mock("../store/inbox-store", () => ({
  useInboxStore: vi.fn(),
}));

vi.mock("../api/use-activity-stream", () => ({
  useActivityStream: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof AgentActivityStream> = {
  title: "Features/Inbox/AgentActivityStream",
  component: AgentActivityStream,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "vitalia-bg" },
    layout: "padded",
  },
  args: {
    conversationId: "conv-abc-123",
  },
};

export default meta;
type Story = StoryObj<typeof AgentActivityStream>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

type InboxStoreMock = ReturnType<typeof vi.fn>;
type ActivityStreamMock = ReturnType<typeof vi.fn>;

export const Colapsado: Story = {
  name: "Colapsado (barra de 32px)",
  beforeEach: async () => {
    const { useInboxStore } = await import("../store/inbox-store");
    const { useActivityStream } = await import("../api/use-activity-stream");

    (useInboxStore as unknown as InboxStoreMock).mockImplementation(
      (
        selector: (s: {
          expandedActivityStream: boolean;
          toggleActivityStream: () => void;
        }) => unknown,
      ) =>
        selector({
          expandedActivityStream: false,
          toggleActivityStream: vi.fn(),
        }),
    );
    (useActivityStream as unknown as ActivityStreamMock).mockReturnValue({
      data: { events: [], total: 0 },
      isLoading: false,
    });
  },
};

export const ExpandidoConEventos: Story = {
  name: "Expandido con eventos",
  beforeEach: async () => {
    const { useInboxStore } = await import("../store/inbox-store");
    const { useActivityStream } = await import("../api/use-activity-stream");

    (useInboxStore as unknown as InboxStoreMock).mockImplementation(
      (
        selector: (s: {
          expandedActivityStream: boolean;
          toggleActivityStream: () => void;
        }) => unknown,
      ) =>
        selector({
          expandedActivityStream: true,
          toggleActivityStream: vi.fn(),
        }),
    );
    (useActivityStream as unknown as ActivityStreamMock).mockReturnValue({
      data: { events: MOCK_EVENTS, total: MOCK_EVENTS.length },
      isLoading: false,
    });
  },
};

export const ExpandidoVacio: Story = {
  name: "Expandido sin eventos",
  beforeEach: async () => {
    const { useInboxStore } = await import("../store/inbox-store");
    const { useActivityStream } = await import("../api/use-activity-stream");

    (useInboxStore as unknown as InboxStoreMock).mockImplementation(
      (
        selector: (s: {
          expandedActivityStream: boolean;
          toggleActivityStream: () => void;
        }) => unknown,
      ) =>
        selector({
          expandedActivityStream: true,
          toggleActivityStream: vi.fn(),
        }),
    );
    (useActivityStream as unknown as ActivityStreamMock).mockReturnValue({
      data: { events: [], total: 0 },
      isLoading: false,
    });
  },
};

export const Cargando: Story = {
  name: "Expandido: cargando eventos",
  beforeEach: async () => {
    const { useInboxStore } = await import("../store/inbox-store");
    const { useActivityStream } = await import("../api/use-activity-stream");

    (useInboxStore as unknown as InboxStoreMock).mockImplementation(
      (
        selector: (s: {
          expandedActivityStream: boolean;
          toggleActivityStream: () => void;
        }) => unknown,
      ) =>
        selector({
          expandedActivityStream: true,
          toggleActivityStream: vi.fn(),
        }),
    );
    (useActivityStream as unknown as ActivityStreamMock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });
  },
};
