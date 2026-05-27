/**
 * MessageInput — molécula input mensaje inbox.
 * F1-S10 vitalia-fase1-empty-states — T-5
 *
 * State dual:
 *   disabled=true  → State A (Adrián maneja): textarea disabled, send+attach disabled, opacity-50
 *   disabled=false → State B (usuario): textarea enabled, focus ring agent-adrian, send btn bg-agent-adrian
 *
 * F1: no RHF, no Zod. Controlled via props value/onChange.
 * F2-S3: wire RHF resolver + Zod `z.string().min(1)` + onSubmit mutation.
 *
 * Mockup parity: adrian-inbox-placeholder.html .msg-input-area styles
 *
 * Client Component — event handlers (onChange, onKeyDown, onSubmit).
 * Named export (NO default) per FSD-Lite enforce.
 * No hex colors — Tailwind semantic tokens only.
 * Spanish neutro placeholders — spec § 10 verbatim.
 *
 * spec_anchor: 03-arch.md § 3.3 + CONTEXT-BRIEF § 5
 * downstream-regression-na: brand-local vitalia inbox; no cross-brand consumers
 */

"use client";

import { cn } from "@/lib/utils";

export interface MessageInputProps {
  /** State A (disabled=true): Adrián maneja. State B (false): usuario en control. */
  disabled: boolean;
  /** Placeholder text — spec § 10 verbatim (injected by parent per mode) */
  placeholder: string;
  /** Controlled value (F1: parent may pass empty string; F2: RHF field value) */
  value?: string;
  /** Controlled change handler */
  onChange?: (text: string) => void;
  /** Submit handler — called on send button click or Enter (without shift) */
  onSubmit?: (text: string) => void;
  className?: string;
}

/**
 * MessageInput — textarea + attach + send.
 * Dual state: disabled (Adrián mode) / enabled (user takeover).
 */
export function MessageInput({
  disabled,
  placeholder,
  value = "",
  onChange,
  onSubmit,
  className,
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      if (value.trim() && onSubmit) {
        onSubmit(value.trim());
      }
    }
  };

  const handleSend = () => {
    if (!disabled && value.trim() && onSubmit) {
      onSubmit(value.trim());
    }
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-t border-border bg-card px-3 py-3",
        className,
      )}
    >
      {/* Textarea — auto-height rows=1 */}
      <textarea
        rows={1}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Escribir mensaje"
        aria-disabled={disabled}
        className={cn(
          "flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none",
          "focus:border-agent-adrian focus:ring-[3px] focus:ring-agent-adrian/10",
          disabled && "cursor-not-allowed opacity-50 bg-muted",
        )}
      />

      {/* Attach button */}
      <button
        type="button"
        disabled={disabled}
        aria-label="Adjuntar archivo"
        title={
          disabled
            ? "Adjuntar deshabilitado mientras Adrián maneja"
            : "Adjuntar archivo"
        }
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm transition-colors",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-muted cursor-pointer",
        )}
      >
        📎
      </button>

      {/* Send button */}
      <button
        type="button"
        disabled={disabled || !value.trim()}
        onClick={handleSend}
        aria-label="Enviar mensaje"
        className={cn(
          "rounded-md px-3 py-2 text-[13px] font-semibold transition-colors",
          disabled
            ? "cursor-not-allowed bg-agent-adrian/30 text-white opacity-35"
            : "bg-agent-adrian text-white hover:opacity-90 cursor-pointer",
        )}
      >
        Enviar
      </button>
    </div>
  );
}
