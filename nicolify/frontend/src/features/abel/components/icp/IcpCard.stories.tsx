// cap: abel.icp-buyer
/**
 * IcpCard.stories.tsx — CSF3 stories para IcpCard.
 *
 * Storybook auto-mockea useParams via parameters.nextjs.appDirectory: true
 * (declarado en .storybook/preview.ts) — sin necesidad de decorator extra.
 *
 * Variantes: estado borrador, estado listo, sin vertical, sin buyers.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { icpBorrador, icpListo, icpSinBuyers } from "../../../../../.storybook/fixtures/abel-icp";

import { IcpCard } from "./IcpCard";

const meta: Meta<typeof IcpCard> = {
  title: "Abel/ICP/IcpCard",
  component: IcpCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    icp: {
      description: "Datos del perfil de cliente ideal (IcpListItem)",
    },
    className: {
      control: "text",
      description: "Clase CSS adicional",
    },
  },
  decorators: [
    (Story) => (
      <div className="grid grid-cols-1 gap-4 max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof IcpCard>;

/** ICP en estado Listo con 2 buyers y vertical definida. */
export const EstadoListo: Story = {
  args: {
    icp: icpListo,
  },
};

/** ICP en estado Borrador — badge gris. */
export const EstadoBorrador: Story = {
  args: {
    icp: icpBorrador,
  },
};

/** ICP sin buyers configurados aún. */
export const SinBuyers: Story = {
  args: {
    icp: icpSinBuyers,
  },
};

/** ICP sin vertical — el subtítulo no aparece. */
export const SinVertical: Story = {
  args: {
    icp: {
      ...icpListo,
      vertical: null,
    },
  },
};

/** Label largo — se corta con ellipsis. */
export const LabelLargo: Story = {
  args: {
    icp: {
      ...icpBorrador,
      label:
        "Agencias de marketing digital especializadas en generación de demanda para SaaS B2B LatAm con retainer mensual recurrente",
    },
  },
};

/** Grid de tres cards para ver el comportamiento en listado. */
export const Grilla: Story = {
  decorators: [
    (Story) => (
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <IcpCard icp={icpListo} />
      <IcpCard icp={icpBorrador} />
      <IcpCard icp={icpSinBuyers} />
    </>
  ),
};
