// cap: abel.icp-buyer
/**
 * IcpDatosForm.stories.tsx — CSF3 stories para IcpDatosForm.
 *
 * El form requiere: icpId + icp (Icp) + buyers (BuyerListItem[]).
 * Las mutations (usePatchIcp, useMarkReadyIcp) necesitan QueryClient
 * aunque no pre-carguen datos — withSeededQuery las provee.
 *
 * Variantes:
 *   - ICP completo (origen manual, estado listo)
 *   - ICP borrador vacío (campos en null)
 *   - ICP con ticker en ARS (currency LatAm)
 *   - Sin buyers (RN-8: mark-ready bloqueado)
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { withSeededQuery } from "../../../../../.storybook/decorators/withQueryClient";
import {
  buyerEmptyFixture,
  buyerListFixture,
  icpDetalleDraft,
  icpDetalleManual,
} from "../../../../../.storybook/fixtures/abel-icp";

import { IcpDatosForm } from "./IcpDatosForm";

const meta: Meta<typeof IcpDatosForm> = {
  title: "Abel/ICP/IcpDatosForm",
  component: IcpDatosForm,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    icpId: {
      control: "text",
      description: "ID del ICP",
    },
  },
  decorators: [
    withSeededQuery((qc) => {
      // Las mutations requieren QueryClient — datos de lista opcionales
      qc.setQueryData(["abel", "icp", "list"], []);
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof IcpDatosForm>;

/**
 * ICP completo — todos los campos con datos reales.
 * Muestra los 5 grupos con WhatForChip por grupo.
 */
export const IcpCompleto: Story = {
  args: {
    icpId: icpDetalleManual.id,
    icp: icpDetalleManual,
    buyers: buyerListFixture,
  },
};

/**
 * ICP borrador vacío — campos en null.
 * Estado inicial después de que Abel genera un draft.
 */
export const BorradorVacio: Story = {
  args: {
    icpId: icpDetalleDraft.id,
    icp: icpDetalleDraft,
    buyers: buyerEmptyFixture,
  },
};

/**
 * ICP con ticket en ARS — verifica RN-11 (no USD hardcodeado).
 */
export const TicketEnARS: Story = {
  args: {
    icpId: icpDetalleManual.id,
    icp: {
      ...icpDetalleManual,
      avgTicket: "850000.00",
      avgTicketCurrency: "ARS",
      geo: "Argentina, Uruguay",
    },
    buyers: buyerListFixture,
  },
};

/**
 * Sin buyers — el botón "Marcar listo" debería mostrar error inline (RN-8).
 */
export const SinBuyers: Story = {
  args: {
    icpId: icpDetalleManual.id,
    icp: icpDetalleManual,
    buyers: buyerEmptyFixture,
  },
};
