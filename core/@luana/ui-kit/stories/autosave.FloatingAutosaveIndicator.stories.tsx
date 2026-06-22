import type { Meta, StoryObj } from "@storybook/nextjs";

import { FloatingAutosaveIndicator } from "../src/FloatingAutosaveIndicator";

const meta = {
  title: "Molecules/FloatingAutosaveIndicator",
  component: FloatingAutosaveIndicator,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "Es el **indicador de autoguardado flotante canónico** (canon §2.6). Se ancla `sticky bottom-4` al final del contenedor scrolleable de una hoja de formulario. Su función es que el usuario SIEMPRE sepa el estado del guardado sin necesidad de buscar un botón.",
          "",
          "Hay **UNA sola instancia por página** (nunca uno por grupo). Se pasa en el slot `autosaveIndicator` de `FormPageScaffold`, o como último hijo de `PageContentStack`.",
          "",
          "Los estados son: `idle` (en espera) → `dirty` (cambios sin guardar, ámbar) → `saving` (guardando, spinner) → `saved` (guardado ✓, verde) → `error` (falló, rojo).",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **No** pongas uno por `<Group>` — solo uno por página.",
          "- **No** lo uses en hojas de solo lectura (no hay nada que guardar).",
          "- Si necesitas un indicador inline dentro de una cabecera de sección (no flotante), usa `<AutosaveBadge>` en su lugar.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof FloatingAutosaveIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    status: "idle",
  },
};

export const Dirty: Story = {
  name: "Dirty (cambios sin guardar)",
  args: {
    status: "dirty",
  },
};

export const Saving: Story = {
  name: "Saving (guardando…)",
  args: {
    status: "saving",
  },
};

export const Saved: Story = {
  name: "Saved (guardado)",
  args: {
    status: "saved",
    savedAt: new Date(Date.now() - 15 * 1000),
  },
  parameters: {
    docs: {
      description: {
        story: "Muestra «Guardado hace 15s». El timestamp se actualiza via `savedAt`.",
      },
    },
  },
};

export const Error: Story = {
  name: "Error al guardar",
  args: {
    status: "error",
  },
};
