import type { Meta, StoryObj } from "@storybook/nextjs";

import { Badge } from "../src/badge";

const meta = {
  title: "Atoms/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`Badge` es una etiqueta de estado o categoría pequeña. Úsalo para mostrar el estado de una entidad (activa, vencida, en revisión), una categoría (especialidad, tipo de oferta), o un conteo secundario (3 pendientes).",
          "",
          "Tiene cuatro variantes: `default` (primario), `secondary` (neutro), `destructive` (error/baja), `outline` (sin relleno).",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Para una acción del usuario** → usa `Button` (el badge no tiene estado hover/focus para interacción).",
          "- **Para un conteo de notificaciones sobre un ícono** → usa un span posicionado absolutamente, no un Badge.",
          "- **Para mostrar el progreso de un proceso** → usa `Progress` o un stepper.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Galeria: Story = {
  name: "Galería de variantes",
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="default">Activa</Badge>
      <Badge variant="secondary">En revisión</Badge>
      <Badge variant="destructive">Vencida</Badge>
      <Badge variant="outline">Cardiología</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Las cuatro variantes del `Badge`.",
      },
    },
  },
};

export const Default: Story = {
  args: {
    children: "Activa",
    variant: "default",
  },
};

export const Estados: Story = {
  name: "Estados de turno",
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { label: "Confirmado", variant: "default" as const },
        { label: "Pendiente", variant: "secondary" as const },
        { label: "Cancelado", variant: "destructive" as const },
        { label: "Teleconsulta", variant: "outline" as const },
      ].map((b) => (
        <div key={b.label} className="flex items-center gap-2">
          <Badge variant={b.variant}>{b.label}</Badge>
          <span className="text-sm text-muted-foreground">Turno del 10 jun, 14:30</span>
        </div>
      ))}
    </div>
  ),
};
