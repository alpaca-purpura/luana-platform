// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-2
"use client";
/**
 * UniversalIntake.tsx — 4-mode universal input component for Abel seed intake.
 *
 * Modes:
 *   - URL        → paste a website/LinkedIn/report URL for Abel to analyze
 *   - Archivo    → upload a PDF/Word/CSV file
 *   - Texto      → paste free text (briefing, notes, email)
 *   - Conectar   → DISABLED placeholder CTA (dep: Config→conexiones, not yet built)
 *
 * The "Conectar fuente" mode is NOT functional day-1:
 *   - Renders as disabled with a CTA "Configurar → Conexiones"
 *   - The CTA navigates to /{tenantId}/config/conexiones (CONN: navigable, not island)
 *   - Only URL / Archivo / Texto are functional (feed the extract endpoint)
 *
 * Emits:
 *   - onSubmit(payload: IcpExtractRequest) when user clicks "Analizar"
 *   - onCancel() when user dismisses
 *
 * Accessibility:
 *   - Each mode tab: role="tab" + aria-selected + roving focus
 *   - File dropzone: keyboard accessible via <input type="file"> with visible label
 *   - aria-live on "Conectar" disabled state explanation
 *   - aria-busy on the analyze button while submitting
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §7 Estados visuales → intake mode
 * validators_gate: RN-9 (semilla = dato, cliente la envía as-is, BE sanitiza) + SC-network
 */

import { useState, useCallback, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { IntakeMode } from "@/features/abel/store/abel-ui-store";
import type { IcpExtractRequest, SeedType } from "@/features/abel/types/extract";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UniversalIntakeProps {
  /** Called when user submits a seed — payload goes to extract API */
  onSubmit: (payload: IcpExtractRequest) => void;
  /** Called when user cancels / closes the intake */
  onCancel: () => void;
  /** Initial mode (from abel-ui-store, user preference) */
  initialMode?: IntakeMode;
  /** Tenant ID for "Conectar" CTA navigation */
  tenantId: string;
  /** Whether a submission is in progress (disables the button) */
  isSubmitting?: boolean;
  /** Additional className for the container */
  className?: string;
}

// ── Mode config ───────────────────────────────────────────────────────────────

interface ModeConfig {
  id: IntakeMode;
  label: string;
  disabled: boolean;
}

const MODES: ModeConfig[] = [
  { id: "url", label: "URL", disabled: false },
  { id: "archivo", label: "Archivo", disabled: false },
  { id: "texto", label: "Texto", disabled: false },
  { id: "conectar", label: "Conectar fuente", disabled: true },
];

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * UniversalIntake — 4-mode intake component for Abel seed submission.
 *
 * The "Conectar fuente" mode is DISABLED with a navigable CTA (dep: Config).
 * The 3 active modes (URL/Archivo/Texto) feed the extract endpoint.
 *
 * Seeds are treated as UNTRUSTED DATA by the backend (RN-9).
 * This component sends them as-is — the backend applies structural separation.
 */
export function UniversalIntake({
  onSubmit,
  onCancel,
  initialMode = "url",
  tenantId,
  isSubmitting = false,
  className,
}: UniversalIntakeProps) {
  // Active mode (only non-disabled modes are selectable)
  const [activeMode, setActiveMode] = useState<IntakeMode>(
    initialMode === "conectar" ? "url" : initialMode,
  );

  // URL mode state
  const [urlValue, setUrlValue] = useState("");
  // Texto mode state
  const [textoValue, setTextoValue] = useState("");
  // Archivo mode state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode tab focus (roving tabindex)
  const [focusedModeIdx, setFocusedModeIdx] = useState(0);
  const modeTabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ── Mode switching ──────────────────────────────────────────────────────────

  const handleSelectMode = useCallback((mode: IntakeMode) => {
    if (mode === "conectar") return; // disabled
    setActiveMode(mode);
  }, []);

  const handleModeKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const enabledModes = MODES.filter((m) => !m.disabled);
      const currentIdx = enabledModes.findIndex((m) => m.id === activeMode);
      let nextIdx: number;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          nextIdx = (currentIdx + 1) % enabledModes.length;
          break;
        case "ArrowLeft":
          e.preventDefault();
          nextIdx = (currentIdx - 1 + enabledModes.length) % enabledModes.length;
          break;
        case "Home":
          e.preventDefault();
          nextIdx = 0;
          break;
        case "End":
          e.preventDefault();
          nextIdx = enabledModes.length - 1;
          break;
        default:
          return;
      }

      const nextMode = enabledModes[nextIdx];
      if (nextMode) {
        setActiveMode(nextMode.id);
        setFocusedModeIdx(nextIdx);
        modeTabRefs.current[nextIdx]?.focus();
      }
    },
    [activeMode],
  );

  // ── File handling ───────────────────────────────────────────────────────────

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────────

  const canSubmit = useCallback((): boolean => {
    if (isSubmitting) return false;
    switch (activeMode) {
      case "url":
        return urlValue.trim().length > 0;
      case "archivo":
        return selectedFile !== null;
      case "texto":
        return textoValue.trim().length > 0;
      default:
        return false;
    }
  }, [activeMode, urlValue, selectedFile, textoValue, isSubmitting]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit()) return;

    let payload: IcpExtractRequest;

    switch (activeMode) {
      case "url":
        payload = { seedType: "url" as SeedType, url: urlValue.trim() };
        break;
      case "archivo": {
        if (!selectedFile) return;
        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip the data: URL prefix (data:...;base64,<content>)
            const base64Content = result.split(",")[1] ?? result;
            resolve(base64Content);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        payload = {
          seedType: "archivo" as SeedType,
          fileContent: base64,
          fileName: selectedFile.name,
        };
        break;
      }
      case "texto":
        payload = { seedType: "texto" as SeedType, text: textoValue.trim() };
        break;
      default:
        return;
    }

    onSubmit(payload);
  }, [activeMode, canSubmit, onSubmit, selectedFile, textoValue, urlValue]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={cn("flex flex-col gap-4", className)} data-testid="universal-intake">
      {/* Mode selector — tablist pattern (WAI-ARIA) */}
      {/* C1 fix: pill/segmented selector (mockup intake-mode pattern) — NOT underline */}
      <div
        role="tablist"
        aria-label="Tipo de fuente"
        onKeyDown={handleModeKeyDown}
        className="flex gap-1 bg-muted rounded-lg p-1"
        data-testid="intake-mode-tabs"
      >
        {MODES.map((mode, idx) => {
          const isActive = mode.id === activeMode;
          const isFocused = focusedModeIdx === idx;
          const enabledIdx = MODES.filter((m) => !m.disabled).findIndex((m) => m.id === mode.id);

          return (
            <button
              key={mode.id}
              ref={(el) => {
                modeTabRefs.current[enabledIdx >= 0 ? enabledIdx : idx] = el;
              }}
              role="tab"
              aria-selected={isActive}
              aria-disabled={mode.disabled ? "true" : undefined}
              tabIndex={mode.disabled ? -1 : isFocused && !mode.disabled ? 0 : -1}
              disabled={mode.disabled}
              onClick={() => handleSelectMode(mode.id)}
              onFocus={() => {
                if (!mode.disabled) {
                  const enabledIdx2 = MODES.filter((m) => !m.disabled).findIndex(
                    (m) => m.id === mode.id,
                  );
                  setFocusedModeIdx(enabledIdx2);
                }
              }}
              data-testid={`intake-tab-${mode.id}`}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm rounded-md transition-colors text-center",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                // C2 fix: disabled tab — opacity-50 + cursor-not-allowed (aria-disabled already set)
                mode.disabled
                  ? "text-muted-foreground opacity-50 cursor-not-allowed"
                  : isActive
                    ? "bg-background text-agent-abel font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Mode content */}
      <div className="flex flex-col gap-3" role="tabpanel" aria-label={`Modo ${activeMode}`}>
        {activeMode === "url" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="intake-url" className="text-sm font-medium">
              Pega una URL
            </label>
            <Input
              id="intake-url"
              type="url"
              placeholder="https://empresa.com o perfil LinkedIn de tu cliente ideal"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              data-testid="intake-url-input"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Abel analizará el contenido y propondrá un borrador del perfil.
            </p>
          </div>
        )}

        {activeMode === "archivo" && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="intake-file"
              className={cn(
                "flex flex-col items-center justify-center gap-3",
                "border-2 border-dashed border-border rounded-lg p-6 text-center",
                "cursor-pointer hover:border-agent-abel transition-colors",
                selectedFile && "border-agent-abel bg-agent-abel/5",
              )}
              data-testid="intake-file-dropzone"
            >
              <span className="text-2xl" aria-hidden="true">
                📄
              </span>
              {selectedFile ? (
                <span className="text-sm font-medium text-foreground">{selectedFile.name}</span>
              ) : (
                <>
                  <span className="text-sm font-medium">Haz clic para seleccionar un archivo</span>
                  <span className="text-xs text-muted-foreground">
                    PDF, Word, CSV — hasta 10 MB
                  </span>
                </>
              )}
            </label>
            <input
              id="intake-file"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.csv,.txt"
              onChange={handleFileChange}
              className="sr-only"
              data-testid="intake-file-input"
            />
          </div>
        )}

        {activeMode === "texto" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="intake-texto" className="text-sm font-medium">
              Describe tu cliente ideal
            </label>
            <textarea
              id="intake-texto"
              placeholder="Describe el tipo de empresa, cargo, problemas principales, presupuesto típico..."
              value={textoValue}
              onChange={(e) => setTextoValue(e.target.value)}
              rows={5}
              className={cn(
                "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
                "placeholder:text-muted-foreground focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "resize-none",
              )}
              data-testid="intake-texto-input"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Cuanto más detalle, mejor el borrador que te va a proponer Abel.
            </p>
          </div>
        )}

        {activeMode === "conectar" && (
          /* This branch is unreachable via normal navigation (mode is disabled)
           * but kept for completeness — rendered if store somehow sets it */
          <div
            className="flex flex-col items-center gap-3 py-6 text-center"
            aria-live="polite"
            data-testid="intake-conectar-placeholder"
          >
            <p className="text-sm text-muted-foreground">
              La conexión directa de fuentes requiere configurar primero una integración.
            </p>
            <Link
              href={`/${tenantId}/config/conexiones`}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md",
                "bg-muted text-foreground border border-border hover:bg-accent transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              data-testid="intake-conectar-cta"
            >
              Configurar → Conexiones
            </Link>
          </div>
        )}
      </div>

      {/* "Conectar fuente" mode — disabled explanation inline in mode tab */}
      {activeMode !== "conectar" && (
        <p className="text-xs text-muted-foreground/70" aria-live="polite">
          <span className="opacity-60">Conectar fuente: </span>
          <Link
            href={`/${tenantId}/config/conexiones`}
            className="underline hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            configurar en Conexiones
          </Link>
          {" (próximamente disponible)"}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end border-t border-border pt-3">
        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid="intake-cancel-btn"
        >
          Cancelar
        </Button>
        {/* C3 fix: agent-abel (purple) not --primary (indigo) — Abel owns this surface */}
        <Button
          onClick={() => void handleSubmit()}
          disabled={!canSubmit()}
          aria-busy={isSubmitting}
          data-testid="intake-submit-btn"
          className="bg-agent-abel hover:bg-agent-abel/90 text-white"
        >
          {isSubmitting ? "Analizando…" : "Analizar"}
        </Button>
      </div>
    </div>
  );
}
