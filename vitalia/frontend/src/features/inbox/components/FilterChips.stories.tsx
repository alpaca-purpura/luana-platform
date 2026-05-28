// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
/**
 * FilterChips.stories.tsx — Storybook stories for the conversation filter chip bar.
 *
 * Covers: sin filtros, canal activo, estado activo, helpNeeded/unreadMedia,
 * modo avanzado expandido, múltiples filtros.
 *
 * downstream-regression-na: brand-local story; no cross-brand consumers
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { FilterChips } from "./FilterChips";
import type { FilterChipsValue } from "./FilterChips";

const EMPTY_FILTERS: FilterChipsValue = {
  channel: null,
  status: null,
  stage: null,
  mode: null,
  period: null,
  helpNeeded: null,
  unreadMedia: null,
};

const meta: Meta<typeof FilterChips> = {
  title: "Features/Inbox/FilterChips",
  component: FilterChips,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "vitalia-bg" },
    layout: "padded",
  },
  args: {
    onChange: fn(),
  },
  argTypes: {
    value: {
      description: "Estado actual de todos los filtros (controlado)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof FilterChips>;

export const SinFiltros: Story = {
  name: "Sin filtros (Todas activo)",
  args: { value: EMPTY_FILTERS },
};

export const FiltroCanal: Story = {
  name: "Canal: WhatsApp activo",
  args: {
    value: { ...EMPTY_FILTERS, channel: "whatsapp" },
  },
};

export const FiltroEstado: Story = {
  name: "Estado: Esperando depósito",
  args: {
    value: { ...EMPTY_FILTERS, status: "waiting-deposit" },
  },
};

export const FiltroAyuda: Story = {
  name: "Filtro: Adrián pide ayuda",
  args: {
    value: { ...EMPTY_FILTERS, helpNeeded: true },
  },
};

export const FiltroMultimedia: Story = {
  name: "Filtro: Audio/imagen sin abrir",
  args: {
    value: { ...EMPTY_FILTERS, unreadMedia: true },
  },
};

export const MultipleFiltros: Story = {
  name: "Múltiples filtros activos",
  args: {
    value: {
      channel: "instagram",
      status: "active",
      stage: null,
      mode: null,
      period: null,
      helpNeeded: null,
      unreadMedia: null,
    },
  },
};
