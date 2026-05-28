// cap: sales_agent.inbox-handler-mode-occ
// atomics: TBD
// story-origin: TBD
/**
 * PauseAdrianConfirmModal.stories.tsx — Storybook stories for the pause Adrián confirm dialog.
 *
 * Componente completamente controlado (no hooks externos). Cubre:
 * modal abierto vacío, modal con razón, estado enviando, modal cerrado.
 *
 * downstream-regression-na: brand-local story; no cross-brand consumers
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { PauseAdrianConfirmModal } from "./PauseAdrianConfirmModal";

const meta: Meta<typeof PauseAdrianConfirmModal> = {
  title: "Features/Inbox/PauseAdrianConfirmModal",
  component: PauseAdrianConfirmModal,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "vitalia-surface" },
    layout: "fullscreen",
  },
  args: {
    open: true,
    onConfirm: fn(),
    onClose: fn(),
    isPending: false,
  },
  argTypes: {
    open: {
      control: "boolean",
      description: "Controla visibilidad del modal",
    },
    isPending: {
      control: "boolean",
      description: "Mutación de pausa en vuelo",
    },
  },
};

export default meta;
type Story = StoryObj<typeof PauseAdrianConfirmModal>;

export const AbiertoPorDefecto: Story = {
  name: "Abierto (sin razón)",
};

export const EnviandoPausa: Story = {
  name: "Enviando pausa…",
  args: {
    isPending: true,
  },
};

export const Cerrado: Story = {
  name: "Cerrado (no renderiza nada)",
  args: {
    open: false,
  },
};
