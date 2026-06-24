import type { Meta, StoryObj } from "@storybook/nextjs";

import { TenantBadge } from "../src";

// ── Synthetic palette (mimics vitalia cyan/purple palette — brand-injected in real usage) ──

const DEMO_PALETTE = [
  { bg: "bg-cyan-500", text: "text-cyan-950" },
  { bg: "bg-purple-500", text: "text-white" },
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-amber-950" },
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-indigo-500", text: "text-white" },
];

function demoPaletteColor(tenantId: string) {
  const idx = tenantId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return DEMO_PALETTE[idx % DEMO_PALETTE.length]!;
}

const meta = {
  title: "Shell/TenantBadge",
  component: TenantBadge,
  args: {
    pickPaletteColor: demoPaletteColor,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Rounded badge showing tenant initials (2-char). " +
          "Palette injected by brand via `pickPaletteColor` prop — no brand coupling in the kit.",
      },
    },
  },
} satisfies Meta<typeof TenantBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SonrisaPlena: Story = {
  args: {
    tenant: { id: "sonrisa-plena", name: "Sonrisa Plena", city: "Lima" },
  },
};

export const DermaliaMX: Story = {
  args: {
    tenant: { id: "dermalia-mx", name: "Dermalia MX", city: "CDMX" },
  },
};

export const AgenciaVerde: Story = {
  args: {
    tenant: { id: "agencia-verde", name: "Agencia Verde", city: "Bogotá" },
  },
};

export const SingleWordName: Story = {
  name: "Single-word name (1 initial)",
  args: {
    tenant: { id: "vitalia-test", name: "Vitalia", city: "Lima" },
  },
};

export const EmptyName: Story = {
  name: "Empty name (fallback ?)",
  args: {
    tenant: { id: "empty-test", name: "", city: "Lima" },
  },
};

export const NoCityField: Story = {
  name: "No city (optional field)",
  args: {
    tenant: { id: "no-city", name: "Studio Digital" },
  },
};

export const CustomClassName: Story = {
  name: "Custom size via className",
  args: {
    tenant: { id: "custom-size", name: "Gran Empresa", city: "Santiago" },
    className: "size-10 text-base",
  },
};
