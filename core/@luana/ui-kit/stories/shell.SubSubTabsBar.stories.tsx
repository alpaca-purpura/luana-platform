import type { Meta, StoryObj } from "@storybook/nextjs";

import { SubSubTabsBar } from "../src";
import { DEMO_AGENTS, DEMO_SUBSUBTABS_BY_KEY } from "./_shell-fixtures";

/**
 * Story consumes the REAL SubSubTabsBar from src/. It reads the URL via
 * next/navigation (mocked by @storybook/nextjs) and renders the N3-static strip
 * for the active "agent.subtab" key (here lisa.marca → Identidad/Voz/Logo).
 *
 * ★ Props passed LITERALLY via `render` (not args): Controls deep-clones the
 *   Record's nested arrays into index-objects → `.map is not a function`.
 */
const meta = {
  title: "Shell/SubSubTabsBar",
  component: SubSubTabsBar,
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
          "El `SubSubTabsBar` es la **navegación N3-static**: cuando una sub-tab agrupa 3+ vistas conceptualmente discretas (ej. Marca → Identidad / Voz / Logo), se exponen como una tercera franja en la cabecera con su propia ruta (`/{agente}/{subtab}/{subsubtab}`). Se oculta solo si la sub-tab no declara N3, o si la ruta es un detalle de entidad (ahí manda `EntitySubNavBar`).",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Tabs internas en el body** para agrupar secciones → anti-patrón (ADR-vitalia-004): usa esta franja N3.",
          "- **Lista/detalle de entidades** → `EntityWorkspaceLayout` + `EntitySubNavBar`, no N3-static.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof SubSubTabsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const Demo = () => (
  <SubSubTabsBar
    subSubTabsByKey={DEMO_SUBSUBTABS_BY_KEY}
    validSlugs={Object.keys(DEMO_AGENTS)}
    onNavigate={() => {}}
  />
);

export const LisaMarca: Story = {
  name: "Lisa · Marca (Voz activa)",
  render: () => <Demo />,
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/lisa/marca/voz",
        segments: [["tenantId", "clinica"], "lisa", "marca", "voz"],
      },
    },
  },
};
