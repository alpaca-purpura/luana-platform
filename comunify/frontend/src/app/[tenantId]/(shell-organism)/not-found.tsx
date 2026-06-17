// cap: comunify-shell-organism
/**
 * not-found.tsx — Shell organism route group 404.
 * T-shell — contextual 404 within the shell chrome.
 *
 * Renders inside shell (chrome intact) when agent/subtab is invalid.
 * Server Component (no "use client").
 *
 * downstream-regression-na: brand-local route; no cross-brand consumers.
 */

export default function ShellNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-5xl" aria-hidden="true">
        404
      </span>
      <h1 className="text-xl font-semibold text-foreground">Página no encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La ruta que buscas no existe. Verifica la URL o navega desde el menú.
      </p>
    </div>
  );
}
