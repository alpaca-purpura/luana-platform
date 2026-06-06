// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * ChatComposer — composer del panel de chat Luana (Nicolify R0 skeleton).
 *
 * Port re-tematizado from vitalia/ChatComposer.tsx.
 * CRITICAL re-theme:
 *   - placeholder: "Escríbele a Luana…" (tuteo, NO voseo "Escribile a Luana")
 *   - id: "luana-composer-placeholder"
 *   - aria-label: "Mensaje para Luana"
 *   - send button: bg-agent-luana (indigo #635BFF, was valeria purple)
 *
 * R0 SKELETON: ChatComposer does NOT send to any real agent.
 * sendMessage() is the mock store action (canned responses, 800ms delay).
 * Real SSE/WS wiring deferred to R1.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { useState, useRef, useEffect } from "react";

import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";

const TEXTAREA_MAX_HEIGHT_PX = 100;

/** ChatComposer — footer del chat de Luana con textarea auto-resize + botón enviar (skeleton NON-functional R0). */
export function ChatComposer({ className }: { className?: string }) {
  const [localValue, setLocalValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Select the stable store action directly. A selector returning a NEW arrow
  // wrapper each call — `(s) => (c) => s.sendMessage(c)` — makes getSnapshot
  // return a fresh value every render → "getSnapshot should be cached" infinite
  // loop, which crashed once Luana mounts open by default. The action reference
  // is already stable in the store, so select it as-is.
  // eslint-disable-next-line @typescript-eslint/unbound-method -- zustand action is bound/stable in the store; wrapping it in an arrow reintroduces the getSnapshot loop documented above.
  const sendMessage = useChatStore((s) => s.sendMessage);

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX);
    el.style.height = `${next}px`;
  }, [localValue]);

  const handleSend = () => {
    const trimmed = localValue.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setLocalValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSendDisabled = localValue.trim().length === 0;

  return (
    <footer
      data-testid="chat-composer"
      className={cn("border-t border-border bg-card px-3 py-2 shrink-0", className)}
    >
      <div className="flex items-end gap-2">
        {/* Adornment stubs — decorative, NON-functional in R0 */}
        <div className="flex items-center gap-0.5 pb-1.5">
          <button
            type="button"
            data-testid="composer-attach"
            aria-label="Adjuntar archivo"
            title="Adjuntar (próximamente)"
            className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground flex items-center justify-center text-base"
          >
            <span aria-hidden="true">📎</span>
          </button>
          <button
            type="button"
            data-testid="composer-voice"
            aria-label="Mensaje de voz"
            title="Voz (próximamente)"
            className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground flex items-center justify-center text-base"
          >
            <span aria-hidden="true">🎙️</span>
          </button>
          <button
            type="button"
            data-testid="composer-quick"
            aria-label="Comandos rápidos"
            title="Comandos (próximamente)"
            className="h-8 w-8 rounded-md hover:bg-muted text-muted-foreground flex items-center justify-center text-base"
          >
            <span aria-hidden="true">⚡</span>
          </button>
        </div>

        {/* sr-only label */}
        <label className="sr-only" htmlFor="luana-composer-placeholder">
          Mensaje para Luana
        </label>

        {/* Textarea — placeholder tuteo (NOT voseo) */}
        <textarea
          ref={textareaRef}
          id="luana-composer-placeholder"
          data-testid="composer-input"
          rows={1}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escríbele a Luana… (Enter envía · Shift+Enter salto de línea)"
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 max-h-[100px] overflow-y-auto"
        />

        {/* Send button */}
        <button
          type="button"
          data-testid="composer-send"
          onClick={handleSend}
          disabled={isSendDisabled}
          className="h-9 px-3 rounded-md bg-agent-luana text-white text-sm font-medium hover:opacity-90 transition shrink-0 self-end disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </div>
    </footer>
  );
}
