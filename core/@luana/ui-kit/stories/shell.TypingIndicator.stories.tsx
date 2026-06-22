import type { Meta, StoryObj } from "@storybook/nextjs";

import { TypingIndicator } from "../src";
import { DEMO_AGENTS, getDemoAgentClasses } from "./_shell-fixtures";

/**
 * Story consumes the REAL TypingIndicator from src/. The animated dots use the
 * `.typing-dot` keyframe defined in .storybook/preview.css (a brand ships it in
 * globals.css). Agent soft-bg + accent come from getAgentClasses.
 */
const meta = {
  title: "Shell/Chat/TypingIndicator",
  component: TypingIndicator,
  args: { getAgentClasses: getDemoAgentClasses },
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`TypingIndicator` es la burbuja **viva** que muestra que un agente está trabajando: \"escribiendo…\" o, mejor, **qué acción está ejerciendo** (\"está abriendo Voz del paciente\"). Toma el **color soft del agente** como fondo y anima tres puntos. Da feedback inmediato mientras el turno corre.",
          "",
          "Por defecto el texto es `{Nombre} está escribiendo…`; pasa `text` para describir la acción concreta (más honesto que un genérico \"escribiendo\").",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Ya hay respuesta** → `MessageBubble role=\"bot\"`.",
          "- **Handoff a otro agente** → `DelegateMarker`.",
          "- **Carga de una pantalla/sección entera** (no un turno de chat) → usa un `Skeleton` / estado de carga de la hoja, no esta burbuja.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof TypingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Escribiendo: Story = {
  name: "Valeria escribiendo",
  args: {
    agent: DEMO_AGENTS.valeria,
  },
};

export const AccionConcreta: Story = {
  name: "Acción concreta (Lisa)",
  args: {
    agent: DEMO_AGENTS.lisa,
    text: "Lisa está abriendo la ficha de marca del paciente…",
  },
};

export const VariosAgentes: Story = {
  name: "Color por agente",
  render: () => (
    <div className="flex flex-col gap-2.5 max-w-md">
      <TypingIndicator agent={DEMO_AGENTS.valeria} getAgentClasses={getDemoAgentClasses} />
      <TypingIndicator agent={DEMO_AGENTS.lisa} getAgentClasses={getDemoAgentClasses} />
      <TypingIndicator
        agent={DEMO_AGENTS.beta}
        getAgentClasses={getDemoAgentClasses}
        text="Diego está revisando los leads nuevos de Instagram…"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "El fondo soft cambia con el agente que trabaja — la persona reconoce quién está actuando sin leer el nombre.",
      },
    },
  },
};
