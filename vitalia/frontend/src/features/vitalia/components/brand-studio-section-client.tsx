/**
 * BrandStudioSectionClient — 4-section nav for Brand Studio.
 *
 * Sections: identity | contact | medical_team | testimonials.
 * Autosave on-change debounced 500ms (non-negotiable per form-runtime-array.md).
 * Uses useBrandStudioSections (query) + useBrandStudioSectionPatch (mutation).
 *
 * D9 pattern: Server Component page renders this Client Component.
 *
 * @architecture-group vitalia-ui-strings
 */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/cn";
import { useBrandStudioSections } from "@/features/vitalia/api/use-brand-studio-sections";
import { useBrandStudioSectionPatch } from "@/features/vitalia/api/use-brand-studio-section-patch";
import { MICROCOPY_BRAND_STUDIO } from "@/features/vitalia/config/microcopy";
import type { PatchBrandStudioSectionPayload } from "@/features/vitalia/api/use-brand-studio-section-patch";

export const AUTOSAVE_DEBOUNCE_MS = 500;

type SectionType = "identity" | "contact" | "medical_team" | "testimonials";

const SECTIONS: { key: SectionType; label: string }[] = [
  { key: "identity", label: MICROCOPY_BRAND_STUDIO.sections.identity },
  { key: "contact", label: MICROCOPY_BRAND_STUDIO.sections.contact },
  { key: "medical_team", label: MICROCOPY_BRAND_STUDIO.sections.medicalTeam },
  { key: "testimonials", label: MICROCOPY_BRAND_STUDIO.sections.testimonials },
];

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface BrandStudioSectionClientProps {
  initialSection?: SectionType;
}

function AutosaveBadge({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;

  const text = {
    saving: MICROCOPY_BRAND_STUDIO.autosave.saving,
    saved: MICROCOPY_BRAND_STUDIO.autosave.saved.replace("{N}", "0"),
    error: MICROCOPY_BRAND_STUDIO.autosave.error,
  }[status];

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "text-xs font-medium",
        status === "saving" && "text-gray-500",
        status === "saved" && "text-green-600",
        status === "error" && "text-red-600"
      )}
    >
      {text}
    </span>
  );
}

function SectionEditor({
  sectionType,
  sectionData,
  onDataChange,
}: {
  sectionType: SectionType;
  sectionData: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
}) {
  // Renders a generic key-value editor for the section data.
  // In production, each section would have dedicated fields.
  // This implementation provides the autosave-wired structure.

  const SECTION_FIELDS: Record<SectionType, { key: string; label: string; type: string }[]> = {
    identity: [
      { key: "clinic_name", label: "Nombre de la clínica", type: "text" },
      { key: "tagline", label: "Eslogan", type: "text" },
      { key: "logo_url", label: "URL del logo", type: "url" },
    ],
    contact: [
      { key: "email", label: "Correo de contacto", type: "email" },
      { key: "phone", label: "Teléfono", type: "tel" },
      { key: "address", label: "Dirección", type: "text" },
    ],
    medical_team: [
      { key: "team_description", label: "Descripción del equipo", type: "text" },
    ],
    testimonials: [
      { key: "testimonials_intro", label: "Introducción", type: "text" },
    ],
  };

  const fields = SECTION_FIELDS[sectionType];

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1">
          <label
            htmlFor={`${sectionType}-${field.key}`}
            className="text-sm font-medium text-gray-700"
          >
            {field.label}
          </label>
          <input
            id={`${sectionType}-${field.key}`}
            type={field.type}
            value={String(sectionData[field.key] ?? "")}
            onChange={(e) => {
              onDataChange({ ...sectionData, [field.key]: e.target.value });
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
  );
}

export function BrandStudioSectionClient({
  initialSection = "identity",
}: BrandStudioSectionClientProps) {
  const [activeSection, setActiveSection] = useState<SectionType>(initialSection);
  const [sectionData, setSectionData] = useState<Record<SectionType, Record<string, unknown>>>({
    identity: {},
    contact: {},
    medical_team: {},
    testimonials: {},
  });
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: sectionsData, isLoading, isError } = useBrandStudioSections();
  const { mutateAsync: patchSection } = useBrandStudioSectionPatch();

  // Hydrate local state from server data on load
  useEffect(() => {
    if (sectionsData?.sections) {
      const merged: Record<SectionType, Record<string, unknown>> = {
        identity: {},
        contact: {},
        medical_team: {},
        testimonials: {},
      };
      for (const section of sectionsData.sections) {
        merged[section.section_type] = section.data;
      }
      setSectionData(merged);
    }
  }, [sectionsData]);

  const triggerAutosave = useCallback(
    (type: SectionType, data: Record<string, unknown>) => {
      // Cancel pending debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);

      setAutosaveStatus("saving");

      // 500ms debounce — non-negotiable per form-runtime-array.md
      debounceRef.current = setTimeout(async () => {
        try {
          const payload: PatchBrandStudioSectionPayload = {
            section_type: type,
            data,
          };
          await patchSection(payload);
          setAutosaveStatus("saved");
        } catch {
          setAutosaveStatus("error");
        }
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [patchSection]
  );

  function handleDataChange(data: Record<string, unknown>) {
    setSectionData((prev) => ({ ...prev, [activeSection]: data }));
    triggerAutosave(activeSection, data);
  }

  if (isLoading) {
    return (
      <div
        className="flex flex-col gap-4"
        aria-busy="true"
        aria-label="Cargando Brand Studio"
      >
        <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" aria-hidden="true" />
        <div className="h-32 rounded-lg border border-gray-200 bg-gray-100 animate-pulse" aria-hidden="true" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        <p className="font-medium">No se pudo cargar el Brand Studio.</p>
        <p className="mt-1 text-xs">
          {MICROCOPY_BRAND_STUDIO.autosave.error}{" "}
          <button
            type="button"
            className="underline font-medium"
            onClick={() => window.location.reload()}
          >
            {MICROCOPY_BRAND_STUDIO.autosave.retry}
          </button>
        </p>
      </div>
    );
  }

  const hasContent = Object.values(sectionData).some(
    (d) => Object.keys(d).length > 0
  );

  if (!hasContent && !isLoading) {
    // Empty state — show CTA
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {MICROCOPY_BRAND_STUDIO.title}
          </h2>
          <p className="text-sm text-gray-500">{MICROCOPY_BRAND_STUDIO.subtitle}</p>
        </div>
        <AutosaveBadge status={autosaveStatus} />
      </div>

      {/* Section navigation */}
      <nav
        aria-label="Secciones de Brand Studio"
        className="flex gap-1 border-b border-gray-200 overflow-x-auto"
      >
        {SECTIONS.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => setActiveSection(section.key)}
            aria-current={activeSection === section.key ? "page" : undefined}
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              "border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t",
              activeSection === section.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {section.label}
          </button>
        ))}
      </nav>

      {/* Section content */}
      <div
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Sección: ${SECTIONS.find((s) => s.key === activeSection)?.label ?? ""}`}
      >
        <SectionEditor
          sectionType={activeSection}
          sectionData={sectionData[activeSection]}
          onDataChange={handleDataChange}
        />
      </div>
    </div>
  );
}
