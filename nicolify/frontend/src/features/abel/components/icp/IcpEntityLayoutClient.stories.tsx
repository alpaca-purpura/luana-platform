// cap: abel.icp-buyer
/**
 * IcpEntityLayoutClient.stories.tsx — CSF3 stories para IcpEntityLayoutClient.
 *
 * Muestra el layout EntityWorkspaceLayout de un ICP:
 *   - Barra N3 con leaves "Datos" + buyers + "+ Buyer"
 *   - children slot (contenido del leaf activo)
 *
 * El componente carga useIcp + useBuyers internamente.
 * Las stories pre-cargan esos datos en el cache.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { withSeededQuery } from "../../../../../.storybook/decorators/withQueryClient";
import {
  icpDetalleManual,
  icpDetalleDraft,
  buyerListFixture,
  buyerEmptyFixture,
} from "../../../../../.storybook/fixtures/abel-icp";

import { IcpEntityLayoutClient } from "./IcpEntityLayoutClient";

const meta: Meta<typeof IcpEntityLayoutClient> = {
  title: "Abel/ICP/IcpEntityLayoutClient",
  component: IcpEntityLayoutClient,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    tenantId: { control: "text" },
    icpId: { control: "text" },
    rootHref: { control: "text" },
    rootLabel: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof IcpEntityLayoutClient>;

/** Placeholder de contenido para el children slot */
const LeafContent = () => (
  <div className="p-6 text-sm text-muted-foreground">
    Contenido del leaf activo (IcpDatosForm / BuyerLeafForm)
  </div>
);

/**
 * ICP listo con dos buyers — barra N3 completa.
 */
export const ConDosbuyers: Story = {
  args: {
    tenantId: "tenant-uuid-storybook-00000001",
    icpId: icpDetalleManual.id,
    rootHref: "/tenant-uuid-storybook-00000001/abel/icp",
    rootLabel: "ICP y Buyers",
    children: <LeafContent />,
  },
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "icp", icpDetalleManual.id], icpDetalleManual);
      qc.setQueryData(["abel", "buyers", icpDetalleManual.id, "list"], buyerListFixture);
    }),
  ],
};

/**
 * ICP borrador sin buyers — solo hoja "Datos" + affordance "+ Buyer".
 */
export const BorradorSinBuyers: Story = {
  args: {
    tenantId: "tenant-uuid-storybook-00000001",
    icpId: icpDetalleDraft.id,
    rootHref: "/tenant-uuid-storybook-00000001/abel/icp",
    rootLabel: "ICP y Buyers",
    children: <LeafContent />,
  },
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "icp", icpDetalleDraft.id], icpDetalleDraft);
      qc.setQueryData(["abel", "buyers", icpDetalleDraft.id, "list"], buyerEmptyFixture);
    }),
  ],
};
