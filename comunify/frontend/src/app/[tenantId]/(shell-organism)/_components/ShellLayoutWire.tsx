// cap: comunify-shell-organism
"use client";
/**
 * ShellLayoutWire.tsx — T-shell: mounts @luana/ui-kit ShellLayout with
 * comunify brand props (catalog, store, testIds, slots).
 *
 * Port from nicolify ShellLayoutWire.tsx, re-themed to Comunify cast:
 *   Supervisor: Luana (slug='luana')
 *   Ribbon: nina / tomas / sofia / bruno / lucia / plataforma (config)
 *
 * Bridge pattern: client component required for usePathname() + zustand hooks.
 *
 * splitGroupId = 'comunify-shell-split'
 * storageKey 'comunify-shell-state' via useShellStoreKit (shell-store.ts).
 *
 * No Clerk Organizations — per MEMORY.md::no-clerk-organizations (arch-test gate).
 * downstream-regression-na: brand-local layout; no cross-brand consumers.
 */

import {
  ShellLayout,
  type AgentClassBundle,
  type ShellAgentDescriptor,
  type ShellChatStore,
  type ShellTestIds,
} from "@luana/ui-kit";
import { usePathname } from "next/navigation";

import {
  agentBgClass,
  agentBgSoftClass,
  agentTextClassSubTab,
  agentBorderClass,
} from "@/components/shared/shell-organism/_agent-tw-classes";
import { LogoMark } from "@/components/shared/shell-organism/LogoMark";
import { TenantSwitcher } from "@/components/shared/shell-organism/TenantSwitcher";
import { ThemeToggle } from "@/components/shared/shell-organism/ThemeToggle";
import { AGENT_CATALOG as FULL_AGENT_CATALOG, type AgentSlug } from "@/lib/agents";
import {
  AGENT_CATALOG as RIBBON_AGENT_CATALOG,
  AGENT_RIBBON_ORDER,
  AGENT_SUBTABS,
  type RibbonTabSlug,
} from "@/lib/routing/shell-routes";
import { useChatStore } from "@/stores/chat-store";
import { useShellStoreKit } from "@/stores/shell-store";

import type { ReactNode } from "react";

// ── getAgentClasses — brand-injected function (kit AgentClassBundle) ────────────

/**
 * Maps a comunify agent slug → AgentClassBundle consumed by kit chrome atoms
 * (Ribbon active pill, avatar ring, hover states, border accents).
 *
 * Slug typed as `string` (kit contract) — unknown slugs fall back to luana.
 * G3 gate: uses JIT-safe switch via _agent-tw-classes.ts.
 */
function getAgentClasses(slug: string): AgentClassBundle {
  // Validate slug is a known ribbon or supervisor agent — fall back to luana
  const ribbonSlugs: string[] = ["nina", "tomas", "sofia", "bruno", "lucia", "plataforma"];
  const supervisorSlug = "luana";
  const allSlugs = [...ribbonSlugs, supervisorSlug];
  const s = allSlugs.includes(slug) ? (slug as AgentSlug) : "luana";

  const ribbonSlug: RibbonTabSlug = s === "luana" ? "nina" : (s as RibbonTabSlug);
  return {
    accentBg: agentBgClass(s),
    softBg: agentBgSoftClass(s),
    accentText: agentTextClassSubTab(ribbonSlug),
    accentBorder: agentBorderClass(ribbonSlug),
  };
}

// ── ShellAgentDescriptor[] — ribbon agents from shell-routes AGENT_CATALOG ──────

/**
 * Ribbon agent descriptors — built from shell-routes AGENT_CATALOG.
 * Luana (supervisor) is handled separately via supervisorName/supervisorSlug props.
 */
const RIBBON_AGENT_CATALOG_ARRAY: ShellAgentDescriptor[] = Object.values(
  RIBBON_AGENT_CATALOG,
).map((desc) => {
  const fullDesc = FULL_AGENT_CATALOG[desc.slug as AgentSlug];
  return {
    slug: desc.slug,
    name: desc.name,
    role: fullDesc?.role ?? "",
    colorToken: fullDesc?.colorToken ?? `agent-${desc.slug}`,
    colorSoftToken: fullDesc?.colorSoftToken ?? `agent-${desc.slug}-soft`,
    initial: fullDesc?.initial ?? desc.name.charAt(0).toUpperCase(),
    thumbnail: fullDesc?.thumbnail ?? `/agents/${desc.slug}/avatar.svg`,
    tabLabel: desc.tabLabel,
    defaultSubtab: desc.defaultSubtab,
  };
});

// ── Ribbon order (string[] from const tuple) ─────────────────────────────────────

const RIBBON_ORDER: string[] = [...AGENT_RIBBON_ORDER, "plataforma"];

// ── subTabsByAgent — convert AGENT_SUBTABS (RibbonTabSlug keys) to string keys ──

const SUB_TABS_BY_AGENT: Record<
  string,
  readonly { id: string; label: string; icon: string }[]
> = Object.fromEntries(
  Object.entries(AGENT_SUBTABS).map(([slug, tabs]) => [slug, tabs]),
);

// ── Slots ────────────────────────────────────────────────────────────────────────

const LOGO_SLOT: ReactNode = (
  <>
    <LogoMark variant="full" size="md" className="hidden lg:inline-flex" />
    <LogoMark variant="mark" size="md" className="inline-flex lg:hidden" />
  </>
);

const RIGHT_CLUSTER_SLOT: ReactNode = (
  <>
    <ThemeToggle />
    <TenantSwitcher />
  </>
);

// ── testIds ───────────────────────────────────────────────────────────────────────

const TEST_IDS: ShellTestIds = {
  supervisorSidebar: "luana-sidebar",
  supervisorCollapsedStrip: "luana-collapsed-strip",
  supervisorDrawerBackdrop: "luana-drawer-backdrop",
  supervisorDrawerClose: "luana-drawer-close",
  chat: "luana-chat",
  chatHeader: "chat-header",
  chatModePill: "chat-mode-pill",
};

// ── Wire component ───────────────────────────────────────────────────────────────

interface ShellLayoutWireProps {
  children: ReactNode;
}

/**
 * Thin client bridge: provides `pathname` (requires usePathname hook) + wires
 * all comunify brand props into @luana/ui-kit ShellLayout.
 *
 * Kit hydrates shell store internally in its ssr:false chunk.
 * No PHI — no HIPAA requirements for comunify.
 */
export function ShellLayoutWire({ children }: ShellLayoutWireProps) {
  const pathname = usePathname();

  // NOTE: Future data-layer ticket will wire auth context injection (useChatStore.setAuthContext).
  // Kit hydrates the shell store internally in its ssr:false chunk.

  return (
    <ShellLayout
      supervisorName="Luana"
      supervisorSlug="luana"
      supervisorThumbnail={FULL_AGENT_CATALOG.luana.thumbnail}
      supervisorInitial="L"
      agentCatalog={RIBBON_AGENT_CATALOG_ARRAY}
      ribbonOrder={RIBBON_ORDER}
      subTabsByAgent={SUB_TABS_BY_AGENT}
      getAgentClasses={getAgentClasses}
      useShellStore={useShellStoreKit}
      // comunify useChatStore is a plain zustand store (not SsrSafePersistedStore).
      // Type-cast: StoreApi<ChatStore> → ShellChatStore (SsrSafePersistedStore).
      // Safe: kit only reads messages/status/sendMessage — no .persist call.
      useChatStore={useChatStore as unknown as ShellChatStore}
      splitGroupId="comunify-shell-split"
      logoSlot={LOGO_SLOT}
      rightClusterSlot={RIGHT_CLUSTER_SLOT}
      testIds={TEST_IDS}
      pathname={pathname}
      configTabSlug="plataforma"
      configTabLabel="Plataforma"
    >
      {children}
    </ShellLayout>
  );
}
