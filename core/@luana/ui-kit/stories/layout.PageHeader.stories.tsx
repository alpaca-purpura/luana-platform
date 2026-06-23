import type { Meta, StoryObj } from "@storybook/nextjs";
import { Plus } from "lucide-react";

import { PageHeader } from "../src/layout/page";
import { Button } from "../src/button";

const meta = {
  title: "Templates/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "Es el **encabezado estándar de una hoja**: título prominente (`h1`) + subtítulo opcional + slot de acciones a la derecha (botones, menú). Úsalo como primer bloque de una hoja dentro de `<PageContainer>`.",
          "",
          "Aplica distribución `flex items-start justify-between` para que las acciones queden siempre a la derecha aunque el título sea largo.",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **No** lo uses cuando la hoja está dentro de `EntityWorkspaceLayout` — ahí el encabezado de la entidad lo maneja `EntitySubNavBar` (franja N3, canon §2.2).",
          "- **No** lo uses como encabezado de sección (eso es `<PageSection title=...>`, con `h2`).",
          "",
          "### Slot back-pill (`backLabel` / `onBack`)",
          "",
          "> Para una hoja-leaf con regreso, pasá `backLabel` (+ `onBack`): renderiza un pill clickeable «‹ {backLabel}» arriba del título. Usa la flechita `‹` (no `←`). Es aditivo — sin `backLabel` el encabezado se comporta igual que antes. El slot `leading` permite además un dot de agente o ícono junto al título.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SinAcciones: Story = {
  args: {
    title: "Doctores",
    subtitle: "Gestiona el directorio médico de la clínica",
  },
};

export const ConAcciones: Story = {
  args: {
    title: "Doctores",
    subtitle: "4 doctores activos",
    actions: (
      <Button size="sm">
        <Plus className="mr-1.5 h-4 w-4" aria-hidden />
        Agregar doctor
      </Button>
    ),
  },
};

export const ConBackPill: Story = {
  name: "Con back-pill (hoja-leaf)",
  args: {
    backLabel: "Agenda",
    onBack: () => {},
    title: "Nueva cita",
    subtitle: "Martes 24 jun · 14:30",
    actions: (
      <Button variant="outline" size="sm">
        Descartar
      </Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Hoja-leaf con retorno: el pill «‹ Agenda» (flechita `‹`) llama a `onBack`. Aditivo sobre la API de siempre (título/subtítulo/acciones).",
      },
    },
  },
};

export const TituloLargoConAcciones: Story = {
  name: "Título largo con acciones",
  args: {
    title: "Directorio de especialistas — Clínica San Martín, Sede Palermo",
    subtitle: "12 especialistas registrados · última actualización hace 2 días",
    actions: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Exportar
        </Button>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          Nuevo
        </Button>
      </div>
    ),
  },
};
