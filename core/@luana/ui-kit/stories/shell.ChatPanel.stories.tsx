import type { Meta, StoryObj } from "@storybook/nextjs";

import { ChatPanel } from "../src";
import {
  DEMO_AGENTS,
  getDemoAgentClasses,
  useDemoShellStore,
  useDemoChatStore,
  useDemoChatStoreEmpty,
} from "./_shell-fixtures";

/**
 * Story consumes the REAL ChatPanel from src/ — the composite chat organism
 * (ChatHeader + ChatMessages + ChatComposer in a 3-row grid). The wrapper gives
 * it the supervisor-panel height; ChatPanel fills it (h-full).
 */
const meta = {
  title: "Shell/Chat/ChatPanel",
  component: ChatPanel,
  args: {
    supervisor: DEMO_AGENTS.valeria,
    agentCatalog: DEMO_AGENTS,
    useShellStore: useDemoShellStore,
    getAgentClasses: getDemoAgentClasses,
    userBubbleBgClass: "bg-agent-valeria",
    statusDotClass: "bg-emerald-500",
  },
  decorators: [
    (Story) => (
      <div className="h-[600px] w-[400px] overflow-hidden rounded-xl border border-border shadow-sm">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`ChatPanel` es el **organismo de chat completo** (ex-ValeriaChat): compone `ChatHeader` + `ChatMessages` + `ChatComposer` en una grilla de 3 filas. Es lo que vive en el panel del supervisor del shell — la cara conversacional de Valeria (o de un especialista). La marca le inyecta el catálogo de agentes + los stores; el kit no conoce ningún nombre de marca.",
          "",
          "Úsalo cuando necesites el chat entero. El padre debe darle altura (`h-full` o altura fija); el panel se encarga del layout interno (header fijo arriba, mensajes scrolleables al medio, composer fijo abajo).",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Solo una parte** (cabecera, lista o composer) → usa el sub-componente (`ChatHeader` / `ChatMessages` / `ChatComposer`).",
          "- **El shell completo** (ribbon + sub-tabs + panel de app + este chat) → `ShellLayout`, que monta `ChatPanel` dentro del lado del supervisor.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConConversacion: Story = {
  name: "Con conversación",
  args: { useChatStore: useDemoChatStore },
};

export const Vacio: Story = {
  name: "Conversación nueva (vacío)",
  args: { useChatStore: useDemoChatStoreEmpty },
};
