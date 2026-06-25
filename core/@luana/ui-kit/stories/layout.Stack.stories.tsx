import type { Meta, StoryObj } from "@storybook/nextjs";

import { Stack } from "../src/layout/stack";

const Box = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md border border-border/60 bg-card px-3 py-2 text-sm text-muted-foreground">
    {children}
  </div>
);

const meta = {
  title: "Templates/Stack",
  component: Stack,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`Stack` es el **micro-layout flex genérico** para el interior de un componente: stacks de label+control, columnas de tarjeta, empty-states de diálogo. Tokenizado (`gap` = escala de spacing) y JIT-safe (clases de mapas estáticos).",
          "",
          "Reemplaza los `<div className=\"flex flex-col gap-2\">` sueltos manteniendo el mismo output visual (`<Stack gap={2}>` ≡ `flex flex-col gap-2`).",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- Para espaciar **bloques de una hoja** usa `<PageContentStack>` (gap-6 page-level), no `Stack`.",
          "- `className` siempre gana vía tailwind-merge: `<Stack gap={1} className=\"min-w-0\">`.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    direction: { control: "inline-radio", options: ["col", "row"] },
    gap: { control: "select", options: [0, 1, 2, 3, 4, 5, 6, 8] },
    align: { control: "select", options: [undefined, "start", "center", "end", "stretch"] },
    justify: { control: "select", options: [undefined, "start", "center", "end", "between"] },
  },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <Box>Item A</Box>
        <Box>Item B</Box>
        <Box>Item C</Box>
      </>
    ),
  },
};

export const Row: Story = {
  args: {
    direction: "row",
    gap: 3,
    children: (
      <>
        <Box>Uno</Box>
        <Box>Dos</Box>
        <Box>Tres</Box>
      </>
    ),
  },
};

export const Gaps: Story = {
  render: () => (
    <Stack gap={6}>
      {([1, 2, 3, 4] as const).map((g) => (
        <Stack key={g} direction="row" gap={g} align="center">
          <span className="w-12 shrink-0 text-xs text-muted-foreground">gap {g}</span>
          <Box>A</Box>
          <Box>B</Box>
          <Box>C</Box>
        </Stack>
      ))}
    </Stack>
  ),
};

export const AlignAndJustify: Story = {
  args: {
    direction: "row",
    gap: 2,
    justify: "between",
    align: "center",
    className: "min-h-16 rounded-md border border-dashed border-border/60 p-3",
    children: (
      <>
        <Box>Izquierda</Box>
        <Box>Derecha</Box>
      </>
    ),
  },
};
