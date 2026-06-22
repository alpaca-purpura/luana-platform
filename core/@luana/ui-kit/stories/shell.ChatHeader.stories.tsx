import type { Meta, StoryObj } from "@storybook/nextjs";

import { ChatHeader } from "../src";
import {
  DEMO_AGENTS,
  getDemoAgentClasses,
  useDemoShellStore,
  useDemoChatStore,
} from "./_shell-fixtures";

/**
 * Story consumes the REAL ChatHeader from src/. It reads injected stores
 * (shell: history/collapse · chat: newConversation). The mode pill uses a
 * container query (@[24rem]) → the wrapper is @container ≥ 24rem so it shows.
 */
const meta = {
  title: "Shell/Chat/ChatHeader",
  component: ChatHeader,
  args: {
    useShellStore: useDemoShellStore,
    useChatStore: useDemoChatStore,
    getAgentClasses: getDemoAgentClasses,
  },
  decorators: [
    (Story) => (
      <div className="@container w-[400px] rounded-lg border border-border bg-background">
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
          "`ChatHeader` es la cabecera del panel de chat del supervisor/especialista: avatar con color del agente + punto de estado, nombre y rol, **píldora de modo** (🤖 agente / 🌐 web) y los controles del hilo — nueva conversación, mostrar/ocultar historial, colapsar el supervisor.",
          "",
          "Va siempre como fila superior de `ChatPanel` (no se monta suelto en producción). La píldora de modo aparece por **container query** (ancho del panel ≥ 24rem), no por viewport — se oculta sola cuando el panel se angosta.",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Cabecera de una hoja de contenido** (no chat) → `PageHeader`.",
          "- **No** la montes fuera de un contenedor con altura/ancho del panel: depende del `@container` para la píldora.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof ChatHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ModoAgente: Story = {
  name: "Modo agente (Valeria, en línea)",
  args: { agent: DEMO_AGENTS.valeria, status: "online", mode: "agent" },
};

export const ModoWeb: Story = {
  name: "Modo web",
  args: { agent: DEMO_AGENTS.valeria, status: "online", mode: "web" },
};

export const Especialista: Story = {
  name: "Especialista (Lisa)",
  args: { agent: DEMO_AGENTS.lisa, status: "online", mode: "agent" },
};
