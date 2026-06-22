import type { Meta, StoryObj } from "@storybook/nextjs";
import * as React from "react";
import { useForm } from "react-hook-form";

import { RichSelect, type RichSelectOption } from "../src/rich-select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../src/form";

const meta = {
  title: "Molecules/RichSelect",
  component: RichSelect,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`RichSelect` extiende el `Select` canónico de Shadcn con opciones enriquecidas: cada opción tiene `label` (obligatorio) + `description` opcional que aparece como subtítulo dentro del item. Úsalo cuando las opciones necesitan contexto para que el usuario elija bien: archetype de oferta, tipo de consulta, especialidad médica, plan de facturación.",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Opciones simples sin descripción** → usa `Select` estándar (más liviano).",
          "- **`<select>` nativo** → PROHIBIDO (canon §2.5).",
          "- **Búsqueda sobre muchas opciones** → usa `CurrencySelector` o `TimezoneSelect` (tienen Combobox con búsqueda).",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof RichSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const especialidades: RichSelectOption[] = [
  { value: "cardiologia", label: "Cardiología", description: "Diagnóstico y tratamiento del corazón y sistema cardiovascular." },
  { value: "nutricion", label: "Nutrición y Metabolismo", description: "Planes alimentarios, control de peso y enfermedades metabólicas." },
  { value: "psicologia", label: "Psicología Clínica", description: "Atención de salud mental, terapia individual y grupal." },
  { value: "neurologia", label: "Neurología", description: "Sistema nervioso central y periférico." },
  { value: "medicina_general", label: "Medicina General", description: "Atención primaria, chequeos y derivaciones." },
];

const tiposConsulta: RichSelectOption[] = [
  { value: "presencial", label: "Presencial", description: "El paciente asiste al consultorio en la fecha pactada." },
  { value: "videollamada", label: "Videollamada", description: "Consulta remota por Google Meet o Zoom. Se envía link al paciente." },
  { value: "domicilio", label: "A domicilio", description: "El profesional se desplaza al domicilio del paciente. Aplica zona de cobertura." },
];

export const Default: Story = {
  render: () => {
    const form = useForm<{ especialidad: string }>({
      defaultValues: { especialidad: "" },
    });
    return (
      <Form {...form}>
        <form className="w-80">
          <FormField
            control={form.control}
            name="especialidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidad</FormLabel>
                <RichSelect
                  options={especialidades}
                  placeholder="Selecciona una especialidad"
                  value={field.value}
                  onValueChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  },
};

export const TipoConsulta: Story = {
  name: "Tipo de consulta",
  render: () => {
    const form = useForm<{ tipo: string }>({
      defaultValues: { tipo: "presencial" },
    });
    return (
      <Form {...form}>
        <form className="w-80">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalidad</FormLabel>
                <RichSelect
                  options={tiposConsulta}
                  placeholder="Selecciona la modalidad"
                  value={field.value}
                  onValueChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  },
};

export const Deshabilitado: Story = {
  name: "Deshabilitado",
  render: () => {
    const form = useForm<{ especialidad: string }>({
      defaultValues: { especialidad: "cardiologia" },
    });
    return (
      <Form {...form}>
        <form className="w-80">
          <FormField
            control={form.control}
            name="especialidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidad (bloqueada)</FormLabel>
                <RichSelect
                  options={especialidades}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled
                />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  },
};
