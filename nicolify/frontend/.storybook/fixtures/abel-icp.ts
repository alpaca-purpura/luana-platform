/**
 * Fixtures sintéticos para stories de Abel ICP (LatAm B2B agencies).
 *
 * Datos SINTÉTICOS — sin PII real:
 *   - Empresas ficticias con nombres genéricos del sector agencias LatAm
 *   - Emails @example.com
 *   - UUIDs fijos tipo 'icp-xxx' para URLs estables en stories
 *
 * Claves de React Query mirror de use-icps.ts / use-buyers.ts:
 *   ['abel', 'icp', 'list']          → IcpListItem[]
 *   ['abel', 'icp', icpId]           → Icp
 *   ['abel', 'buyers', icpId, 'list'] → BuyerListItem[]
 *   ['abel', 'buyer', buyerId]        → Buyer (detalle)
 */

import type { BuyerListItem } from "../../src/features/abel/types/buyer";
import type { Icp, IcpListItem } from "../../src/features/abel/types/icp";

// ── ICP list fixtures ──────────────────────────────────────────────────────────

export const icpListo: IcpListItem = {
  id: "icp-aaa-listo-001",
  label: "Agencias de marketing con retainer",
  vertical: "Agencias de marketing digital",
  status: "listo",
  buyerCount: 2,
};

export const icpBorrador: IcpListItem = {
  id: "icp-bbb-borrador-002",
  label: "Boutiques de software B2B",
  vertical: "Software a medida",
  status: "borrador",
  buyerCount: 1,
};

export const icpSinBuyers: IcpListItem = {
  id: "icp-ccc-sinbuyers-003",
  label: "Consultoras estratégicas",
  vertical: null,
  status: "borrador",
  buyerCount: 0,
};

export const icpListFixture: IcpListItem[] = [icpListo, icpBorrador, icpSinBuyers];

// ── ICP detalle fixture ────────────────────────────────────────────────────────

export const icpDetalleManual: Icp = {
  id: "icp-aaa-listo-001",
  label: "Agencias de marketing con retainer",
  description:
    "Agencias de marketing digital que facturan con modelo de retainer mensual y tienen entre 5 y 20 personas en el equipo.",
  vertical: "Agencias de marketing digital",
  companySize: "5-20 empleados",
  geo: "México, Colombia, Argentina",
  businessModel: "Retainer mensual USD 2.000 - USD 8.000",
  avgTicket: "4500.00",
  avgTicketCurrency: "USD",
  salesCycle: "30-60 días",
  mainPain: "No pueden escalar sin contratar más personal junior",
  salesAngle: "Con Nicolify, tu equipo de agentes opera el ciclo de Revenue sin personal extra",
  signals: [
    "Creciendo en headcount pero sin sistema",
    "Usa múltiples herramientas desconectadas",
    "Dueño reporta manualmente a clientes",
  ],
  antiPattern: "Agencias con menos de 3 clientes activos o en modo freelance",
  status: "listo",
  origin: "manual",
  buyerCount: 2,
  createdAt: "2026-06-01T14:30:00Z",
  updatedAt: "2026-06-15T09:00:00Z",
};

export const icpDetalleDraft: Icp = {
  id: "icp-bbb-borrador-002",
  label: "Boutiques de software B2B",
  description: null,
  vertical: "Software a medida",
  companySize: null,
  geo: null,
  businessModel: null,
  avgTicket: null,
  avgTicketCurrency: null,
  salesCycle: null,
  mainPain: null,
  salesAngle: null,
  signals: [],
  antiPattern: null,
  status: "borrador",
  origin: "draft",
  buyerCount: 1,
  createdAt: "2026-06-20T10:00:00Z",
  updatedAt: "2026-06-20T10:00:00Z",
};

// ── Buyer list fixtures ────────────────────────────────────────────────────────

export const buyerListFixture: BuyerListItem[] = [
  {
    id: "buyer-111-dueño",
    name: "Dueño / CEO",
    role: "CEO",
    decisionPower: "high",
    isPrimary: true,
  },
  {
    id: "buyer-222-coo",
    name: "Director de Operaciones (COO)",
    role: "COO",
    decisionPower: "influencer",
    isPrimary: false,
  },
];

export const buyerSingleFixture: BuyerListItem[] = [
  {
    id: "buyer-333-ceo",
    name: "Fundador / CEO",
    role: "Fundador",
    decisionPower: "high",
    isPrimary: true,
  },
];

export const buyerEmptyFixture: BuyerListItem[] = [];
