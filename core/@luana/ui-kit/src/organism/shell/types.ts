// cap: platform.lift-shell-chrome-ui-kit
import type { ReactNode } from "react";
import type {
  SsrSafeHydration,
  SsrSafePersistedStore,
} from "@luana/hooks/create-ssr-safe-persisted-store";

/**
 * Generic shell organism types — brand-agnostic (T-K1).
 *
 * Naming is generic by contract (RN-2): the kit never references a brand or a
 * supervisor name. The brand injects its catalog + supervisor identity at mount.
 * Zero 'valeria' / 'vitalia' / 'nicolify' tokens live here.
 *
 * Verbatim from 03-arch.md § API contract — organism kit.
 */

// ── Generic agent descriptor (brand injects its catalog) ──────────────────────
export interface ShellAgentDescriptor {
  /** 'lisa' | 'abel' | ... — brand-defined, NOT an enum in the kit. */
  slug: string;
  name: string;
  role: string;
  /**
   * CSS var token name for the agent color, e.g. "agent-lisa". The brand's
   * globals.css defines `--agent-lisa`; the kit references it via the token.
   */
  colorToken: string;
  colorSoftToken: string;
  initial: string;
  /** Avatar: a slot/ReactNode OR an image src — brand decides. */
  avatar?: ReactNode;
  thumbnail?: string;
  tabLabel: string;
  defaultSubtab: string;
}

export interface ShellSubTabMeta {
  id: string;
  label: string;
  /** emoji (parity ribbon catalog) — brand-provided. */
  icon: string;
}

// ── Shell store contract (brand instantiates via createShellStore) ────────────

/** Generic supervisor open state — NOT "valeria*". A=closed (strip) · B=chat (split). */
export type SupervisorOpen = "closed" | "chat";

/** Persisted slice of the shell store (what survives a reload · SC-6). */
export interface ShellPersistedState {
  supervisorOpen: SupervisorOpen;
  splitPct: number | null;
  mobileDrawerOpen: boolean;
}

/** Full shell store state + actions (brand instantiates via createShellStore). */
export interface ShellStoreState extends SsrSafeHydration {
  // ── State ──────────────────────────────────────────────────────────────────
  /** A=closed (collapsed strip) · B=chat (split layout). */
  supervisorOpen: SupervisorOpen;
  /** Additive push panel (machine C) — never restored from persistence (no-clobber). */
  historyOpen: boolean;
  /** null = default (the layout resolves the default split, e.g. 30) · number = user-set %. */
  splitPct: number | null;
  mobileDrawerOpen: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────────
  /** Set the supervisor open state. Setting "closed" forces historyOpen false (RN-5). */
  setSupervisorOpen: (open: SupervisorOpen) => void;
  /** Open the supervisor in chat. Does NOT restore history (RN-6). */
  openSupervisor: () => void;
  /** Collapse the supervisor: closed + history false (RN-6). */
  collapseSupervisor: () => void;
  /** Set history panel state directly. */
  setHistoryOpen: (open: boolean) => void;
  /** Open history: forces supervisorOpen "chat" + historyOpen true (RN-7). */
  openHistory: () => void;
  /** Close history (keeps chat). */
  closeHistory: () => void;
  /** Toggle history (opening forces chat). */
  toggleHistory: () => void;
  /** Set the split percentage (null resets to default). */
  setSplitPct: (pct: number | null) => void;
  /** Set the mobile drawer open state. */
  setMobileDrawerOpen: (open: boolean) => void;
}

/**
 * Generic chat store API the chat sub-tree reads (brand provides the impl;
 * vitalia's is a MOCK conversational store today). Shape is intentionally open
 * here — the chat sub-tree (T-K2) refines it; T-K1 only declares the contract.
 */
export interface ShellChatStoreApi {
  // messages, conversations, status, newConversation, ...
  [key: string]: unknown;
}

/**
 * A bound store carrying the shell state + SSR-safe hydration surface.
 * This is the concrete type returned by `createShellStore` (and consumed by
 * `ShellLayoutProps.useShellStore`) — the `@luana/hooks` persisted-store shape,
 * which extends the zustand hook with `.persist`/`.getState`/`.setState` (RN-8).
 */
export type ShellStore = SsrSafePersistedStore<ShellStoreState>;

/** A generic bound store for the brand-provided chat store (SSR-safe shape). */
export type ShellChatStore = SsrSafePersistedStore<ShellChatStoreApi & SsrSafeHydration>;

// ── Factory options (consumes @luana/hooks/createSsrSafePersistedStore) ───────
export interface CreateShellStoreOptions {
  /** brand passes 'vitalia-shell-state' / 'nicolify-shell-state' (SC-6 compat). */
  storageKey: string;
  /** default 1; brand passes its migrate() if the legacy shape differs. */
  version?: number;
  /** maps a legacy persisted shape into a partial of the generic state. */
  migrate?: (persisted: unknown, version: number) => Partial<ShellStoreState>;
}

// ── Root organism props ───────────────────────────────────────────────────────
export interface ShellLayoutLabels {
  openSupervisor: string;
  collapseSupervisor: string;
  newConversation: string;
  history: string;
  mainContent: string;
}

export interface ShellLayoutProps {
  children: ReactNode;
  // Brand identity (NO defaults that name a brand) ----------------------------
  /** e.g. "Valeria" | "Luana" — REQUIRED, no default. */
  supervisorName: string;
  /** slot; falls back to <initial> circle. */
  supervisorAvatar?: ReactNode;
  /** e.g. "V" | "L". */
  supervisorInitial?: string;
  agentCatalog: ShellAgentDescriptor[];
  /** agent slugs in ribbon order. */
  ribbonOrder: string[];
  subTabsByAgent: Record<string, readonly ShellSubTabMeta[]>;
  shippedStaticSubtabs?: ReadonlySet<string>;
  // Store injection (brand instantiates) -------------------------------------
  useShellStore: ShellStore;
  useChatStore: ShellChatStore;
  // Group/layout persistence keys (SC-6 compat — brand passes its key) --------
  /** e.g. "vitalia-shell-split-agentic". */
  splitGroupId: string;
  // TopBar slots (brand injects Logo/Theme/Tenant) ---------------------------
  /** brand LogoMark. */
  logoSlot: ReactNode;
  /** brand [ThemeToggle][TenantSwitcher]. */
  rightClusterSlot: ReactNode;
  // SSR skeleton (brand provides store-free header) --------------------------
  /** default = neutral inert header. */
  skeletonSlot?: ReactNode;
  // Copy / labels (Spanish neutro — brand may override) ----------------------
  labels?: Partial<ShellLayoutLabels>;
  // Routing helpers (or kit defaults from agentCatalog) ----------------------
  onNavigate?: (href: string) => void;
}

// ── Routing helper options (catalog injected by the brand) ────────────────────
export interface ShellRoutingOptions {
  /** the brand's agent slug-set (membership check). */
  agentSlugs: readonly string[];
  /** non-agent tabs that still route (e.g. "settings"/"config"). */
  specialTabs?: readonly string[];
  /** subtab slugs valid per agent/special-tab. */
  subtabsByAgent: Record<string, readonly string[]>;
}
