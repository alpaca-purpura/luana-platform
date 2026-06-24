// cap: abel.icp-buyer
/**
 * UniversalIntake.stories.tsx — CSF3 stories para UniversalIntake.
 *
 * El componente no usa React Query — solo callbacks onSubmit/onCancel.
 * Stories muestran los 4 modos (URL, Archivo, Texto, Conectar-disabled).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { UniversalIntake } from "./UniversalIntake";

const meta: Meta<typeof UniversalIntake> = {
  title: "Abel/Moléculas/UniversalIntake",
  component: UniversalIntake,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    initialMode: {
      control: "radio",
      options: ["url", "archivo", "texto", "conectar"],
      description: "Modo activo al abrir el intake",
    },
    isSubmitting: {
      control: "boolean",
      description: "Deshabilita el botón mientras se procesa",
    },
    tenantId: {
      control: "text",
    },
    onSubmit: { action: "onSubmit" },
    onCancel: { action: "onCancel" },
  },
  args: {
    onSubmit: fn(),
    onCancel: fn(),
    tenantId: "tenant-uuid-storybook-00000001",
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UniversalIntake>;

/** Modo URL — pegar un enlace para que Abel analice. */
export const ModoURL: Story = {
  args: {
    initialMode: "url",
    isSubmitting: false,
  },
};

/** Modo Archivo — subir un PDF o documento. */
export const ModoArchivo: Story = {
  args: {
    initialMode: "archivo",
    isSubmitting: false,
  },
};

/** Modo Texto — pegar texto libre (briefing, notas, correo). */
export const ModoTexto: Story = {
  args: {
    initialMode: "texto",
    isSubmitting: false,
  },
};

/** Modo Conectar — placeholder deshabilitado (funcionalidad futura). */
export const ModoConectar: Story = {
  args: {
    initialMode: "conectar",
    isSubmitting: false,
  },
};

/** Enviando — botón deshabilitado con estado de carga. */
export const Enviando: Story = {
  args: {
    initialMode: "url",
    isSubmitting: true,
  },
};
