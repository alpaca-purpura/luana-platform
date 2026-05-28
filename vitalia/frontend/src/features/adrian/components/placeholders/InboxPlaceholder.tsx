// cap: sales_agent.inbox-handler-mode-occ
// story-origin: vitalia-fase1-s10-TBD
"use client";

/**
 * InboxPlaceholder — organismo 3-col Adrián Inbox (sales_studio parity).
 * F1-S10 vitalia-fase1-empty-states — T-6
 *
 * Mockup parity: adrian-inbox-placeholder.html (ratificado Chris batch 2 · 2026-05-26)
 *
 * Layout widths shipped sales_studio: 320px | flex-1 | 288px.
 * Sidebar collapse: grid-template-columns swaps "320px 1fr 0" cuando sidebarOpen=false.
 *
 * Mock data: 5 conversaciones ficticias LatAm (PEN S/) + 4 mensajes mock thread.
 * Carlos Pérez tiene handlerMode="human" → border-l-2 verde + YouChip "✋ Tú".
 *
 * Local state (F1):
 *   - selectedLeadId: lead seleccionado por defecto "mg" (María González)
 *   - sidebarOpen: sidebar de detalles visible/oculto
 *   - handlerState: "adrian" | "human" — takeover per-conversación (F1 local, F2-S3 Zustand)
 *
 * F2 anchor documentado:
 *   import { useInboxStore } from "@/features/adrian/store/inbox-store";
 *   const handlerOverride = useInboxStore(s => s.handlerOverride);
 *   → Map<leadId, 'bot'|'human'> per-conversation override.
 *
 * Client Component — state: selectedLeadId, sidebarOpen, handlerState.
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — Tailwind semantic tokens only.
 * Spanish neutro — spec § 10 verbatim.
 * PHI masking visual-only (hipaa-lite.md F1 scope).
 *
 * spec_anchor: 03-arch.md § 3.3 + CONTEXT-BRIEF § 5-6 + 06-tickets.yaml T-6
 * downstream-regression-na: brand-local vitalia placeholder; no cross-brand consumers
 */

import { useState } from "react";
import {
  TogglePill,
  type TogglePillItem,
} from "@/components/shared/shell-organism/TogglePill";
import { ConversationItem } from "../inbox/ConversationItem";
import { MessageBubble } from "../inbox/MessageBubble";
import { MessageInput } from "../inbox/MessageInput";
import { ContactSidebar } from "../inbox/ContactSidebar";
import { ThreadHeader } from "../inbox/ThreadHeader";
import { TakeoverBanner } from "../inbox/TakeoverBanner";
import { type ConversationListItem } from "../inbox/types";

// ── Mock data (ficticios LatAm — PEN currency · NO PHI real) ────────────────
// Nombres ficticios de spec § 4: María G., Carlos P., Lucía R., Diego F., Sofía M.

const MOCK_CONVERSATIONS: ConversationListItem[] = [
  {
    leadId: "mg",
    displayName: "María González",
    lastMessagePreview: "Hola, vi su anuncio sobre limpie...",
    lastActivityRelative: "hace 2 min",
    channel: "whatsapp",
    temp: "hot",
    stage: "discovery",
    handlerMode: "bot",
    campaign: { id: "limpieza-pe", name: "Limpieza-PE" },
  },
  {
    leadId: "cp",
    displayName: "Carlos Pérez",
    lastMessagePreview: "¿tienen turno mañana?",
    lastActivityRelative: "hace 8 min",
    channel: "instagram",
    temp: "warm",
    stage: "rapport",
    handlerMode: "human", // ★ con YouChip — border-l verde
  },
  {
    leadId: "lr",
    displayName: "Lucía Ramos",
    lastMessagePreview: "Gracias por la info!",
    lastActivityRelative: "hace 1 h",
    channel: "whatsapp",
    temp: "cold",
    stage: "closing",
    handlerMode: "bot",
    campaign: { id: "blanqueamiento", name: "Blanqueamiento" },
  },
  {
    leadId: "df",
    displayName: "Diego Flores",
    lastMessagePreview: "¿el blanqueamiento incluye...?",
    lastActivityRelative: "hace 3 h",
    channel: "whatsapp",
    temp: "warm",
    stage: "presentation",
    handlerMode: "bot",
  },
  {
    leadId: "sm",
    displayName: "Sofía M.",
    lastMessagePreview: "Confirmado el martes 10am",
    lastActivityRelative: "ayer",
    channel: "whatsapp",
    temp: "cold",
    stage: "closing",
    handlerMode: "bot",
  },
] as const satisfies ConversationListItem[];

// ── Mock thread messages for selected conversation ──────────────────────────

interface MockMessage {
  direction: "in" | "out";
  text: string;
  timestamp: string;
  sender?: string;
}

const MOCK_THREAD_MESSAGES: MockMessage[] = [
  {
    direction: "in",
    text: "Hola, vi su anuncio sobre limpieza dental. ¿Cuánto sale?",
    timestamp: "12:32",
  },
  {
    direction: "out",
    text: "¡Hola María! La limpieza dental es S/ 120, dura 30 min. ¿Te agendo?",
    timestamp: "12:34",
    sender: "Adrián",
  },
  {
    direction: "in",
    text: "Sí, mañana al mediodía si tienen",
    timestamp: "12:35",
  },
  {
    direction: "out",
    text: "Genial. Tengo disponible Mar 27 a las 12:00 con Dra. Soto. Te confirmo con un depósito de S/ 36 (30%). ¿Continúo?",
    timestamp: "12:36",
    sender: "Adrián",
  },
];

// ── Global mode toggle items ─────────────────────────────────────────────────
const GLOBAL_MODE_ITEMS: TogglePillItem[] = [
  { value: "decide", label: "🤖 Adrián decide" },
  { value: "consulta", label: "👀 Te consulta" },
  { value: "manual", label: "✋ Manual" },
];

// ── Main component ────────────────────────────────────────────────────────────

/**
 * InboxPlaceholder — organismo completo Adrián Inbox con takeover UX A↔B.
 *
 * Estado local F1:
 *   - selectedLeadId: conversación activa (default "mg" = María González)
 *   - sidebarOpen: sidebar detalles visible
 *   - handlerState: "adrian" (A) | "human" (B) — se resetea al cambiar de conversación
 *
 * F2-S3 anchor: reemplazar handlerState por Zustand
 *   `useInboxStore(s => s.handlerOverride.get(selectedLeadId) ?? 'bot')`
 */
export function InboxPlaceholder() {
  // Conversación seleccionada — default María González
  const [selectedLeadId, setSelectedLeadId] = useState<string>("mg");

  // Sidebar detalles abierto/cerrado
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Takeover local F1 — "adrian" = Adrián maneja | "human" = usuario en control
  // F2-S3: reemplazar con Zustand handlerOverride[leadId] map
  const [handlerState, setHandlerState] = useState<"adrian" | "human">(
    "adrian",
  );

  // Reset handlerState a "adrian" al cambiar de conversación (spec § 6 F1 behavior)
  const handleSelectConversation = (leadId: string) => {
    setSelectedLeadId(leadId);
    setHandlerState("adrian");
  };

  const selected =
    MOCK_CONVERSATIONS.find((c) => c.leadId === selectedLeadId) ??
    MOCK_CONVERSATIONS[0]!;

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-md border border-border bg-card">
      {/* ── Header: título + descripción + toggle 3-modos ──────────────────── */}
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-foreground">Inbox</h2>
          <p className="text-xs text-muted-foreground">
            Modo por defecto para nuevas conversaciones · usa el control de cada
            conversación para overrides puntuales.
          </p>
        </div>

        {/* TogglePill 3-modos — uncontrolled (F1 visual, F2 wire to global config) */}
        <TogglePill
          items={GLOBAL_MODE_ITEMS}
          defaultValue="decide"
          data-testid="inbox-global-mode-toggle"
        />
      </div>

      {/* ── 3-col layout (sales_studio shipped widths) ──────────────────────── */}
      {/*
        grid-template-columns: 320px 1fr 288px (sidebar open)
        grid-template-columns: 320px 1fr 0     (sidebar closed)
        data-sidebar attribute for E2E testing
      */}
      <div
        data-sidebar={sidebarOpen ? "open" : "closed"}
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: sidebarOpen ? "320px 1fr 288px" : "320px 1fr 0",
          minHeight: "460px",
        }}
      >
        {/* ── Col 1: ConversationList 320px ─────────────────────────────────── */}
        <aside
          aria-label="Lista de conversaciones"
          className="overflow-y-auto border-r border-border bg-card"
        >
          {/* Search bar — F1 visual disabled */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-muted-foreground opacity-60">
              <span aria-hidden="true">🔍</span>
              <span>Buscar conversación</span>
            </div>
          </div>

          {/* Conversation items */}
          {MOCK_CONVERSATIONS.map((conv) => (
            <ConversationItem
              key={conv.leadId}
              conversation={conv}
              isSelected={conv.leadId === selectedLeadId}
              onSelect={handleSelectConversation}
            />
          ))}
        </aside>

        {/* ── Col 2: Thread (flex-1) ───────────────────────────────────────── */}
        <section
          aria-label={`Conversación con ${selected.displayName}`}
          className="flex flex-col overflow-hidden"
        >
          {/* ThreadHeader — 2 estados A/B */}
          <ThreadHeader
            conversation={selected}
            handlerState={handlerState}
            onTakeControl={() => setHandlerState("human")}
            onCloseSidebar={() => setSidebarOpen(false)}
          />

          {/* TakeoverBanner — visible solo en state B (human) */}
          {handlerState === "human" && (
            <TakeoverBanner onReturnControl={() => setHandlerState("adrian")} />
          )}

          {/* Messages area */}
          <div
            className="flex-1 space-y-2 overflow-y-auto px-4 py-3"
            aria-live="polite"
            aria-label="Mensajes de la conversación"
          >
            {MOCK_THREAD_MESSAGES.map((msg, i) => (
              <MessageBubble
                key={i}
                direction={msg.direction}
                text={msg.text}
                timestamp={msg.timestamp}
                sender={msg.sender}
              />
            ))}

            {/* Footer hint — cambia según handlerState */}
            {handlerState === "adrian" ? (
              <p className="mt-2 border-t border-border pt-2 text-center text-[11px] italic text-muted-foreground">
                Adrián decidirá la próxima respuesta automáticamente · clic{" "}
                <strong>✋ Tomar el control</strong> arriba para responder tú
              </p>
            ) : (
              <p className="mt-2 border-t border-border pt-2 text-center text-[11px] italic text-amber-700">
                ⚡ Estás respondiendo como tú · Adrián volverá a manejar la
                conversación cuando devuelvas el control
              </p>
            )}
          </div>

          {/* MessageInput — state dual: disabled (A) / enabled (B) */}
          <MessageInput
            disabled={handlerState === "adrian"}
            placeholder={
              handlerState === "adrian"
                ? // spec § 10 verbatim
                  "🤖 Adrián decide automáticamente · toma el control para escribir tú"
                : // spec § 10 verbatim — {patient_name} interpolado
                  `Escribir como tú a ${selected.displayName}…`
            }
          />
        </section>

        {/* ── Col 3: ContactSidebar 288px ─────────────────────────────────── */}
        {sidebarOpen && (
          <ContactSidebar
            leadId={selected.leadId}
            conversation={selected}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
