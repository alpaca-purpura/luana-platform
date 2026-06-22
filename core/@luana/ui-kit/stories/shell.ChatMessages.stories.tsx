import type { Meta, StoryObj } from "@storybook/nextjs";

import { ChatMessages } from "../src";
import {
  DEMO_AGENTS,
  getDemoAgentClasses,
  useDemoChatStore,
  useDemoChatStoreEmpty,
} from "./_shell-fixtures";

/**
 * Story consumes the REAL ChatMessages from src/. It reads `messages` from the
 * injected chat store and renders each by role: MessageBubble (bot/user),
 * DelegateMarker, TypingIndicator. The wrapper gives it the panel height it needs
 * (flex-1 + overflow-y-auto).
 */
const meta = {
  title: "Shell/Chat/ChatMessages",
  component: ChatMessages,
  args: {
    supervisor: DEMO_AGENTS.valeria,
    agentCatalog: DEMO_AGENTS,
    getAgentClasses: getDemoAgentClasses,
    userBubbleBgClass: "bg-agent-valeria",
  },
  decorators: [
    (Story) => (
      <div className="flex h-[460px] w-[400px] flex-col overflow-hidden rounded-lg border border-border bg-background">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`ChatMessages` es el cuerpo scrolleable del chat: toma `messages` del store y resuelve cada uno por rol — `MessageBubble` (bot/user), `DelegateMarker` (handoff) y `TypingIndicator` (trabajando). Anuncia mensajes nuevos a lectores de pantalla (`role=\"log\"` + `aria-live=\"polite\"`) y auto-scrollea al final. Muestra un estado vacío con el avatar del supervisor cuando no hay mensajes.",
          "",
          "Va como fila central de `ChatPanel`; el padre aporta la altura (este componente es `flex-1` + overflow propio).",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Una sola burbuja aislada** → `MessageBubble` directo.",
          "- **Listado de conversaciones archivadas** (no el hilo activo) → `SupervisorHistory` / `HistoryGroup`.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof ChatMessages>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConMensajes: Story = {
  name: "Con conversación (todos los roles)",
  args: { useChatStore: useDemoChatStore },
  parameters: {
    docs: {
      description: {
        story: "Bot + user + delegación (Valeria→Mateo) + indicador de escritura, los 4 roles que el componente resuelve.",
      },
    },
  },
};

export const Vacio: Story = {
  name: "Estado vacío",
  args: { useChatStore: useDemoChatStoreEmpty },
};
