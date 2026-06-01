// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
// _mock-conversations.ts — mock data Nicolify R0 (no API real hasta R1)
// No PHI — business conversations only (agency/B2B context)

export type MockConversation = {
  id: string;
  title: string;
  meta: string;
  group: "today" | "yesterday" | "this_week";
  active?: boolean;
};

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: "1",
    title: "Revisión pipeline de ventas semana",
    meta: "14:32 · 8 mensajes",
    group: "today",
  },
  {
    id: "2",
    title: "Campaña LinkedIn Tier 1 agencias",
    meta: "11:18 · 12 mensajes",
    group: "today",
  },
  {
    id: "3",
    title: "Propuesta cliente Merkado Digital",
    meta: "09:45 · 5 mensajes",
    group: "today",
  },
  {
    id: "4",
    title: "Salud de cuenta Innovacom Group",
    meta: "Ayer 19:02 · 4 msgs",
    group: "yesterday",
  },
  {
    id: "5",
    title: "Secuencia outbound CRM semana",
    meta: "Ayer 15:30 · 7 msgs",
    group: "yesterday",
  },
  {
    id: "6",
    title: "Plan presupuesto campañas mayo",
    meta: "Lun · 11 mensajes",
    group: "this_week",
  },
  {
    id: "7",
    title: "Métricas conversión landing B2B",
    meta: "Lun · 6 mensajes",
    group: "this_week",
  },
  {
    id: "8",
    title: "Renovación contrato Publika SAS",
    meta: "Dom · 9 mensajes",
    group: "this_week",
  },
];
