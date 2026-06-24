// cap: shell-organism.shell-nicolify
/**
 * AddAgencyPlaceholderModal.stories.tsx — CSF3 stories para AddAgencyPlaceholderModal.
 *
 * Modal placeholder para "Agregar agencia" (funcionalidad futura).
 * El componente envuelve children como trigger.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/ui/button";

import { AddAgencyPlaceholderModal } from "./AddAgencyPlaceholderModal";

const meta: Meta<typeof AddAgencyPlaceholderModal> = {
  title: "Shell/Organismo/AddAgencyPlaceholderModal",
  component: AddAgencyPlaceholderModal,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof AddAgencyPlaceholderModal>;

/** Modal con trigger de botón — hacer clic para ver el dialog. */
export const ConTriggerBoton: Story = {
  args: {
    children: <Button variant="outline">Agregar agencia</Button>,
  },
};

/** Modal con trigger de texto simple. */
export const ConTriggerTexto: Story = {
  args: {
    children: (
      <span className="text-sm text-muted-foreground cursor-pointer">+ Agregar agencia</span>
    ),
  },
};
