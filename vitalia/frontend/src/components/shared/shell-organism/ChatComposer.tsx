"use client";

/**
 * ChatComposer — molécula composer del panel de chat Valeria (T-4, F1-S6).
 *
 * Textarea con auto-resize (useEffect [localValue]), 3 icon stubs decorativos (D3),
 * Send button (disabled cuando vacío), onKeyDown con Enter/Shift+Enter + IME guard,
 * sr-only label (a11y SC-6), kbd hint Cmd+K.
 *
 * Consumes useChatStore.sendMessage — NO props externos (store-driven).
 *
 * spec_anchor: 01-spec.md § 0 D3 + § 4 ChatComposer + § 6 microcopy · 03-arch.md § 2.5
 * Named export (NO default) per FSD-Lite enforce.
 *
 * 'use client' REQUIRED: useState (localValue) + useRef (textarea) +
 *   useEffect (auto-resize) + onKeyDown (event handlers).
 *
 * LIFT CANDIDATE: cross-brand chat composer molécula. Second brand consumer triggers
 * /pm-luana promotion proposal for core/@luana/shell-chat-organism/.
 *
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 * hipaa-lite: not_applicable — shell chrome UI, no PHI, mock data only
 */

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";

/** Maximum height of auto-resize textarea in pixels (03-arch.md § 2.5). */
const TEXTAREA_MAX_HEIGHT_PX = 100;

/**
 * ChatComposer — footer molécula with interactive textarea + Send button.
 *
 * Keyboard handlers:
 *   - Enter (no Shift, no isComposing) → sendMessage(trimmed) + clear
 *   - Shift+Enter → default newline (browser native)
 *   - IME composing → skip handler (e.isComposing guard)
 *
 * Auto-resize: useEffect [localValue] adjusts textarea height up to TEXTAREA_MAX_HEIGHT_PX.
 * Send disabled: localValue.trim().length === 0.
 */
export function ChatComposer({ className }: { className?: string }) {
  const [localValue, setLocalValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useChatStore((s) => s.sendMessage);

  // ── Auto-resize effect ──────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX);
    el.style.height = `${next}px`;
  }, [localValue]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSend = () => {
    const trimmed = localValue.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setLocalValue("");
    // Reset textarea height after clearing
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME composition safety — skip handler during IME input.
    // React 19 synthetic events expose nativeEvent.isComposing for IME guard.
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter: default behavior (newline insertion)
  };

  const isSendDisabled = localValue.trim().length === 0;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <footer
      data-testid="chat-composer"
      className={cn("border-t border-border bg-card px-3 py-2 shrink-0", className)}
    >
      <div className="flex items-end gap-2">
        {/* Adornment stubs — decorative icon buttons (D3 spec: NOT disabled, title="próximamente") */}
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

        {/* sr-only label — aria accessibility (SC-6) */}
        <label className="sr-only" htmlFor="valeria-composer">
          Mensaje para Valeria
        </label>

        {/* Textarea — auto-resize, controlled, Shadcn-compatible classes */}
        <textarea
          ref={textareaRef}
          id="valeria-composer"
          data-testid="composer-input"
          rows={1}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe a Valeria… (Enter envía · Shift+Enter salto de línea)"
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 max-h-[100px] overflow-y-auto"
        />

        {/* Send button — disabled when empty (spec: Send disabled guard) */}
        <button
          type="button"
          data-testid="composer-send"
          onClick={handleSend}
          disabled={isSendDisabled}
          className="h-9 px-3 rounded-md bg-agent-valeria text-white text-sm font-medium hover:opacity-90 transition shrink-0 self-end disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar
        </button>
      </div>

      {/* kbd hint — Cmd+K focus (microcopy Spanish neutro § 6) */}
      <p className="text-[10px] text-muted-foreground mt-1 px-1">
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
          Cmd
        </kbd>{" "}
        +{" "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
          K
        </kbd>{" "}
        enfoca el composer desde cualquier parte del shell.
      </p>
    </footer>
  );
}
