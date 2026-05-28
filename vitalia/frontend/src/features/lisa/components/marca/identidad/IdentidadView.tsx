// cap: brand_studio.lisa-marca
// atomics: TBD
// story-origin: vitalia-fase2-s7-TBD
"use client";

/**
 * IdentidadView.tsx — Client root for Identidad sub-sub-tab.
 *
 * Client root per ADR-vitalia-004 § 3.
 *
 * Composition:
 *   - useQuery (identity + visuals) via React Query
 *   - useIdentityAutosave / useVisualsAutosave (debounce 600ms)
 *   - useMutation for logo upload/delete
 *   - Renders IdentityCard + ClinicVerticalReadOnly + LogoDropZone +
 *     ColorTriadEditor + TypographyEditor + TeamPreviewRow
 *
 * Data hierarchy:
 *   identity → IdentityCard
 *   visuals  → ColorTriadEditor + TypographyEditor + LogoDropZone
 *   (read-only) → ClinicVerticalReadOnly + TeamPreviewRow
 *
 * Error boundary: wrapped by Suspense in page.tsx; local error rendering
 * via isError check. Loading states via Skeleton + aria-busy.
 *
 * HIPAA-lite: fetchClient auto-injects X-Tenant-ID + X-Clinic-ID.
 * PHI never in URL/searchParams. All mutations via POST/PUT body.
 *
 * T-5 vitalia-fase2-lisa-marca
 * spec_anchor: 06-tickets.yaml T-5 deliverables + 03-arch.md § 6
 * downstream-regression-na: brand-local vitalia FE component; no cross-brand consumers
 */

import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  marcaKeys,
  getIdentity,
  getVisuals,
  uploadLogo,
  deleteLogo,
} from "../../../api/marca";
import type { IdentityFormValues } from "../../../types/marca/identity-schema";
import type { ClinicVisualsFormValues } from "../../../types/marca/visuals-schema";
import { useIdentityAutosave } from "../../../hooks/useIdentityAutosave";
import { useVisualsAutosave } from "../../../hooks/useVisualsAutosave";
import { useMarcaIdentidadStore } from "../../../store/marca-identidad-store";
import { IdentityCard } from "./IdentityCard";
import { ClinicVerticalReadOnly } from "./ClinicVerticalReadOnly";
import { LogoDropZone } from "./LogoDropZone";
import { ColorTriadEditor } from "./ColorTriadEditor";
import { TypographyEditor } from "./TypographyEditor";
import { TeamPreviewRow } from "./TeamPreviewRow";

export interface IdentidadViewProps {
  /** Clerk org ID used for X-Tenant-ID header and React Query keys. */
  tenantId: string;
  /**
   * Clinic ID for HIPAA-lite dual filter (X-Clinic-ID).
   * Passed from page.tsx → Server Component → here.
   */
  clinicId?: string | null;
  className?: string;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div
      aria-label="Cargando sección Identidad"
      aria-busy="true"
      className="flex flex-col gap-4"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "rounded-lg",
            i === 0 ? "h-[120px]" : "h-[100px]",
          )}
        />
      ))}
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
    >
      <p className="font-medium">No se pudo cargar la sección Identidad.</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ── IdentidadView ─────────────────────────────────────────────────────────────

/**
 * IdentidadView — interactive client root for the Identidad sub-sub-tab.
 * Composes all 8 sub-components and manages autosave lifecycle.
 */
export function IdentidadView({
  tenantId,
  clinicId,
  className,
}: IdentidadViewProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const { setLogoUploading, logoUploading } = useMarcaIdentidadStore();

  const authOpts = { tenantId, clinicId };
  const enabled = isLoaded && !!isSignedIn;

  // ── Server data queries ──────────────────────────────────────────────────────
  const {
    data: identity,
    isLoading: identityLoading,
    isError: identityError,
    error: identityErrorObj,
  } = useQuery({
    queryKey: marcaKeys.identity(tenantId),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      return getIdentity({ ...authOpts, token });
    },
    enabled,
  });

  const {
    data: visuals,
    isLoading: visualsLoading,
    isError: visualsError,
    error: visualsErrorObj,
  } = useQuery({
    queryKey: marcaKeys.visuals(tenantId),
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      return getVisuals({ ...authOpts, token });
    },
    enabled,
  });

  // ── Autosave hooks ───────────────────────────────────────────────────────────
  const identityAutosave = useIdentityAutosave({ tenantId, clinicId });
  const visualsAutosave = useVisualsAutosave({ tenantId, clinicId });

  // ── Logo upload mutation ─────────────────────────────────────────────────────
  const logoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      return uploadLogo({ ...authOpts, token }, file);
    },
    onMutate: () => {
      setLogoUploading(true);
    },
    onSuccess: () => {
      setLogoUploading(false);
      void queryClient.invalidateQueries({ queryKey: marcaKeys.visuals(tenantId) });
    },
    onError: () => {
      setLogoUploading(false);
    },
  });

  const logoDeleteMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No autenticado");
      return deleteLogo({ ...authOpts, token });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: marcaKeys.visuals(tenantId) });
    },
  });

  // ── Visuals change handlers ──────────────────────────────────────────────────
  const handleVisualsChange = (partial: Partial<ClinicVisualsFormValues>) => {
    if (!visuals) return;
    const merged: ClinicVisualsFormValues = { ...visuals, ...partial };
    visualsAutosave.scheduleAutosave(merged);
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (!isLoaded || identityLoading || visualsLoading) {
    return (
      <div className={cn("flex flex-col gap-6 p-6", className)}>
        <SectionSkeleton />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (identityError) {
    const msg =
      identityErrorObj instanceof Error
        ? identityErrorObj.message
        : "Error desconocido";
    return (
      <div className={cn("flex flex-col gap-4 p-6", className)}>
        <ErrorBanner message={msg} />
      </div>
    );
  }

  if (visualsError) {
    const msg =
      visualsErrorObj instanceof Error
        ? visualsErrorObj.message
        : "Error desconocido";
    return (
      <div className={cn("flex flex-col gap-4 p-6", className)}>
        <ErrorBanner message={msg} />
      </div>
    );
  }

  // ── Section header ───────────────────────────────────────────────────────────
  return (
    <div
      className={cn("flex flex-col gap-6 p-6", className)}
      data-testid="identidad-view"
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">Identidad</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define la identidad visual y descriptiva de tu clínica — nombre,
          tagline, colores, tipografía y equipo.
        </p>
      </div>

      {/* ── Cards grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Identity form card */}
        {identity && (
          <IdentityCard
            defaultValues={{
              brand_name: identity.brand_name,
              tagline: identity.tagline,
              website: identity.website,
              industry: identity.industry,
              founding_year: identity.founding_year,
              language: identity.language,
              timezone: identity.timezone,
            }}
            onSave={(values: IdentityFormValues) => {
              identityAutosave.scheduleAutosave(values);
            }}
            autosaveStatus={identityAutosave.autosaveStatus}
            savedAt={identityAutosave.savedAt}
          />
        )}

        {/* Clinic vertical read-only */}
        {identity && (
          <ClinicVerticalReadOnly
            clinicVertical={
              (identity as unknown as { clinic_vertical?: string }).clinic_vertical ?? ""
            }
            primarySpecialties={
              (identity as unknown as { primary_specialties?: string[] })
                .primary_specialties ?? []
            }
            tenantId={tenantId}
          />
        )}

        {/* Logo drop zone */}
        <LogoDropZone
          logoUrl={visuals?.logo_url ?? null}
          onUpload={(file) => logoUploadMutation.mutate(file)}
          isUploading={logoUploading}
        />

        {/* Color triad editor */}
        <ColorTriadEditor
          primaryColor={visuals?.primary_color}
          accentColor={visuals?.accent_color}
          backgroundColor={visuals?.background_color}
          onChangePrimary={(hex) =>
            handleVisualsChange({ primary_color: hex })
          }
          onChangeAccent={(hex) =>
            handleVisualsChange({ accent_color: hex })
          }
          onChangeBackground={(hex) =>
            handleVisualsChange({ background_color: hex })
          }
        />

        {/* Typography editor */}
        <TypographyEditor
          headingFont={visuals?.font_heading}
          bodyFont={visuals?.font_body}
          onChangeHeading={(font) =>
            handleVisualsChange({ font_heading: font })
          }
          onChangeBody={(font) =>
            handleVisualsChange({ font_body: font })
          }
          className="sm:col-span-2"
        />

        {/* Team preview */}
        <TeamPreviewRow
          members={[]}
          tenantId={tenantId}
          doctoresStoryDone={false}
          isLoading={false}
          className="sm:col-span-2"
        />
      </div>

      {/* Logo delete link */}
      {visuals?.logo_url && !logoUploading && (
        <button
          type="button"
          onClick={() => logoDeleteMutation.mutate()}
          disabled={logoDeleteMutation.isPending}
          className="self-start text-xs text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label="Eliminar logo de la clínica"
        >
          {logoDeleteMutation.isPending ? "Eliminando..." : "Eliminar logo"}
        </button>
      )}
    </div>
  );
}

IdentidadView.displayName = "IdentidadView";
