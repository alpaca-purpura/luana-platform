import type { Meta, StoryObj } from "@storybook/nextjs";

import { Grid } from "../src/layout/stack";

const Cell = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md border border-border/60 bg-card px-3 py-2 text-sm text-muted-foreground">
    {children}
  </div>
);

const meta = {
  title: "Templates/Grid",
  component: Grid,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`Grid` es el **micro-layout de grilla genérico** para el interior de un componente: rejillas de 2/3 columnas de campos de formulario. Tokenizado (`cols` + `gap`) y JIT-safe (mapas estáticos).",
          "",
          "Reemplaza los `<div className=\"grid grid-cols-2 gap-3\">` sueltos: `<Grid cols={2} gap={3}>` ≡ `grid grid-cols-2 gap-3`.",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- Para responsive más fino (breakpoints extra), agrega utilidades vía `className` — gana por tailwind-merge: `<Grid cols={1} className=\"md:grid-cols-2\">`.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    cols: { control: "inline-radio", options: [1, 2, 3, 4] },
    gap: { control: "select", options: [0, 1, 2, 3, 4, 5, 6, 8] },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

const cells = (n: number) =>
  Array.from({ length: n }, (_, i) => <Cell key={i}>Campo {i + 1}</Cell>);

export const Default: Story = {
  args: {
    children: cells(3),
  },
};

export const TwoCol: Story = {
  args: {
    cols: 2,
    gap: 3,
    children: cells(4),
  },
};

export const ThreeCol: Story = {
  args: {
    cols: 3,
    gap: 3,
    children: cells(6),
  },
};
