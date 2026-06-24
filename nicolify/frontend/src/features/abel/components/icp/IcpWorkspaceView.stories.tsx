// cap: abel.icp-buyer
/**
 * IcpWorkspaceView.stories.tsx — CSF3 stories para IcpWorkspaceView.
 *
 * Cubre los estados del workspace de un ICP:
 *   - Hoja "datos" con ICP borrador (muestra ProposalBanner)
 *   - Hoja "datos" con ICP listo (sin ProposalBanner)
 *   - Hoja de buyer (leaf = buyerId)
 *   - Estado de carga
 *   - Estado de error
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  withSeededQuery,
  withEmptyQuery,
} from "../../../../../.storybook/decorators/withQueryClient";
import {
  icpDetalleManual,
  icpDetalleDraft,
  buyerListFixture,
  buyerSingleFixture,
} from "../../../../../.storybook/fixtures/abel-icp";

import { IcpWorkspaceView } from "./IcpWorkspaceView";

const meta: Meta<typeof IcpWorkspaceView> = {
  title: "Abel/ICP/IcpWorkspaceView",
  component: IcpWorkspaceView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    icpId: {
      control: "text",
      description: "ID del ICP desde la URL [entityId]",
    },
    leaf: {
      control: "text",
      description: 'Hoja activa: "datos" | buyerId',
    },
  },
};

export default meta;
type Story = StoryObj<typeof IcpWorkspaceView>;

/**
 * Hoja "datos" con ICP en borrador.
 * Muestra ProposalBanner (RN-3: origin=draft && status=borrador).
 */
export const DatosConPropuesta: Story = {
  args: {
    icpId: icpDetalleDraft.id,
    leaf: "datos",
  },
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "icp", icpDetalleDraft.id], icpDetalleDraft);
      qc.setQueryData(["abel", "buyers", icpDetalleDraft.id, "list"], buyerSingleFixture);
    }),
  ],
};

/**
 * Hoja "datos" con ICP listo (manual).
 * Sin ProposalBanner — el ICP ya fue ratificado.
 */
export const DatosListoSinPropuesta: Story = {
  args: {
    icpId: icpDetalleManual.id,
    leaf: "datos",
  },
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "icp", icpDetalleManual.id], icpDetalleManual);
      qc.setQueryData(["abel", "buyers", icpDetalleManual.id, "list"], buyerListFixture);
    }),
  ],
};

/**
 * Hoja de buyer — leaf = buyerId.
 * Renderiza BuyerLeafForm en vez de IcpDatosForm.
 */
export const HojaBuyer: Story = {
  args: {
    icpId: icpDetalleManual.id,
    leaf: buyerListFixture[0].id,
  },
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "icp", icpDetalleManual.id], icpDetalleManual);
      qc.setQueryData(["abel", "buyers", icpDetalleManual.id, "list"], buyerListFixture);
      qc.setQueryData(["abel", "buyer", buyerListFixture[0].id], {
        id: buyerListFixture[0].id,
        name: "Dueño / CEO",
        isPrimary: true,
        icpId: icpDetalleManual.id,
        role: "Fundador y tomador de decisión final",
        responsibilities: "Define estrategia de crecimiento y aprueba presupuesto",
        dailyChallenges: "Demasiado tiempo en tareas operativas, no en crecimiento",
        kpis: null,
        decisionCriteria: null,
        communicationStyle: null,
        objections: null,
        buyingProcess: null,
        createdAt: "2026-06-01T14:30:00Z",
        updatedAt: "2026-06-15T09:00:00Z",
      });
    }),
  ],
};

/**
 * Estado de carga — sin datos en cache.
 */
export const Cargando: Story = {
  args: {
    icpId: "icp-cargando",
    leaf: "datos",
  },
  decorators: [withEmptyQuery],
};
