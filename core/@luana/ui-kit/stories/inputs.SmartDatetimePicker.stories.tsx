import type { Meta, StoryObj } from "@storybook/nextjs";
import * as React from "react";

import { SmartDateTimePicker } from "../src/smart-datetime-picker";

const meta = {
  title: "Molecules/SmartDatetimePicker",
  component: SmartDateTimePicker,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`SmartDateTimePicker` es el selector canónico de fecha + hora con zona horaria: recibe y emite un ISO 8601 UTC, pero muestra la fecha en la zona horaria del tenant (`timezone` prop). Úsalo en formularios de agenda de citas, programación de eventos, inicio de programas. Internamente combina `Calendar` + `Input type=\"time\"` + `date-fns-tz`.",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Solo fecha sin hora** → usa `Calendar` directamente.",
          "- **Solo hora** → usa `Input type=\"time\"` directamente.",
          "- **Rango de fechas** → usa `Calendar mode=\"range\"` (sin hora).",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof SmartDateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Buenos Aires",
  render: () => {
    const [value, setValue] = React.useState<string | undefined>(
      "2026-06-22T12:00:00.000Z",
    );
    return (
      <div className="w-72">
        <SmartDateTimePicker
          value={value}
          onChange={setValue}
          timezone="America/Buenos_Aires"
          placeholder="Seleccionar fecha y hora"
        />
        {value && (
          <p className="mt-2 text-xs text-muted-foreground">ISO UTC: {value}</p>
        )}
      </div>
    );
  },
};

export const Mexico: Story = {
  name: "México",
  render: () => {
    const [value, setValue] = React.useState<string | undefined>(undefined);
    return (
      <div className="w-72">
        <SmartDateTimePicker
          value={value}
          onChange={setValue}
          timezone="America/Mexico_City"
          placeholder="Seleccionar fecha y hora"
        />
        {value && (
          <p className="mt-2 text-xs text-muted-foreground">ISO UTC: {value}</p>
        )}
      </div>
    );
  },
};

export const SinFecha: Story = {
  name: "Sin fecha previa (placeholder)",
  render: () => {
    const [value, setValue] = React.useState<string | undefined>(undefined);
    return (
      <div className="w-72">
        <SmartDateTimePicker
          value={value}
          onChange={setValue}
          timezone="America/Lima"
        />
      </div>
    );
  },
};
