// cap: abel.icp-buyer
/**
 * BuyerLeafForm.stories.tsx — CSF3 stories para BuyerLeafForm.
 *
 * BuyerLeafForm requiere buyerId + icpId; carga el buyer desde React Query.
 * Las stories pre-cargan el cache con buyerDetalleFixture.
 *
 * Variantes:
 *   - Buyer principal completo
 *   - Buyer secundario (isPrimary: false)
 *   - Buyer vacío (recién creado, solo name)
 *   - Estado de carga
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  withEmptyQuery,
  withSeededQuery,
} from "../../../../../.storybook/decorators/withQueryClient";
import { buyerListFixture, icpDetalleManual } from "../../../../../.storybook/fixtures/abel-icp";

import { BuyerLeafForm } from "./BuyerLeafForm";

// ── Fixtures de detalle de buyer ──────────────────────────────────────────────

const buyerPrincipalDetalle = {
  id: buyerListFixture[0].id,
  name: "Dueño / CEO",
  isPrimary: true,
  icpId: icpDetalleManual.id,
  role: "Fundador y CEO — tomador de decisión final",
  decisionPower: "high",
  responsibilities: "Define la estrategia de crecimiento y aprueba presupuesto de herramientas",
  dailyChallenges: "Demasiado tiempo en operación; no puede dedicarse a crecer la agencia",
  kpis: "MRR, churn, pipeline activo",
  decisionCriteria: "ROI claro en menos de 3 meses; fácil de implementar sin IT",
  communicationStyle: "Directo, ejecutivo; prefiere resúmenes en lugar de detalles técnicos",
  objections: "Ya tenemos muchas herramientas. ¿En qué es diferente Nicolify?",
  buyingProcess: "Evalúa 2-3 opciones, pide demo, cierra en 2-4 semanas con contrato mensual",
  createdAt: "2026-06-01T14:30:00Z",
  updatedAt: "2026-06-15T09:00:00Z",
};

const buyerSecundarioDetalle = {
  id: buyerListFixture[1].id,
  name: "Director de Operaciones (COO)",
  isPrimary: false,
  icpId: icpDetalleManual.id,
  role: "COO — influenciador clave en la adopción",
  decisionPower: "influencer",
  responsibilities: "Coordina entrega de proyectos y uso de herramientas del equipo",
  dailyChallenges: "Hacer seguimiento de múltiples proyectos con herramientas desconectadas",
  kpis: "On-time delivery, NPS clientes",
  decisionCriteria: null,
  communicationStyle: null,
  objections: null,
  buyingProcess: null,
  createdAt: "2026-06-05T10:00:00Z",
  updatedAt: "2026-06-20T08:00:00Z",
};

const buyerVacioDetalle = {
  id: "buyer-nuevo-444",
  name: "Nuevo contacto",
  isPrimary: false,
  icpId: icpDetalleManual.id,
  role: null,
  decisionPower: null,
  responsibilities: null,
  dailyChallenges: null,
  kpis: null,
  decisionCriteria: null,
  communicationStyle: null,
  objections: null,
  buyingProcess: null,
  createdAt: "2026-06-22T12:00:00Z",
  updatedAt: "2026-06-22T12:00:00Z",
};

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta<typeof BuyerLeafForm> = {
  title: "Abel/ICP/BuyerLeafForm",
  component: BuyerLeafForm,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    buyerId: {
      control: "text",
      description: "ID del buyer desde la URL",
    },
    icpId: {
      control: "text",
      description: "ID del ICP padre",
    },
  },
};

export default meta;
type Story = StoryObj<typeof BuyerLeafForm>;

/**
 * Buyer principal completo — todos los campos con datos.
 * Muestra el badge "Principal" y botón "Establecer como principal" deshabilitado.
 */
export const BuyerPrincipalCompleto: Story = {
  args: {
    buyerId: buyerPrincipalDetalle.id,
    icpId: icpDetalleManual.id,
  },
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "buyer", buyerPrincipalDetalle.id], buyerPrincipalDetalle);
      qc.setQueryData(["abel", "buyers", icpDetalleManual.id, "list"], buyerListFixture);
    }),
  ],
};

/**
 * Buyer secundario — puede ser marcado como principal.
 */
export const BuyerSecundario: Story = {
  args: {
    buyerId: buyerSecundarioDetalle.id,
    icpId: icpDetalleManual.id,
  },
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "buyer", buyerSecundarioDetalle.id], buyerSecundarioDetalle);
      qc.setQueryData(["abel", "buyers", icpDetalleManual.id, "list"], buyerListFixture);
    }),
  ],
};

/**
 * Buyer recién creado — casi todos los campos vacíos.
 */
export const BuyerVacio: Story = {
  args: {
    buyerId: buyerVacioDetalle.id,
    icpId: icpDetalleManual.id,
  },
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "buyer", buyerVacioDetalle.id], buyerVacioDetalle);
      qc.setQueryData(["abel", "buyers", icpDetalleManual.id, "list"], buyerListFixture);
    }),
  ],
};

/**
 * Estado de carga — sin datos en cache.
 */
export const Cargando: Story = {
  args: {
    buyerId: "buyer-cargando",
    icpId: icpDetalleManual.id,
  },
  decorators: [withEmptyQuery],
};
