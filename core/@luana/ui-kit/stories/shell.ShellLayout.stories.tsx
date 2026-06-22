import { useEffect } from "react";
import type { ReactNode } from "react";
import type { Decorator, Meta, StoryObj } from "@storybook/nextjs";

import {
  ShellLayout,
  PlaceholderCard,
  createShellStore,
  type ShellStore,
  type ShellStoreState,
  type ShellTestIds,
} from "../src";
import {
  DEMO_AGENTS_ALL,
  DEMO_RIBBON_ORDER,
  DEMO_SUBSUBTABS_BY_KEY,
  buildCleanSubtabs,
  getDemoAgentClasses,
  useDemoChatStore,
} from "./_shell-fixtures";

// Local (non-exported) clean record — see buildCleanSubtabs docgen note.
const SUBTABS = buildCleanSubtabs();

/**
 * Story consumes the REAL ShellLayout from src/ — the full composite: TopBar +
 * resizable split (SupervisorSidebar | AppPanelSlot) with Ribbon (N1) + SubTabsBar
 * (N2) + SubSubTabsBar (N3) + the agent's leaf content. Everything the brand wires
 * by prop flows in here (catalog, stores, classes, slots, routing).
 *
 * ★ ShellLayout is next/dynamic ssr:false. @storybook/nextjs mounts it client-side.
 *   Its children (AppPanelSlot → Ribbon/SubTabsBar/SubSubTabsBar) read
 *   usePathname()/useRouter() → each story sets parameters.nextjs.navigation
 *   (the `pathname` prop is required by the type but the chrome derives the active
 *   agent from the navigation hook). Different pathname ⇒ different agent color.
 *
 * ★ subTabsByAgent MUST be the CLEAN record (DEMO_SUBTABS_CLEAN) — SubTabsBar does
 *   Object.entries, and react-docgen-typescript stamps phantom enumerable props on
 *   the raw fixture object.
 *
 * ★ Store states: ShellLayoutClient calls useStoreHydration once on mount → merge()
 *   clobbers the injected store to {supervisorOpen:"chat", historyOpen:false}. The
 *   default/per-agent stories ARE state B, so they need no seeding. The closed (A)
 *   and history (C) states are re-applied AFTER hydration via a requestAnimationFrame
 *   decorator (a module-scope setState would be erased by the hydrate merge). The
 *   closed story uses its OWN store key so its persisted "closed" never bleeds into
 *   the default story.
 */

// Default/per-agent/history share one chat-based store (history not persisted).
const useShellDemo = createShellStore({ storageKey: "sb-shell-demo", version: 1 });
// Closed needs its OWN key — it persists supervisorOpen:"closed".
const useShellDemoClosed = createShellStore({ storageKey: "sb-shell-demo-closed", version: 1 });

/** Re-apply a demo state on the frame AFTER ShellLayoutClient's hydrate merge. */
function seedAfterHydrate(store: ShellStore, patch: Partial<ShellStoreState>): Decorator {
  return function SeedDecorator(Story) {
    useEffect(() => {
      const id = requestAnimationFrame(() => store.setState(patch));
      return () => cancelAnimationFrame(id);
    }, []);
    return <Story />;
  };
}

const LOGO_SLOT: ReactNode = (
  <span className="select-none text-sm font-bold text-foreground">Clínica Demo</span>
);

const RIGHT_CLUSTER_SLOT: ReactNode = (
  <div className="flex items-center gap-2">
    <button type="button" className="rounded-md px-2 py-1 text-xs hover:bg-muted">
      Tema
    </button>
    <button type="button" className="rounded-md border border-border px-2 py-1 text-xs">
      clinica-demo ▾
    </button>
  </div>
);

const TEST_IDS: ShellTestIds = {
  supervisorSidebar: "supervisor-sidebar",
  supervisorCollapsedStrip: "supervisor-strip",
  chat: "supervisor-chat",
  chatHeader: "chat-header",
};

/** Demo leaf content — the agent's page below the nav bars. */
const DemoContent = () => (
  <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
    <PlaceholderCard icon="📅" title="Turnos de hoy" description="3 sin confirmar" count={3} />
    <PlaceholderCard icon="🎟️" title="Reservas" description="Prepagadas esta semana" count={12} status="yellow" />
    <PlaceholderCard icon="🧲" title="Leads" description="Nuevos del embudo" count={5} />
  </div>
);

const meta = {
  title: "Shell/ShellLayout",
  component: ShellLayout,
  args: {
    supervisorName: "Valeria",
    supervisorSlug: "valeria",
    supervisorInitial: "V",
    agentCatalog: DEMO_AGENTS_ALL,
    ribbonOrder: DEMO_RIBBON_ORDER,
    subTabsByAgent: SUBTABS,
    subSubTabsByKey: DEMO_SUBSUBTABS_BY_KEY,
    getAgentClasses: getDemoAgentClasses,
    useShellStore: useShellDemo,
    useChatStore: useDemoChatStore,
    splitGroupId: "sb-shell-split",
    logoSlot: LOGO_SLOT,
    rightClusterSlot: RIGHT_CLUSTER_SLOT,
    testIds: TEST_IDS,
    configTabSlug: "config",
    configTabLabel: "Plataforma",
    statusDotClass: "bg-emerald-500",
    children: <DemoContent />,
  },
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "## Cuándo usarlo",
          "",
          "`ShellLayout` es **el shell completo** — el caparazón de toda la app de marca. Compone el `TopBarShell` arriba y, debajo, un split redimensionable: el `SupervisorSidebar` (Valeria) a la izquierda y el `AppPanelSlot` (Ribbon N1 + SubTabsBar N2 + SubSubTabsBar N3 + la hoja del agente) a la derecha. La marca inyecta TODO por prop: catálogo de agentes, stores, `getAgentClasses`, slots de logo/tema/tenant, copy, testids y el `pathname`. El kit no conoce ningún nombre de marca.",
          "",
          "Úsalo una sola vez, como layout raíz del route-group autenticado. El color del agente activo se deriva de la URL (cada tab toma su color). Es la integración final — todos los componentes Shell/* viven adentro.",
          "",
          "## Cuándo NO / alternativa",
          "",
          "- **Una pieza suelta** → su componente (`SupervisorSidebar`, `AppPanelSlot`, `ChatPanel`, `Ribbon`, …).",
          "- **Una hoja dentro del shell** (lista/detalle) → `EntityWorkspaceLayout` / page-primitives, que se montan como `children`.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof ShellLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Mateo · Agenda (landing default)",
  // ★ distinct splitGroupId per story: useDefaultLayout persists the split width by
  // this key, and a shared key would let the history story's wider split bleed into
  // every other story (non-deterministic catalog widths).
  // pathname = el landing real de vitalia (mateo/agenda) — Valeria es el supervisor
  // del sidebar, NO un tab del ribbon.
  args: { pathname: "/clinica/mateo/agenda", splitGroupId: "sb-shell-default" },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/mateo/agenda",
        segments: [["tenantId", "clinica"], "mateo", "agenda"],
      },
    },
  },
};

export const LisaActiva: Story = {
  name: "Lisa activa (color + N3)",
  args: { pathname: "/clinica/lisa/marca/identidad", splitGroupId: "sb-shell-lisa" },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/lisa/marca/identidad",
        segments: [["tenantId", "clinica"], "lisa", "marca", "identidad"],
      },
    },
  },
};

export const AdrianActivo: Story = {
  name: "Adrián · Inbox (color cian)",
  args: { pathname: "/clinica/adrian/inbox", splitGroupId: "sb-shell-adrian" },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/adrian/inbox",
        segments: [["tenantId", "clinica"], "adrian", "inbox"],
      },
    },
  },
};

export const SupervisorCerrado: Story = {
  name: "Supervisor cerrado (tira-avatar)",
  args: {
    pathname: "/clinica/mateo/agenda",
    useShellStore: useShellDemoClosed,
    splitGroupId: "sb-shell-cerrado",
  },
  decorators: [seedAfterHydrate(useShellDemoClosed, { supervisorOpen: "closed", historyOpen: false })],
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/mateo/agenda",
        segments: [["tenantId", "clinica"], "mateo", "agenda"],
      },
    },
  },
};

export const ChatConHistorial: Story = {
  name: "Chat + historial",
  args: { pathname: "/clinica/mateo/agenda", splitGroupId: "sb-shell-historial" },
  decorators: [seedAfterHydrate(useShellDemo, { supervisorOpen: "chat", historyOpen: true })],
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/clinica/mateo/agenda",
        segments: [["tenantId", "clinica"], "mateo", "agenda"],
      },
    },
  },
};
