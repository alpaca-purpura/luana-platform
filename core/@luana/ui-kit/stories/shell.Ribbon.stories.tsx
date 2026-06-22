import type { Meta, StoryObj } from "@storybook/nextjs";

import { Ribbon } from "../src";
import {
  DEMO_AGENTS_ARRAY,
  DEMO_RIBBON_ORDER,
  getDemoAgentClasses,
} from "./_shell-fixtures";

/**
 * Story consumes the REAL Ribbon from src/. The active tab is URL-derived from
 * the injected `pathname` prop (Ribbon never imports next/navigation), so each
 * story just passes a different pathname.
 */
const meta = {
  title: "Shell/Ribbon",
  component: Ribbon,
  args: {
    agentCatalog: DEMO_AGENTS_ARRAY,
    ribbonOrder: DEMO_RIBBON_ORDER,
    getAgentClasses: getDemoAgentClasses,
    configTabSlug: "config",
    configTabLabel: "Plataforma",
    onNavigate: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[760px] max-w-full overflow-hidden rounded-lg border border-border">
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
          "El `Ribbon` es la **navegación N1 del shell**: la fila de agentes (tab por trabajador) + la pestaña Plataforma al final. Es el sesgo de ruteo del producto — el usuario elige con quién trabaja (PARADIGM: trabajadores sobre un sistema). Cada tab toma el color del agente; el activo se deriva de la URL (no hay estado de selección a mano). Tablist accesible (flechas/Home/End/Enter).",
          "",
          "Se monta una sola vez, arriba del shell, debajo del `TopBarShell`. La marca inyecta su catálogo + orden + `getAgentClasses`.",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Sub-secciones de un agente** → `SubTabsBar` (N2), no más tabs en el ribbon.",
          "- **Navegación de una hoja lista/detalle** → `EntitySubNavBar` (N3), dentro del panel.",
          "- **No** lo uses para acciones (botones) — es navegación entre agentes.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof Ribbon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MateoActivo: Story = {
  name: "Mateo activo (Atender)",
  args: { pathname: "/clinica/mateo/agenda" },
};

export const LisaActiva: Story = {
  name: "Lisa activa (Mi Clínica)",
  args: { pathname: "/clinica/lisa/marca" },
};

export const AdrianActivo: Story = {
  name: "Adrián activo (Vender)",
  args: { pathname: "/clinica/adrian/inbox" },
};

export const LucasActivo: Story = {
  name: "Lucas activo (Atraer)",
  args: { pathname: "/clinica/lucas/lanzar" },
};

export const CamilaActiva: Story = {
  name: "Camila activa (Mantener)",
  args: { pathname: "/clinica/camila/voz" },
};

export const PlataformaActiva: Story = {
  name: "Plataforma activa",
  args: { pathname: "/clinica/config" },
};
