import type { Meta, StoryObj } from "@storybook/nextjs";

import { SubTabsBar, type ShellSubTabMeta } from "../src";
import {
  DEMO_AGENTS,
  DEMO_RIBBON_ORDER,
  DEMO_SUBTABS_BY_AGENT,
  getDemoAgentClasses,
} from "./_shell-fixtures";

/**
 * ★ react-docgen-typescript (autodocs) stamps `displayName` + `__docgenInfo` as
 * ENUMERABLE props onto every exported object — so Object.entries(DEMO_SUBTABS_BY_AGENT)
 * yields phantom `["displayName", <string>]` / `["__docgenInfo", <obj>]` entries.
 * SubTabsBar does `Object.entries(subTabsByAgent).map(([k, tabs]) => tabs.map(...))`
 * → `tabs.map is not a function` on the string. Rebuild a clean Record keyed only by
 * real slugs (DEMO_RIBBON_ORDER is an array → iterating it never sees the stamped props).
 */
const SUBTABS_BY_AGENT: Record<string, ShellSubTabMeta[]> = Object.fromEntries(
  DEMO_RIBBON_ORDER.map((slug) => [slug, DEMO_SUBTABS_BY_AGENT[slug]]),
);

/**
 * Story consumes the REAL SubTabsBar from src/. It reads usePathname/useParams
 * (next/navigation) → @storybook/nextjs mocks them via parameters.nextjs.navigation.
 *
 * ★ Props are passed LITERALLY via `render` (not Storybook args): the Controls
 *   addon deep-clones object args and turns the Record's nested arrays into
 *   index-objects → `tabs.map is not a function`. A literal render bypasses that.
 */
const meta = {
  title: "Shell/SubTabsBar",
  component: SubTabsBar,
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
          "El `SubTabsBar` es la **navegación N2**: las sub-secciones del agente activo (Resumen / Agenda / Tareas…). Franja full-bleed con el mismo lenguaje que el Ribbon; el activo toma el color soft del agente. Se deriva de la URL y **se oculta solo** (devuelve `null`) cuando el agente no tiene sub-tabs.",
          "",
          "Va debajo del `Ribbon`. La marca inyecta `subTabsByAgent`.",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **3+ vistas discretas dentro de una sub-tab** → `SubSubTabsBar` (N3-static), nunca Tabs internas en el body.",
          "- **Tabs de contenido dentro de una hoja** → `Tabs` / `TogglePill`.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof SubTabsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Demo = () => (
  <SubTabsBar
    agentCatalog={DEMO_AGENTS}
    subTabsByAgent={SUBTABS_BY_AGENT}
    getAgentClasses={getDemoAgentClasses}
    onNavigate={() => {}}
  />
);

export const Valeria: Story = {
  name: "Valeria (Agenda activa)",
  render: () => <Demo />,
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/valeria/agenda",
        segments: [["tenantId", "clinica"], "valeria", "agenda"],
      },
    },
  },
};

export const Lisa: Story = {
  name: "Lisa (Marca activa)",
  render: () => <Demo />,
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/lisa/marca",
        segments: [["tenantId", "clinica"], "lisa", "marca"],
      },
    },
  },
};
