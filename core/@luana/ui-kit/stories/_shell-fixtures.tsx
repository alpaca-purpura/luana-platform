/*
 * Shared demo fixtures for the Shell organism stories (core-ds-foundation T-2).
 *
 * The shell kit is brand-agnostic (RN-2): the brand injects its agent catalog +
 * a getAgentClasses() fn at mount. These fixtures mirror that contract using the
 * REAL vitalia 6-agent catalog (Valeria supervisor + Lisa/Mateo/Adrián/Lucas/Camila),
 * so the catalog renders as close to production as possible — names, roles, colors
 * (preview.css mirrors vitalia globals.css), sub-tabs and real avatar thumbnails
 * (served at /sb-assets). This is DEMO data in stories/, NOT kit src (RN-2 intact).
 *
 * ★ getAgentClasses MUST return LITERAL class strings (a switch, never a
 *   template like `bg-agent-${slug}`). Tailwind v4 JIT only emits classes it
 *   sees verbatim; a constructed string purges to nothing (gray/black render —
 *   the same trap as the chart-black bug). These literals live under stories/,
 *   scanned via `@source "../stories"` in preview.css. Mirrors why vitalia's
 *   real _agent-tw-classes.ts uses a literal switch.
 *
 * NOT a *.stories.* file → ignored by the story glob, imported by the stories.
 */

import {
  createShellStore,
  type AgentClassBundle,
  type ShellAgentDescriptor,
  type ShellChatMessage,
  type ShellChatStoreApi,
  type ShellConversationMeta,
  type ShellSubTabMeta,
  type ShellSubSubTabMeta,
} from "../src";
import {
  createSsrSafePersistedStore,
  type SsrSafeHydration,
} from "@luana/hooks/create-ssr-safe-persisted-store";

/**
 * Real Vitalia team — supervisor (Valeria) + 5 ribbon specialists. Mirrors
 * vitalia/frontend/src/lib/agent-catalog.ts (names, roles, colorTokens, tabLabels,
 * defaultSubtab) + real avatar thumbnails (served at /sb-assets via staticDirs) so
 * the catalog renders as close to production as possible. The kit itself stays
 * brand-agnostic (RN-2) — this is DEMO data in stories/, not src.
 */
export const DEMO_AGENTS: Record<string, ShellAgentDescriptor> = {
  valeria: {
    slug: "valeria",
    name: "Valeria",
    role: "Tu secretaria virtual · coordinadora general",
    colorToken: "agent-valeria",
    colorSoftToken: "agent-valeria-soft",
    initial: "V",
    thumbnail: "/sb-assets/agents/valeria/thumbnail.png",
    tabLabel: "Valeria",
    defaultSubtab: "agenda",
  },
  lisa: {
    slug: "lisa",
    name: "Lisa",
    role: "Estratega de marca y oferta",
    colorToken: "agent-lisa",
    colorSoftToken: "agent-lisa-soft",
    initial: "L",
    thumbnail: "/sb-assets/agents/lisa/thumbnail.png",
    tabLabel: "Mi Clínica",
    defaultSubtab: "marca",
  },
  mateo: {
    slug: "mateo",
    name: "Mateo",
    role: "Operaciones · agenda y pacientes del día",
    colorToken: "agent-mateo",
    colorSoftToken: "agent-mateo-soft",
    initial: "M",
    thumbnail: "/sb-assets/agents/mateo/thumbnail.png",
    tabLabel: "Atender",
    defaultSubtab: "agenda",
  },
  adrian: {
    slug: "adrian",
    name: "Adrián",
    role: "Closer · califica leads y reactiva oportunidades",
    colorToken: "agent-adrian",
    colorSoftToken: "agent-adrian-soft",
    initial: "A",
    thumbnail: "/sb-assets/agents/adrian/thumbnail.png",
    tabLabel: "Vender",
    defaultSubtab: "inbox",
  },
  lucas: {
    slug: "lucas",
    name: "Lucas",
    role: "Estratega Growth · viraliza y consigue leads",
    colorToken: "agent-lucas",
    colorSoftToken: "agent-lucas-soft",
    initial: "L",
    thumbnail: "/sb-assets/agents/lucas/thumbnail.png",
    tabLabel: "Atraer",
    defaultSubtab: "lanzar",
  },
  camila: {
    slug: "camila",
    name: "Camila",
    role: "Fidelización · sube CLTV y monitorea satisfacción",
    colorToken: "agent-camila",
    colorSoftToken: "agent-camila-soft",
    initial: "C",
    thumbnail: "/sb-assets/agents/camila/thumbnail.png",
    tabLabel: "Mantener",
    defaultSubtab: "voz",
  },
};

/**
 * Brand-injected class resolver — LITERAL switch (see file header). Returns the
 * Tailwind class bundle the chrome atoms render. Mirrors vitalia's getAgentClasses:
 * accentText uses the SubTab contrast exceptions (mateo/lucas → text-foreground,
 * because yellow/near-black fail WCAG AA on their own -soft bg).
 */
export function getDemoAgentClasses(slug: string): AgentClassBundle {
  switch (slug) {
    case "lisa":
      return {
        accentBg: "bg-agent-lisa",
        softBg: "bg-agent-lisa-soft",
        accentText: "text-agent-lisa",
        accentBorder: "border-agent-lisa",
      };
    case "mateo":
      return {
        accentBg: "bg-agent-mateo",
        softBg: "bg-agent-mateo-soft",
        // #FEE209 yellow on its soft bg fails AA → text-foreground (vitalia D20).
        accentText: "text-foreground",
        accentBorder: "border-agent-mateo",
      };
    case "adrian":
      return {
        accentBg: "bg-agent-adrian",
        softBg: "bg-agent-adrian-soft",
        accentText: "text-agent-adrian",
        accentBorder: "border-agent-adrian",
      };
    case "lucas":
      return {
        accentBg: "bg-agent-lucas",
        softBg: "bg-agent-lucas-soft",
        // #111111 near-black on its soft bg fails AA → text-foreground (vitalia D18).
        accentText: "text-foreground",
        accentBorder: "border-agent-lucas",
      };
    case "camila":
      return {
        accentBg: "bg-agent-camila",
        softBg: "bg-agent-camila-soft",
        accentText: "text-agent-camila",
        accentBorder: "border-agent-camila",
      };
    case "valeria":
    default:
      return {
        accentBg: "bg-agent-valeria",
        softBg: "bg-agent-valeria-soft",
        accentText: "text-agent-valeria",
        accentBorder: "border-agent-valeria",
      };
  }
}

/* ── Demo stores (chat sub-tree stories) ───────────────────────────────────────
 *
 * The chat components read injected stores (the kit never imports brand stores).
 * These demo stores mirror the brand contract:
 *   - shell store: the REAL kit createShellStore (historyOpen / collapse / toggle).
 *   - chat store: createSsrSafePersistedStore<ShellChatStoreApi> — same factory the
 *     real stores use, seeded in-memory.
 *
 * ★ We never call useStoreHydration on them → the factory's skipHydration keeps them
 *   at the seed (zero localStorage writes, seed stable on every Storybook load). That's
 *   exactly what a catalog wants: deterministic demo state, no persistence bleed.
 */

/** Demo shell store — drives ChatHeader's history/collapse buttons. */
export const useDemoShellStore = createShellStore({
  storageKey: "sb-demo-shell",
  version: 1,
});

const SEED_CONVERSATIONS: ShellConversationMeta[] = [
  { id: "c1", title: "Turnos de hoy", meta: "5 mensajes", group: "today" },
  { id: "c2", title: "Reprogramar control nutrición", meta: "3 mensajes", group: "yesterday" },
  { id: "c3", title: "Campaña blanqueamiento", meta: "8 mensajes", group: "this_week" },
];

/** A coherent demo conversation (agenda/turnos → delegación a Mateo·Atender). */
const SEED_MESSAGES: ShellChatMessage[] = [
  { id: "m1", role: "bot", agent: "valeria", time: "09:14", content: "Buen día. Tienes 3 turnos sin confirmar para hoy." },
  { id: "m2", role: "user", time: "09:15", content: "Confírmalos y avísame si alguno se cae." },
  { id: "m3", role: "delegate", fromAgent: "valeria", toAgent: "mateo", delegateMode: "Mantener" },
  { id: "m4", role: "bot", agent: "mateo", time: "09:15", content: "Confirmé 2 de 3. La paciente de las 16:00 pidió reprogramar; te dejé 3 opciones de horario." },
  { id: "m5", role: "thinking", agent: "valeria", content: "Valeria está preparando el resumen del día…" },
];

function makeDemoChatStore(
  name: string,
  seed: ShellChatMessage[],
  convos: ShellConversationMeta[] = SEED_CONVERSATIONS,
) {
  return createSsrSafePersistedStore<ShellChatStoreApi & SsrSafeHydration>(
    (set, get) => ({
      _hasHydrated: true, // stories treat the store as ready (no useStoreHydration call)
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      messages: seed,
      conversations: convos,
      activeAgent: "valeria",
      status: "idle",
      sendMessage: (content) =>
        set({
          messages: [
            ...get().messages,
            { id: `u${get().messages.length}`, role: "user", content, time: "ahora" },
          ],
        }),
      clearMessages: () => set({ messages: [] }),
      newConversation: () => set({ messages: [] }),
      setActiveAgent: (activeAgent) => set({ activeAgent }),
    }),
    { name, version: 1, partialize: () => ({}) },
  );
}

/** Seeded demo chat (a full conversation) + an empty one (empty state). */
export const useDemoChatStore = makeDemoChatStore("sb-demo-chat", SEED_MESSAGES);
export const useDemoChatStoreEmpty = makeDemoChatStore("sb-demo-chat-empty", []);
/** No archived conversations — for the SupervisorHistory empty state (SC-13). */
export const useDemoChatStoreNoConvos = makeDemoChatStore("sb-demo-no-convos", [], []);

/* ── Nav fixtures (Ribbon / SubTabsBar / SubSubTabsBar) ─────────────────────── */

/**
 * Ribbon order — the REAL vitalia order (Valeria is the supervisor sidebar, NOT a
 * ribbon tab), value-chain order: Mi Clínica · Atraer · Vender · Atender · Mantener
 * → [lisa, lucas, adrian, mateo, camila]. Mirrors AGENT_RIBBON_ORDER.
 */
export const DEMO_RIBBON_ORDER: string[] = ["lisa", "lucas", "adrian", "mateo", "camila"];
/** Ribbon-only catalog (5 agents, in ribbon order) — what the Ribbon iterates. */
export const DEMO_AGENTS_ARRAY: ShellAgentDescriptor[] = DEMO_RIBBON_ORDER.map(
  (slug) => DEMO_AGENTS[slug],
);
/**
 * FULL catalog (all 6, supervisor first) — what ShellLayout/AppPanelSlot pass as
 * `agentCatalog`. The supervisor (Valeria) is NOT in the ribbon but MUST be in the
 * catalog: ShellLayoutClient looks her up by supervisorSlug for the chat panel
 * (`agentCatalog.find(slug==="valeria") ?? agentCatalog[0]` — without her it falls
 * back to the first ribbon agent). Mirrors vitalia (agentCatalog=6, ribbonOrder=5).
 */
export const DEMO_AGENTS_ALL: ShellAgentDescriptor[] = [
  DEMO_AGENTS.valeria,
  ...DEMO_AGENTS_ARRAY,
];

/**
 * Sub-tabs per agent (N2) — REAL vitalia RIBBON_SUBTABS (names + emoji icons).
 * 5 ribbon agents; Valeria has none (sidebar-only).
 */
export const DEMO_SUBTABS_BY_AGENT: Record<string, ShellSubTabMeta[]> = {
  lisa: [
    { id: "marca", label: "Marca", icon: "🏥" },
    { id: "staff", label: "Staff", icon: "👨‍⚕️" },
    { id: "servicios", label: "Servicios", icon: "🩺" },
    { id: "compliance", label: "Compliance", icon: "🛡️" },
  ],
  mateo: [
    { id: "agenda", label: "Agenda", icon: "📆" },
    { id: "pacientes", label: "Pacientes", icon: "👥" },
  ],
  adrian: [
    { id: "inbox", label: "Inbox", icon: "💬" },
    { id: "embudo", label: "Embudo", icon: "🎯" },
    { id: "recuperar", label: "Recuperar", icon: "🧊" },
    { id: "outbound", label: "Outbound", icon: "📣" },
    { id: "propuestas", label: "Propuestas", icon: "💼" },
  ],
  lucas: [
    { id: "lanzar", label: "Lanzar", icon: "🚀" },
    { id: "envuelo", label: "En vuelo", icon: "📡" },
    { id: "recursos", label: "Recursos", icon: "📚" },
    { id: "resultados", label: "Resultados", icon: "📈" },
    { id: "mercado", label: "Mercado", icon: "🌍" },
  ],
  camila: [
    { id: "voz", label: "Voz del paciente", icon: "🎤" },
    { id: "reactivar", label: "Reactivar", icon: "🪃" },
    { id: "multiplicar", label: "Multiplicar", icon: "🤝" },
    { id: "reputacion", label: "Reputación", icon: "📊" },
  ],
};

/**
 * Sub-sub-tabs por "agent.subtab" (N3-static) — REAL vitalia AGENT_SUBSUBTABS.
 * lisa.marca · lisa.servicios · config.cuenta.
 */
export const DEMO_SUBSUBTABS_BY_KEY: Record<string, ShellSubSubTabMeta[]> = {
  "lisa.marca": [
    { id: "identidad", label: "Identidad", icon: "🏥" },
    { id: "voz-y-tono", label: "Voz y tono", icon: "🎙️" },
    { id: "presencia", label: "Presencia", icon: "📍" },
  ],
  "lisa.servicios": [
    { id: "catalogo", label: "Catálogo", icon: "📋" },
    { id: "escalera", label: "Escalera", icon: "🪜" },
  ],
  "config.cuenta": [
    { id: "datos", label: "Datos", icon: "🏢" },
    { id: "preferencias", label: "Preferencias", icon: "⚙️" },
    { id: "responsable", label: "Responsable", icon: "🔐" },
  ],
};

/**
 * ★ Build a clean subTabsByAgent Record — keyed ONLY by real slugs.
 *
 * MUST be a function, NOT an exported object: react-docgen-typescript stamps
 * `displayName` + `__docgenInfo` as enumerable props on every exported OBJECT, so
 * an exported Record gets phantom keys → `Object.entries(...)` (which SubTabsBar
 * does) → `tabs.map is not a function`. The caller assigns the RESULT to a local
 * (non-exported) const, which is never stamped. ShellLayout/AppPanelSlot pass THIS.
 */
export function buildCleanSubtabs(): Record<string, ShellSubTabMeta[]> {
  return Object.fromEntries(
    DEMO_RIBBON_ORDER.map((slug) => [slug, DEMO_SUBTABS_BY_AGENT[slug]]),
  );
}

/* ── Brand slots (logo / right cluster) — what a brand injects into TopBarShell ── */

/**
 * DemoLogo — the REAL vitalia brand logo (served at /sb-assets/brand via staticDirs)
 * with a CSS-only light/dark swap, mirroring vitalia's LogoMark atom. A brand injects
 * its own logo as `logoSlot`; here the catalog shows the production mark so the TopBar
 * reads like the real app. Plain <img> (not next/image) — simplest for the catalog.
 */
export function DemoLogo() {
  return (
    <span className="inline-flex items-center" aria-label="Clínica Demo inicio">
      <img
        src="/sb-assets/brand/vitalia-logo.png"
        alt=""
        className="block h-8 w-auto dark:hidden"
      />
      <img
        src="/sb-assets/brand/vitalia-logo-dark.png"
        alt=""
        className="hidden h-8 w-auto dark:block"
      />
    </span>
  );
}
