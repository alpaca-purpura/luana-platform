// cap: abel.icp-buyer
/**
 * WhatForChip.stories.tsx — CSF3 stories para WhatForChip.
 *
 * Chip contextual que muestra qué agentes consumen un campo/grupo (RN-4).
 * Hover/focus abre tooltip con descripción de uso por agente.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WhatForChip } from "./WhatForChip";

const meta: Meta<typeof WhatForChip> = {
  title: "Abel/Moléculas/WhatForChip",
  component: WhatForChip,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    consumers: {
      control: "check",
      options: ["abel", "brenda", "christian", "norvil", "sara"],
      description: "Agentes que consumen este campo/grupo",
    },
    fieldLabel: {
      control: "text",
      description: "Etiqueta del campo (para el tooltip)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof WhatForChip>;

/** Solo Brenda — señales de targeting para campañas. */
export const SoloBreda: Story = {
  args: {
    consumers: ["brenda"],
    fieldLabel: "Señales de targeting",
  },
};

/** Abel + Christian — datos de posicionamiento usados en estrategia y outreach. */
export const AbelYChristian: Story = {
  args: {
    consumers: ["abel", "christian"],
    fieldLabel: "Ángulo de venta",
  },
};

/** Los 5 agentes — campo transversal (ej. vertical de industria). */
export const TodosLosAgentes: Story = {
  args: {
    consumers: ["abel", "brenda", "christian", "norvil", "sara"],
    fieldLabel: "Vertical de industria",
  },
};

/** Un solo agente sin fieldLabel. */
export const SoloNorvilSinLabel: Story = {
  args: {
    consumers: ["norvil"],
  },
};

/** Ejemplo en contexto de formulario — junto a una etiqueta de campo. */
export const EnContextoDeFormulario: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Señales de compra</label>
        <WhatForChip consumers={["brenda", "christian"]} fieldLabel="Señales de compra" />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Dolor principal</label>
        <WhatForChip consumers={["christian"]} fieldLabel="Dolor principal" />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Ticket promedio</label>
        <WhatForChip consumers={["abel", "norvil"]} fieldLabel="Ticket promedio" />
      </div>
    </div>
  ),
};
