// cap: shell-organism.shell-nicolify
// story-origin: platform-lift-shell-chrome-ui-kit T-N1
/**
 * _mock-messages.ts — Mock data SSoT for Luana chat shell (Nicolify R0).
 *
 * Moved from components/shared/shell-organism/_mock-messages.ts (T-N1 chrome retirement).
 * New canonical path: stores/_mock-messages.ts (co-located with chat-store.ts consumer).
 *
 * Port re-tematizado from vitalia/_mock-messages.ts.
 * Re-themed: Valeria→Luana, health context→B2B agency context.
 *
 * IDs stable ('1'..'6') — NOT crypto.randomUUID() — Playwright golden determinism.
 *
 * Spanish neutro LatAm verified (tuteo, sin voseo).
 * Strings use tuteo: "tienes", "quieres", "puedes".
 *
 * No PHI — mock B2B agency data only.
 * downstream-regression-na: brand-local shell data; no cross-brand consumers
 */

import type { AgentSlug } from "@/lib/agent-catalog";
import type { ChatMessage } from "@/stores/chat-store";

export const MOCK_MESSAGES: readonly ChatMessage[] = [
  {
    id: "1",
    role: "bot",
    agent: "luana",
    content:
      "¡Buenos días! Tienes 3 propuestas pendientes de seguimiento y 2 reuniones en el pipeline. ¿Por dónde empezamos?",
    time: "09:01",
  },
  {
    id: "2",
    role: "user",
    content: "¿Cómo está el pipeline de ventas esta semana?",
    time: "09:02",
  },
  {
    id: "3",
    role: "delegate",
    fromAgent: "luana",
    toAgent: "christian",
    delegateMode: "Mantener",
  },
  {
    id: "4",
    role: "bot",
    agent: "christian",
    content:
      "Esta semana tienes 7 oportunidades activas: 3 en negociación, 2 en propuesta enviada y 2 calificadas. El deal con Merkado Digital tiene mayor urgencia — tienen reunión de decisión el viernes. ¿Lo priorizo?",
    time: "09:02",
  },
  {
    id: "5",
    role: "user",
    content: "Sí, priorízalo.",
    time: "09:03",
  },
  {
    id: "6",
    role: "thinking",
    agent: "christian",
    content: "Christian está revisando el pipeline de Merkado Digital…",
  },
] as const;

export const MOCK_RESPONSES_BY_AGENT: Record<AgentSlug, readonly { content: string }[]> = {
  luana: [
    {
      content:
        "Tienes 3 follow-ups pendientes y 1 reunión mañana a las 10:00. ¿Quieres que prepare el brief?",
    },
    {
      content:
        "Esta semana cerraste 2 deals. El pipeline total es de 48.000 USD. ¿Revisamos las prioridades?",
    },
    {
      content:
        "Te confirmo: Christian agendó la reunión con Merkado Digital para el viernes a las 15:00.",
    },
    {
      content:
        "Brenda detectó que la campaña LinkedIn tiene CAC elevado esta semana. ¿Quieres que la revise?",
    },
  ],
  abel: [],
  brenda: [],
  christian: [],
  sara: [],
  norvil: [],
} as const;
