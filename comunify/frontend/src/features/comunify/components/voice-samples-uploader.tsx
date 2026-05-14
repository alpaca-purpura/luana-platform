"use client";

import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { COMUNIFY_CONFIG } from "../config/comunify.config";

interface VoiceSample {
  id: string;
  name: string;
  durationSeconds: number;
  sizeBytes: number;
  status: "pending" | "uploading" | "done" | "error";
}

interface VoiceSamplesUploaderProps {
  onUpload: (file: File) => void;
  samples?: VoiceSample[];
  totalDurationSeconds?: number;
  isUploading?: boolean;
  className?: string;
}

export function VoiceSamplesUploader({
  onUpload,
  samples = [],
  totalDurationSeconds = 0,
  isUploading = false,
  className,
}: VoiceSamplesUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        if (!(COMUNIFY_CONFIG.ACCEPTED_VOICE_MIME_TYPES as readonly string[]).includes(file.type)) return;
        if (file.size > COMUNIFY_CONFIG.MAX_VOICE_SAMPLE_BYTES) return;
        onUpload(file);
      });
    },
    [onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const minDuration = COMUNIFY_CONFIG.MIN_TOTAL_VOICE_DURATION_S;
  const progressPct = Math.min(100, (totalDurationSeconds / minDuration) * 100);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Arrastra o selecciona archivos de audio"
        aria-busy={isUploading}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border bg-card",
          "cursor-pointer hover:border-primary hover:bg-primary/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <span className="text-4xl" aria-hidden="true">🎙️</span>
        <p className="text-sm font-medium">
          {isUploading ? "Subiendo..." : "Arrastra tus muestras de voz aquí"}
        </p>
        <p className="text-xs text-muted-foreground">
          MP3, WAV, OGG, M4A · máx. 50 MB por archivo
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={COMUNIFY_CONFIG.ACCEPTED_VOICE_MIME_TYPES.join(",")}
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Duration progress */}
      {totalDurationSeconds > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Duración total: {Math.round(totalDurationSeconds)}s</span>
            <span>Mínimo: {minDuration}s</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progressPct >= 100 ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de duración de muestras"
            />
          </div>
        </div>
      )}

      {/* Samples list */}
      {samples.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Muestras cargadas">
          {samples.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
            >
              <span className="truncate font-medium">{s.name}</span>
              <span
                className={cn(
                  "ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs",
                  s.status === "done" && "bg-green-100 text-green-700",
                  s.status === "uploading" && "bg-yellow-100 text-yellow-700",
                  s.status === "error" && "bg-red-100 text-red-700",
                  s.status === "pending" && "bg-gray-100 text-gray-700"
                )}
              >
                {s.status === "done" ? `${s.durationSeconds}s` : s.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
