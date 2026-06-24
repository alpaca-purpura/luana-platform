// cap: abel.icp-buyer
/**
 * ProposalBanner.stories.tsx — CSF3 stories para ProposalBanner.
 *
 * Muestra el banner de propuesta de Abel (RN-3: origin=draft).
 * Estados: base, ratificando, descartando.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ProposalBanner } from "./ProposalBanner";

const meta: Meta<typeof ProposalBanner> = {
  title: "Abel/Moléculas/ProposalBanner",
  component: ProposalBanner,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    agentName: {
      control: "text",
      description: "Nombre del agente que generó el borrador",
    },
    isRatificando: {
      control: "boolean",
      description: "Muestra spinner en botón Ratificar",
    },
    isDescartando: {
      control: "boolean",
      description: "Muestra spinner en botón Descartar",
    },
    onRatificar: { action: "onRatificar" },
    onDescartar: { action: "onDescartar" },
  },
  args: {
    onRatificar: fn(),
    onDescartar: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ProposalBanner>;

/** Estado base — Abel propone, el dueño puede ratificar o descartar. */
export const Base: Story = {
  args: {
    agentName: "Abel",
    isRatificando: false,
    isDescartando: false,
  },
};

/** Ratificando — spinner en el botón "Ratificar". */
export const Ratificando: Story = {
  args: {
    agentName: "Abel",
    isRatificando: true,
    isDescartando: false,
  },
};

/** Descartando — spinner en el botón "Descartar". */
export const Descartando: Story = {
  args: {
    agentName: "Abel",
    isRatificando: false,
    isDescartando: true,
  },
};

/** Sin nombre de agente — usa el texto genérico. */
export const SinAgente: Story = {
  args: {
    isRatificando: false,
    isDescartando: false,
  },
};
