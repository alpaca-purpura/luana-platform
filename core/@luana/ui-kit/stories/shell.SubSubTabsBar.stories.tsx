import type { Meta, StoryObj } from "@storybook/nextjs";

import { SubSubTabsBar } from "../src";
import { DEMO_AGENTS, DEMO_SUBSUBTABS_BY_KEY } from "./_shell-fixtures";

/**
 * Story consumes the REAL SubSubTabsBar from src/. It reads the URL via
 * next/navigation (mocked by @storybook/nextjs) and renders the N3-static strip
 * for the active "agent.subtab" key (here lisa.marca → Identidad/Voz y tono/Presencia).
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
          "El `SubSubTabsBar` es la **navegación N3-static**: cuando una sub-tab agrupa 3+ vistas conceptualmente discretas (ej. Marca → Identidad / Voz y tono / Presencia), se exponen como una tercera franja en la cabecera con su propia ruta (`/{agente}/{subtab}/{subsubtab}`). Se oculta solo si la sub-tab no declara N3, o si la ruta es un detalle de entidad (ahí manda `EntitySubNavBar`).",
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

// validSlugs incluye "config" (la caja Plataforma también tiene N3: config.cuenta).
const VALID_SLUGS = [...Object.keys(DEMO_AGENTS), "config"];

const Demo = () => (
  <SubSubTabsBar
    subSubTabsByKey={DEMO_SUBSUBTABS_BY_KEY}
    validSlugs={VALID_SLUGS}
    onNavigate={() => {}}
  />
);

// ★ Sólo 3 combos agent.subtab declaran N3-static en vitalia (lisa.marca,
//   lisa.servicios, config.cuenta). El resto NO tiene N3 → la franja no se pinta.
export const LisaMarca: Story = {
  name: "Lisa · Marca (Voz y tono activa)",
  render: () => <Demo />,
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/lisa/marca/voz-y-tono",
        segments: [["tenantId", "clinica"], "lisa", "marca", "voz-y-tono"],
      },
    },
  },
};

export const LisaServicios: Story = {
  name: "Lisa · Servicios (Catálogo activa)",
  render: () => <Demo />,
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/lisa/servicios/catalogo",
        segments: [["tenantId", "clinica"], "lisa", "servicios", "catalogo"],
      },
    },
  },
};

export const ConfigCuenta: Story = {
  name: "Plataforma · Mi cuenta (Datos activa)",
  render: () => <Demo />,
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/config/cuenta/datos",
        segments: [["tenantId", "clinica"], "config", "cuenta", "datos"],
      },
    },
  },
};
