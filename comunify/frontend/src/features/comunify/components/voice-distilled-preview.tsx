"use client";

import { cn } from "@/lib/cn";
import type { CompiledVoice } from "../types/comunify.types";

interface VoiceDistilledPreviewProps {
  compiledVoice: CompiledVoice | null;
  isLoading?: boolean;
  className?: string;
}

// Fixed: CompiledVoice has flat string/array props, no `.blocks` sub-object
const BLOCK_LABELS: Partial<Record<keyof CompiledVoice, string>> = {
  identidad: "Identidad",
  dialecto: "Dialecto",
  vocabulario: "Vocabulario",
  registro: "Registro",
  asi_no: "Así NO",
  anclajes: "Anclajes",
};

function renderValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  return String(value);
}

export function VoiceDistilledPreview({ compiledVoice, isLoading, className }: VoiceDistilledPreviewProps) {
  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-3", className)} aria-busy="true" aria-label="Cargando preview de voz">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!compiledVoice) {
    return (
      <div className={cn("rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground", className)}>
        <p>Aún no hay voz destilada. Sube tus muestras de audio y ejecuta la destilación.</p>
      </div>
    );
  }

  // All known text keys in CompiledVoice
  const allKeys = Object.keys(BLOCK_LABELS) as (keyof CompiledVoice)[];

  return (
    <div className={cn("flex flex-col gap-3", className)} aria-label="Vista previa de voz destilada">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Vista previa de voz</h3>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          Destilado
        </span>
      </div>

      <div className="grid gap-2">
        {allKeys.map((key) => {
          const value = compiledVoice[key];
          if (value === undefined || value === null) return null;
          return (
            <div key={key} className="rounded-lg border bg-card p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {BLOCK_LABELS[key] ?? key}
              </p>
              <p className="text-sm leading-relaxed">{renderValue(value)}</p>
            </div>
          );
        })}
      </div>

      {compiledVoice.confidence_score !== undefined && (
        <p className="text-xs text-muted-foreground">
          Confianza: {Math.round(compiledVoice.confidence_score * 100)}%
        </p>
      )}
    </div>
  );
}
