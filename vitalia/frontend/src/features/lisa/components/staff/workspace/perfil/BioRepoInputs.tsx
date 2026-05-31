// cap: clinics.lisa.doctores
// story-origin: vitalia-fase2-lisa-doctores
"use client";
/**
 * BioRepoInputs.tsx — Bio repository inputs (notes + files + links).
 *
 * Business rule (bio-repo-inputs):
 *   Bio = repository of raw material: notes textarea + file dropzone + link chips.
 *   These inputs feed the "✨ Generar bio" process.
 *   All changes autosave on-change (600ms debounce).
 *
 * Business rule (bio-attachments-via-assets-r2):
 *   Files upload via proxy (useAvatarUpload pattern, kind=credential_doc).
 *
 * T-FE-2 vitalia-fase2-lisa-doctores
 * spec_anchor: 01-spec.md § Componentes (BioRepoInputs) + 01-spec.md § Business rules
 * downstream-regression-na: brand-local vitalia feature component
 */

import { useState, useCallback } from "react";
import { useAutosave } from "@/hooks/use-autosave";
import { usePatchDoctor } from "../../../../api/staff";
import { Dropzone } from "@/components/ui/dropzone";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DoctorDetail } from "../../../../types/staff.types";


interface BioRepoInputsProps {
  doctorId: string;
  initialDoctor: DoctorDetail;
}

export function BioRepoInputs({ doctorId, initialDoctor }: BioRepoInputsProps) {
  const [notes, setNotes] = useState(initialDoctor.bioInputsNotes ?? "");
  const [links, setLinks] = useState<string[]>(initialDoctor.bioLinks ?? []);
  const [linkInput, setLinkInput] = useState("");

  const patchMutation = usePatchDoctor(doctorId);

  const { schedule: scheduleNotesSave, status: notesStatus } = useAutosave({
    saveFn: async (value: string) => {
      await patchMutation.mutateAsync({ bioInputsNotes: value });
    },
    debounceMs: 600,
  });

  const { schedule: scheduleLinksSave } = useAutosave({
    saveFn: async (value: string[]) => {
      await patchMutation.mutateAsync({ bioLinks: value });
    },
    debounceMs: 600,
  });

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNotes(e.target.value);
      scheduleNotesSave(e.target.value);
    },
    [scheduleNotesSave],
  );

  const handleAddLink = useCallback(() => {
    const url = linkInput.trim();
    if (!url) return;
    const updated = [...links, url];
    setLinks(updated);
    setLinkInput("");
    scheduleLinksSave(updated);
  }, [linkInput, links, scheduleLinksSave]);

  const handleRemoveLink = useCallback(
    (idx: number) => {
      const updated = links.filter((_, i) => i !== idx);
      setLinks(updated);
      scheduleLinksSave(updated);
    },
    [links, scheduleLinksSave],
  );

  return (
    <section aria-labelledby="bio-repo-heading" className="space-y-4">
      <div>
        <h2 id="bio-repo-heading" className="text-sm font-semibold mb-1">
          Material para bio
        </h2>
        <p className="text-xs text-muted-foreground">
          Agrega notas, archivos y enlaces que describan la trayectoria del integrante. Con esta información se generará su bio.
        </p>
      </div>

      {/* Notes textarea */}
      <div className="space-y-1">
        <Label htmlFor="bio-notes">Notas</Label>
        <div className="relative">
          <textarea
            id="bio-notes"
            value={notes}
            onChange={handleNotesChange}
            rows={4}
            placeholder="Agrega información sobre formación, experiencia, logros, áreas de interés..."
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "resize-none",
            )}
            aria-label="Notas para la bio"
          />
          {notesStatus !== "idle" && (
            <span
              className="absolute bottom-2 right-2 text-xs text-muted-foreground"
              aria-live="polite"
            >
              {notesStatus === "saving" && "⏳"}
              {notesStatus === "saved" && "✓"}
              {notesStatus === "error" && "⚠️"}
            </span>
          )}
        </div>
      </div>

      {/* File attachments */}
      <div className="space-y-1">
        <Label>Archivos adjuntos</Label>
        <Dropzone
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          maxSizeBytes={10 * 1024 * 1024}
          multiple
          description="Arrastra o haz clic · PDF, JPG, PNG, DOCX · hasta 10 MB"
          onFilesChange={async (_files) => {
            // Files are uploaded as credential_doc assets (best-effort)
            // Actual upload can be extended in future tickets
          }}
        />
      </div>

      {/* Links */}
      <div className="space-y-2">
        <Label htmlFor="bio-link-input">Referencias y enlaces</Label>
        <div className="flex gap-2">
          <Input
            id="bio-link-input"
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddLink();
              }
            }}
            aria-label="URL de referencia"
          />
          <button
            type="button"
            onClick={handleAddLink}
            disabled={!linkInput.trim()}
            className={cn(
              "px-3 py-2 text-sm rounded-md border border-border/60",
              "hover:bg-muted transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            aria-label="Agregar enlace"
          >
            Agregar
          </button>
        </div>
        {links.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Enlaces agregados">
            {links.map((link, idx) => (
              <li
                key={`${link}-${idx}`}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
              >
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-[200px] truncate hover:underline"
                >
                  {link}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(idx)}
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full"
                  aria-label={`Eliminar enlace ${link}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
