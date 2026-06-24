import type { Meta, StoryObj } from "@storybook/nextjs";

import { TenantOption } from "../src";

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

const TENANT_LIMA = { id: "sonrisa-plena", name: "Sonrisa Plena", city: "Lima" };
const TENANT_CDMX = { id: "dermalia-mx", name: "Dermalia MX", city: "CDMX" };
const TENANT_NO_CITY = { id: "studio-digital", name: "Studio Digital" };

const meta = {
  title: "Shell/TenantOption",
  component: TenantOption,
  args: {
    pickPaletteColor: demoPaletteColor,
    activeLabel: "Espacio activo",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Row molecule for tenant picker dropdowns. " +
          "Composes TenantBadge + name/city column + active Check indicator. " +
          "Palette and active sr-only label are brand-injected.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64 rounded-md border border-border bg-popover p-1">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TenantOption>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
  args: {
    tenant: TENANT_LIMA,
    active: false,
  },
};

export const Active: Story = {
  args: {
    tenant: TENANT_LIMA,
    active: true,
  },
};

export const ActiveClinica: Story = {
  name: "Active — vitalia label",
  args: {
    tenant: TENANT_CDMX,
    active: true,
    activeLabel: "Clínica activa",
  },
};

export const ActiveAgencia: Story = {
  name: "Active — nicolify label",
  args: {
    tenant: TENANT_CDMX,
    active: true,
    activeLabel: "Agencia activa",
  },
};

export const NoCityInactive: Story = {
  name: "No city — inactive",
  args: {
    tenant: TENANT_NO_CITY,
    active: false,
  },
};

export const NoCityActive: Story = {
  name: "No city — active",
  args: {
    tenant: TENANT_NO_CITY,
    active: true,
  },
};

export const TenantList: Story = {
  name: "List of 3 options",
  render: (args) => (
    <div className="flex flex-col">
      <TenantOption
        {...args}
        tenant={TENANT_LIMA}
        active={true}
        activeLabel="Espacio activo"
      />
      <TenantOption {...args} tenant={TENANT_CDMX} active={false} />
      <TenantOption {...args} tenant={TENANT_NO_CITY} active={false} />
    </div>
  ),
  args: {
    tenant: TENANT_LIMA,
    active: true,
  },
};
