// cap: shell-organism.shell-nicolify
// story-origin: platform-lift-shell-chrome-ui-kit T-N1
"use client";
/**
 * ShellLayoutWire.tsx — T-N1 re-wire: mounts @luana/ui-kit ShellLayout with
 * nicolify brand props (catalog, store, testIds, slots).
 *
 * Re-themed from vitalia ShellLayoutWire.tsx (Valeria/vitalia → Luana/nicolify).
 *
 * Bridge pattern: replaces ShellOrganismLayout (deleted in T-N1).
 * Client component (required): calls usePathname() + useShellStoreKit (zustand).
 *
 * SC-6: splitGroupId = 'nicolify-shell-split' + storageKey 'nicolify-shell-state'
 * conserved via useShellStoreKit (shell-store.ts).
 *
 * Supervisor: Luana (slug='luana'). Ribbon: abel/brenda/christian/sara/norvil/config.
 *
 * No HIPAA — nicolify has no PHI. No Clerk Organizations.
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
} from "@/components/shared/shell-organism/_agent-tw-classes";
import { LogoMark } from "@/components/shared/shell-organism/LogoMark";
import { TenantSwitcher } from "@/components/shared/shell-organism/TenantSwitcher";
import { ThemeToggle } from "@/components/shared/shell-organism/ThemeToggle";
import { AGENT_CATALOG as FULL_AGENT_CATALOG, type AgentSlug } from "@/lib/agent-catalog";
import {
  AGENT_CATALOG as RIBBON_AGENT_CATALOG,
  AGENT_RIBBON_ORDER,
  AGENT_SUBTABS,
  type RibbonTabSlug,
} from "@/lib/routing/shell-routes";
import { useChatStore } from "@/stores/chat-store";
import { useShellStoreKit } from "@/stores/shell-store";

import type { ReactNode } from "react";

// ── Agent border class (JIT-static switch — Tailwind v4 requires literal strings) ────

/**
 * Per-agent accent border class.
 * CRITICAL: Tailwind v4 JIT purges dynamic class names — explicit switch only.
 */
function agentBorderClass(slug: AgentSlug): string {
  switch (slug) {
    case "abel":
      return "border-agent-abel";
    case "brenda":
      return "border-agent-brenda";
    case "christian":
      return "border-agent-christian";
    case "sara":
      return "border-agent-sara";
    case "norvil":
      return "border-agent-norvil";
    case "luana":
      return "border-agent-luana";
    default:
      return "border-agent-luana";
  }
}

// ── getAgentClasses — brand-injected function (kit AgentClassBundle) ────────────

/**
 * Maps a nicolify agent slug → AgentClassBundle consumed by kit chrome atoms
 * (Ribbon active pill, avatar ring, hover states, border accents).
 *
 * Slug typed as `string` (kit contract) — unknown slugs fall back to luana.
 * G3 gate (ADR-nicolify-001): uses JIT-safe switch via _agent-tw-classes.ts.
 */
function getAgentClasses(slug: string): AgentClassBundle {
  // Validate slug is a known ribbon or supervisor agent — fall back to luana
  const ribbonSlugs: string[] = ["abel", "brenda", "christian", "sara", "norvil", "config"];
  const supervisorSlug = "luana";
  const allSlugs = [...ribbonSlugs, supervisorSlug];
  const s = allSlugs.includes(slug) ? (slug as AgentSlug) : "luana";

  // agentTextClassSubTab handles WCAG AA contrast for each agent
  const ribbonSlug: RibbonTabSlug = s === "luana" ? "abel" : s;
  return {
    accentBg: agentBgClass(s),
    softBg: agentBgSoftClass(s),
    accentText: agentTextClassSubTab(ribbonSlug),
    accentBorder: agentBorderClass(s),
  };
}

// ── ShellAgentDescriptor[] — ribbon agents from shell-routes AGENT_CATALOG ──────

/**
 * Ribbon agent descriptors — built from shell-routes AGENT_CATALOG.
 * Luana (supervisor) is handled separately via supervisorName/supervisorSlug props.
 */
const RIBBON_AGENT_CATALOG_ARRAY: ShellAgentDescriptor[] = Object.values(RIBBON_AGENT_CATALOG).map(
  (desc) => {
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
  },
);

// ── Ribbon order (string[] from const tuple) ─────────────────────────────────────

const RIBBON_ORDER: string[] = [...AGENT_RIBBON_ORDER, "config"];

// ── subTabsByAgent — convert AGENT_SUBTABS (RibbonTabSlug keys) to string keys ──

const SUB_TABS_BY_AGENT: Record<string, readonly { id: string; label: string; icon: string }[]> =
  Object.fromEntries(Object.entries(AGENT_SUBTABS).map(([slug, tabs]) => [slug, tabs]));

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

// ── testIds — nicolify uses kit defaults (no legacy e2e suite to preserve) ──────

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
 * all nicolify brand props into @luana/ui-kit ShellLayout.
 *
 * ADR-vitalia-006 lesson (applied): kit hydrates shell store (inside ssr:false chunk).
 * Tenant store not wired yet in R0 — T-3+ will add useStoreHydration(useTenantStore).
 */
export function ShellLayoutWire({ children }: ShellLayoutWireProps) {
  const pathname = usePathname();

  // NOTE T-3+: add useStoreHydration(useTenantStore) here once tenant-store is wired
  // (TenantSwitcher is a R0 skeleton — ADR comment "T-3+ will wire useTenantStore").
  // Kit hydrates the shell store internally in its ssr:false chunk; no hydration needed here.

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
      // nicolify useChatStore is a plain zustand store (not SsrSafePersistedStore).
      // Kit only reads messages/status/sendMessage — no .persist call.
      // Type-cast: StoreApi<ChatStore> → ShellChatStore (SsrSafePersistedStore).
      // Safe: kit only reads messages/status/sendMessage — no .persist call.
      useChatStore={useChatStore as unknown as ShellChatStore}
      splitGroupId="nicolify-shell-split"
      logoSlot={LOGO_SLOT}
      rightClusterSlot={RIGHT_CLUSTER_SLOT}
      testIds={TEST_IDS}
      pathname={pathname}
      configTabSlug="config"
      configTabLabel="Configurar"
    >
      {children}
    </ShellLayout>
  );
}
