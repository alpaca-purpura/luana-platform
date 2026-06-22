import type { Meta, StoryObj } from "@storybook/nextjs";

import { MessageBubble } from "../src";
import { DEMO_AGENTS } from "./_shell-fixtures";

/**
 * Story consumes the REAL MessageBubble from src/. Pure-props atom — no store or
 * routing. The user bubble background is brand-injected via `userBubbleBgClass`
 * (the supervisor's accent); bot bubbles are neutral (bg-card + border).
 */
const meta = {
  title: "Shell/Chat/MessageBubble",
  component: MessageBubble,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`MessageBubble` es el átomo de **una burbuja del chat** dentro del panel del supervisor o de un especialista (paradigma: los trabajadores conversan con el usuario; el chat es la cara de la *capa de acción*). Dos roles:",
          "",
          "- **`role=\"bot\"`** → alineado a la izquierda, `bg-card` + borde neutro, pie `Nombre · HH:MM`. Es lo que dice el agente.",
          "- **`role=\"user\"`** → alineado a la derecha, fondo del **color del agente activo** (`userBubbleBgClass`) + texto blanco, pie `HH:MM`. Es lo que escribe la persona.",
          "",
          "El contenido se renderiza como texto JSX (React auto-escapa — XSS-safe). Para una conversación, apílalas en un contenedor `flex flex-col` (cada burbuja se auto-alinea con `self-start`/`self-end`).",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Agente \"pensando\" / abriendo una herramienta** → `TypingIndicator` (burbuja viva con color soft del agente).",
          "- **Handoff entre agentes** (Valeria delega en un especialista) → `DelegateMarker`.",
          "- **No** uses `dangerouslySetInnerHTML` ni metas markdown crudo: la burbuja muestra texto plano por contrato de seguridad.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bot: Story = {
  name: "Del agente (bot)",
  args: {
    role: "bot",
    content: "Hola, soy Valeria. Tienes 3 turnos sin confirmar para esta semana. ¿Quieres que te los recuerde uno por uno?",
    time: "09:14",
    agent: DEMO_AGENTS.valeria,
  },
};

export const User: Story = {
  name: "De la persona (user)",
  args: {
    role: "user",
    content: "Sí, perfecto. Empieza por los de mañana.",
    time: "09:15",
    userBubbleBgClass: "bg-agent-valeria",
  },
};

export const Conversacion: Story = {
  name: "Conversación (apiladas)",
  render: () => (
    <div className="flex flex-col gap-2.5 max-w-md">
      <MessageBubble
        role="bot"
        agent={DEMO_AGENTS.valeria}
        time="09:14"
        content="Buen día. La paciente Laura Castillo pidió reprogramar su control de nutrición."
      />
      <MessageBubble
        role="user"
        time="09:15"
        userBubbleBgClass="bg-agent-valeria"
        content="¿Para cuándo tiene disponibilidad Sofía?"
      />
      <MessageBubble
        role="bot"
        agent={DEMO_AGENTS.valeria}
        time="09:15"
        footerLabel="Sofía (vía Valeria)"
        content="Sofía tiene el jueves 25 a las 10:30 o el viernes 26 a las 16:00. ¿Cuál le ofrezco?"
      />
      <MessageBubble
        role="user"
        time="09:16"
        userBubbleBgClass="bg-agent-valeria"
        content="El jueves 10:30."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Una conversación corta. Nota `footerLabel` para marcar un mensaje delegado (\"Sofía (vía Valeria)\") sin cambiar el color del supervisor.",
      },
    },
  },
};
