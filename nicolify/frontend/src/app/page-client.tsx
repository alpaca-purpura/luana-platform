"use client";

/**
 * HomeClient — Client island para el root placeholder autenticado de Nicolify.
 *
 * Responsabilidades:
 * 1. Leer sesión Clerk (useAuth) — JWT + tenant_id desde publicMetadata
 * 2. Intentar fetchClient al BE (para verificar vertical slice auth — Scenario 5)
 * 3. Manejar error BE 500 gracefully — mensaje español neutro TUTEO, sin white-screen
 *    (Scenario 7: "fe-network-failure")
 *
 * Accesibilidad:
 * - aria-busy en loading state
 * - role="alert" en error state (WCAG — live region)
 * - Mensaje español neutro TUTEO (spanish-text.md: sin voseo)
 *
 * T-3 (nicolify-r0-dev-stack): auth vertical slice Client island.
 */

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

import { ApiError, fetchClient } from "@/lib/api/fetch-client";

interface HealthResponse {
  status: string;
  brand: string;
  version: string;
}

type ConnectionState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error"; message: string };

/**
 * Extracts error message for connection failures (Scenario 7).
 * Returns Spanish neutro TUTEO message suitable for user display.
 */
function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.status >= 500) {
    return "No pudimos conectar con el servidor. Reintenta en unos segundos.";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Ocurrió un error inesperado. Reintenta en unos segundos.";
}

/**
 * HomeClient — Client island for Nicolify root page.
 * Handles auth vertical slice (Scenario 5) and BE failure (Scenario 7).
 */
export function HomeClient() {
  const { isLoaded, isSignedIn, getToken, sessionClaims } = useAuth();
  const [connection, setConnection] = useState<ConnectionState>({
    kind: "idle",
  });

  // Derive tenantId from Clerk publicMetadata
  // Clerk stores tenant_id in publicMetadata (set during seed --clerk-sync)
  const tenantId =
    (sessionClaims?.publicMetadata as { tenant_id?: string } | undefined)?.tenant_id ?? "";

  const handleRetry = useCallback(() => {
    setConnection({ kind: "idle" });
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const check = async () => {
      setConnection({ kind: "loading" });
      try {
        const token = await getToken();
        if (!token) {
          setConnection({
            kind: "error",
            message: "No pudimos obtener tu sesión. Recarga la página.",
          });
          return;
        }

        // Health check via fetchClient (verifies tenant isolation headers work)
        const data = await fetchClient<HealthResponse>("/api/health", {
          token,
          tenantId,
        });
        setConnection({ kind: "ok", data });
      } catch (err) {
        // Scenario 7: graceful BE failure — no white-screen
        console.error("[nicolify] HomeClient connection error:", err);
        setConnection({ kind: "error", message: getErrorMessage(err) });
      }
    };

    void check();
  }, [isLoaded, isSignedIn, getToken, tenantId]);

  if (!isLoaded) {
    return (
      <div
        aria-busy="true"
        aria-label="Cargando sesión"
        className="flex flex-col items-center gap-4"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    // Should not reach here (proxy redirects unauthenticated) — but guard defensively
    return null;
  }

  if (connection.kind === "loading" || connection.kind === "idle") {
    return (
      <div
        aria-busy="true"
        aria-label="Verificando conexión con el servidor"
        className="flex flex-col items-center gap-4"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
        <p className="text-sm text-muted-foreground">Conectando...</p>
      </div>
    );
  }

  if (connection.kind === "error") {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center"
      >
        <p className="text-sm font-medium text-destructive">{connection.message}</p>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={handleRetry}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // connection.kind === "ok"
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido a Nicolify</h1>
        <p className="text-muted-foreground">Tu equipo de Revenue &amp; Operaciones está listo.</p>
      </div>
      <p className="rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">
        Conectado · {connection.data.brand} {connection.data.version}
      </p>
    </div>
  );
}
