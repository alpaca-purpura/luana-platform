// cap: shell-organism.shell-nicolify
/**
 * ThemeToggle.stories.tsx — CSF3 stories para ThemeToggle.
 *
 * @storybook/nextjs-vite provee next-themes via su adaptador App Router.
 * El toggle funciona con el addon-themes (withThemeByClassName).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ThemeToggle } from "./ThemeToggle";

const meta: Meta<typeof ThemeToggle> = {
  title: "Shell/Organismo/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

/** Modo claro — muestra ícono de luna. */
export const ModoClaro: Story = {
  parameters: {
    themes: { defaultTheme: "light" },
  },
};

/** Modo oscuro — muestra ícono de sol. */
export const ModoOscuro: Story = {
  parameters: {
    themes: { defaultTheme: "dark" },
  },
};
