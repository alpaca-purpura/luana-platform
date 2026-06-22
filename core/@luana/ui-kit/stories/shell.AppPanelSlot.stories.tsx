import type { Meta, StoryObj } from "@storybook/nextjs";

import { AppPanelSlot, PlaceholderCard } from "../src";
import {
  DEMO_AGENTS_ARRAY,
  DEMO_RIBBON_ORDER,
  DEMO_SUBSUBTABS_BY_KEY,
  buildCleanSubtabs,
  getDemoAgentClasses,
} from "./_shell-fixtures";

// Local (non-exported) clean record — see buildCleanSubtabs docgen note.
const SUBTABS = buildCleanSubtabs();

/**
 * Story consumes the REAL AppPanelSlot from src/ — the application-side host that
 * stacks Ribbon (N1) + SubTabsBar (N2) + SubSubTabsBar (N3) + the page content.
 *
 * AppPanelSlot reads usePathname()/useRouter() (next/navigation) internally → the
 * active agent/sub-tab/sub-sub-tab are URL-derived. @storybook/nextjs mocks them
 * via parameters.nextjs.navigation, so each story just sets a different pathname.
 *
 * The wrapper gives it the panel height (h-full); AppPanelSlot fills it.
 */
const meta = {
  title: "Shell/AppPanelSlot",
  component: AppPanelSlot,
  args: {
    agentCatalog: DEMO_AGENTS_ARRAY,
    ribbonOrder: DEMO_RIBBON_ORDER,
    // ★ CLEAN record (docgen-pollution-safe) — SubTabsBar does Object.entries.
    subTabsByAgent: SUBTABS,
    subSubTabsByKey: DEMO_SUBSUBTABS_BY_KEY,
    getAgentClasses: getDemoAgentClasses,
    configTabSlug: "config",
    configTabLabel: "Plataforma",
    onNavigate: () => {},
  },
  decorators: [
    (Story) => (
      <div className="h-[560px] w-full overflow-hidden rounded-lg border border-border">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`AppPanelSlot` es el **lado de aplicación del shell**: apila la navegación (Ribbon N1 + SubTabsBar N2 + SubSubTabsBar N3) arriba y deja la hoja debajo en un marco scrolleable. Es el panel derecho del `ShellLayout` — lo que el usuario ve al lado del supervisor. Deriva todo de la URL; las barras N2/N3 se ocultan solas cuando el agente/sub-tab no las tiene.",
          "",
          "Casi nunca lo montas suelto: vive dentro de `ShellLayout`. Esta story existe para revisar el apilado de navegación + el marco de contenido en aislamiento. El padre debe darle altura.",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **El shell completo** (con supervisor + split resizable) → `ShellLayout`, que monta este panel.",
          "- **Solo una barra de navegación** → `Ribbon` / `SubTabsBar` / `SubSubTabsBar` por separado.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof AppPanelSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Demo leaf content (so the panel shows something below the nav). */
const DemoContent = () => (
  <div className="p-6">
    <PlaceholderCard
      icon="📋"
      title="Resumen del día"
      description="Aquí vive la hoja del agente activo. El marco scrollea; las barras de navegación quedan fijas arriba."
    />
  </div>
);

export const Valeria: Story = {
  name: "Valeria (Resumen · sin N3)",
  args: { children: <DemoContent /> },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/valeria/resumen",
        segments: [["tenantId", "clinica"], "valeria", "resumen"],
      },
    },
  },
};

export const Lisa: Story = {
  name: "Lisa (Marca · con N3 Identidad/Voz/Logo)",
  args: { children: <DemoContent /> },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/lisa/marca/identidad",
        segments: [["tenantId", "clinica"], "lisa", "marca", "identidad"],
      },
    },
  },
};

export const SinContenido: Story = {
  name: "Sin contenido (skeleton por defecto)",
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/beta/leads",
        segments: [["tenantId", "clinica"], "beta", "leads"],
      },
    },
  },
};
