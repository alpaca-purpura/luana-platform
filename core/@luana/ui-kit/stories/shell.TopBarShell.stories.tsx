import type { Meta, StoryObj } from "@storybook/nextjs";
import type { ReactNode } from "react";

import { TopBarShell } from "../src";
import { useDemoShellStore } from "./_shell-fixtures";

/** Demo brand slots (a real brand injects LogoMark + ThemeToggle + TenantSwitcher). */
const LOGO_SLOT: ReactNode = (
  <span className="text-base font-semibold tracking-tight text-foreground">
    <span className="text-primary">●</span> Clínica Demo
  </span>
);

const RIGHT_CLUSTER_SLOT: ReactNode = (
  <>
    <button
      type="button"
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
      aria-label="Cambiar tema"
    >
      <span aria-hidden="true">🌙</span>
    </button>
    <button
      type="button"
      className="flex h-8 items-center gap-2 rounded-md border border-border px-2.5 text-sm hover:bg-muted"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-agent-valeria-soft text-[10px] font-semibold">
        SP
      </span>
      <span className="text-foreground">Sonrisa Plena</span>
    </button>
  </>
);

/**
 * Story consumes the REAL TopBarShell from src/. The interactive variant
 * subscribes the injected shell store (mobile burger); the skeleton variant is
 * store-free (renders outside the ssr:false boundary).
 */
const meta = {
  title: "Shell/TopBarShell",
  component: TopBarShell,
  args: {
    supervisorName: "Valeria",
    logoSlot: LOGO_SLOT,
    rightClusterSlot: RIGHT_CLUSTER_SLOT,
  },
  decorators: [
    (Story) => (
      <div className="w-[860px] max-w-full overflow-hidden rounded-lg border border-border">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "El `TopBarShell` es la **barra global** del shell: logo de marca a la izquierda + cluster de marca a la derecha (tema, selector de tenant) + hamburguesa en mobile. Es transversal — usa `--primary` (no color de agente). La marca inyecta los slots (`logoSlot`, `rightClusterSlot`).",
          "",
          "Variantes: `interactive` (suscribe el store del shell para el drawer mobile) y `skeleton` (store-free, para renderizar fuera del límite `ssr:false` sin tocar la persistencia).",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Cabecera de una hoja** → `PageHeader`.",
          "- **Navegación entre agentes** → `Ribbon`, no la barra global.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof TopBarShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactivo: Story = {
  name: "Interactivo",
  args: { variant: "interactive", useShellStore: useDemoShellStore },
};

export const Skeleton: Story = {
  name: "Skeleton (SSR, store-free)",
  args: { variant: "skeleton" },
};
