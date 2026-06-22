/*
 * Shared demo fixtures for the Shell organism stories (core-ds-foundation T-2).
 *
 * The shell kit is brand-agnostic (RN-2): the brand injects its agent catalog +
 * a getAgentClasses() fn at mount. These fixtures mirror that contract so the
 * color-per-agent rendering (canon §2.8) is visible in Storybook, using the
 * generic agent slugs that .storybook/preview.css defines
 * (agent-alfa / -beta / -supervisora / -valeria / -lisa).
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
} from "../src";
import {
  createSsrSafePersistedStore,
  type SsrSafeHydration,
} from "@luana/hooks/create-ssr-safe-persisted-store";

/** Demo team — a supervisor (Valeria) + specialists, brand-agnostic hues. */
export const DEMO_AGENTS: Record<string, ShellAgentDescriptor> = {
  valeria: {
    slug: "valeria",
    name: "Valeria",
    role: "Coordinadora del equipo",
    colorToken: "agent-valeria",
    colorSoftToken: "agent-valeria-soft",
    initial: "V",
    tabLabel: "Valeria",
    defaultSubtab: "resumen",
  },
  lisa: {
    slug: "lisa",
    name: "Lisa",
    role: "Marca y contenido",
    colorToken: "agent-lisa",
    colorSoftToken: "agent-lisa-soft",
    initial: "L",
    tabLabel: "Lisa",
    defaultSubtab: "marca",
  },
  alfa: {
    slug: "alfa",
    name: "Sofía",
    role: "Agenda y reservas",
    colorToken: "agent-alfa",
    colorSoftToken: "agent-alfa-soft",
    initial: "S",
    tabLabel: "Sofía",
    defaultSubtab: "agenda",
  },
  beta: {
    slug: "beta",
    name: "Diego",
    role: "Captación y leads",
    colorToken: "agent-beta",
    colorSoftToken: "agent-beta-soft",
    initial: "D",
    tabLabel: "Diego",
    defaultSubtab: "leads",
  },
  supervisora: {
    slug: "supervisora",
    name: "Supervisora",
    role: "Supervisión general",
    colorToken: "agent-supervisora",
    colorSoftToken: "agent-supervisora-soft",
    initial: "S",
    tabLabel: "Supervisora",
    defaultSubtab: "resumen",
  },
};

/**
 * Brand-injected class resolver — LITERAL switch (see file header). Returns the
 * Tailwind class bundle the chrome atoms render (accent bg/text/border + soft bg).
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
    case "alfa":
      return {
        accentBg: "bg-agent-alfa",
        softBg: "bg-agent-alfa-soft",
        accentText: "text-agent-alfa",
        accentBorder: "border-agent-alfa",
      };
    case "beta":
      return {
        accentBg: "bg-agent-beta",
        softBg: "bg-agent-beta-soft",
        accentText: "text-agent-beta",
        accentBorder: "border-agent-beta",
      };
    case "supervisora":
      return {
        accentBg: "bg-agent-supervisora",
        softBg: "bg-agent-supervisora-soft",
        accentText: "text-agent-supervisora",
        accentBorder: "border-agent-supervisora",
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

/** A coherent demo conversation (agenda/turnos → delegación a Sofía). */
const SEED_MESSAGES: ShellChatMessage[] = [
  { id: "m1", role: "bot", agent: "valeria", time: "09:14", content: "Buen día. Tienes 3 turnos sin confirmar para hoy." },
  { id: "m2", role: "user", time: "09:15", content: "Confírmalos y avísame si alguno se cae." },
  { id: "m3", role: "delegate", fromAgent: "valeria", toAgent: "alfa", delegateMode: "Mantener" },
  { id: "m4", role: "bot", agent: "alfa", time: "09:15", content: "Confirmé 2 de 3. La paciente de las 16:00 pidió reprogramar; te dejé 3 opciones de horario." },
  { id: "m5", role: "thinking", agent: "valeria", content: "Valeria está preparando el resumen del día…" },
];

function makeDemoChatStore(name: string, seed: ShellChatMessage[]) {
  return createSsrSafePersistedStore<ShellChatStoreApi & SsrSafeHydration>(
    (set, get) => ({
      _hasHydrated: true, // stories treat the store as ready (no useStoreHydration call)
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      messages: seed,
      conversations: SEED_CONVERSATIONS,
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
