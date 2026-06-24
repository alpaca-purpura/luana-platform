// cap: shell-organism.shell-nicolify
/**
 * LogoMark.stories.tsx — CSF3 stories para LogoMark.
 *
 * Server Component — no hooks, no state.
 * Cubre variantes: full/mark × sm/md/lg × light/dark.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { LogoMark } from "./LogoMark";

const meta: Meta<typeof LogoMark> = {
  title: "Shell/Organismo/LogoMark",
  component: LogoMark,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Altura del logo",
    },
    variant: {
      control: "radio",
      options: ["full", "mark"],
      description: "full = logotipo horizontal · mark = isotipo cuadrado",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LogoMark>;

/** Logotipo horizontal tamaño md (TopBar). */
export const FullMd: Story = {
  args: {
    variant: "full",
    size: "md",
  },
};

/** Isotipo cuadrado — versión compacta. */
export const MarkMd: Story = {
  args: {
    variant: "mark",
    size: "md",
  },
};

/** Logotipo grande — modo lg. */
export const FullLg: Story = {
  args: {
    variant: "full",
    size: "lg",
  },
};

/** Logotipo pequeño — modo sm. */
export const FullSm: Story = {
  args: {
    variant: "full",
    size: "sm",
  },
};

/** Isotipo en los 3 tamaños. */
export const IsotipoTodosTamanos: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <LogoMark variant="mark" size="sm" />
        <span className="text-xs text-muted-foreground">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LogoMark variant="mark" size="md" />
        <span className="text-xs text-muted-foreground">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LogoMark variant="mark" size="lg" />
        <span className="text-xs text-muted-foreground">lg</span>
      </div>
    </div>
  ),
};

/** Logotipo en modo oscuro — usar el theme switcher del addon-themes. */
export const ModoOscuro: Story = {
  args: {
    variant: "full",
    size: "md",
  },
  parameters: {
    themes: { defaultTheme: "dark" },
  },
};
