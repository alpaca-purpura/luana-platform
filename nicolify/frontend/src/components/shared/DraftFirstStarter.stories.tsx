// cap: abel.icp-buyer
/**
 * DraftFirstStarter.stories.tsx — CSF3 stories para DraftFirstStarter.
 *
 * Empty state de la lista de ICPs (RN-2: draft-first starter).
 * Dos acciones: Abel arma el borrador / el dueño lo arma manualmente.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { DraftFirstStarter } from "./DraftFirstStarter";

const meta: Meta<typeof DraftFirstStarter> = {
  title: "Abel/Moléculas/DraftFirstStarter",
  component: DraftFirstStarter,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    agentName: {
      control: "text",
      description: "Nombre del agente que genera el draft",
    },
    onGenerateDraft: { action: "onGenerateDraft" },
    onStartBlank: { action: "onStartBlank" },
  },
  args: {
    onGenerateDraft: fn(),
    onStartBlank: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof DraftFirstStarter>;

/** Estado por defecto — con nombre del agente Abel. */
export const ConAbel: Story = {
  args: {
    agentName: "Abel",
  },
};

/** Sin nombre de agente — texto genérico. */
export const SinAgente: Story = {
  args: {},
};
