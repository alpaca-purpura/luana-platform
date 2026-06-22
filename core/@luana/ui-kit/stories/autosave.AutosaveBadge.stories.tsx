import type { Meta, StoryObj } from "@storybook/nextjs";

import { AutosaveBadge } from "../src/AutosaveBadge";

const meta = {
  title: "Autosave/AutosaveBadge",
  component: AutosaveBadge,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`AutosaveBadge` es un **indicador inline de autoguardado** — ideal para colocarlo dentro de una cabecera de sección, barra de navegación, o encabezado de entidad donde no hay espacio para la versión flotante.",
          "",
          "Usa ícono + texto con contrastes AA-safe (nunca color solo), `role=\"status\"` + `aria-live` para accesibilidad.",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **No** lo uses como reemplazo de `<FloatingAutosaveIndicator>` en una hoja de formulario — el indicador flotante cubre la hoja completa (canon §2.6), el badge es para zonas puntuales.",
          "- **No** pongas un badge por `<Group>` y también un `FloatingAutosaveIndicator` — elige uno de los dos patrones por hoja.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof AutosaveBadge>;

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
    savedAt: new Date(Date.now() - 30 * 1000),
  },
};

export const ErrorStatus: Story = {
  name: "Error al guardar",
  args: {
    status: "error",
  },
};

export const TodosLosEstados: Story = {
  name: "Todos los estados",
  render: () => (
    <div className="flex flex-col gap-4">
      {(["idle", "dirty", "saving", "saved", "error"] as const).map((s) => (
        <div key={s} className="flex items-center gap-4">
          <span className="w-14 text-xs text-muted-foreground">{s}</span>
          <AutosaveBadge
            status={s}
            savedAt={s === "saved" ? new Date(Date.now() - 10 * 1000) : undefined}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparación de los 5 estados en una sola vista.",
      },
    },
  },
};
