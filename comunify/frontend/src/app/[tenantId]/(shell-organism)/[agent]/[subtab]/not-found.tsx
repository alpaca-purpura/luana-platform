// cap: comunify-shell-organism
/**
 * [subtab]/not-found.tsx — Subtab-level contextual 404.
 * Renders inside shell chrome when agent or subtab slug is invalid.
 */

export default function SubtabNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-5xl" aria-hidden="true">
        404
      </span>
      <h1 className="text-xl font-semibold text-foreground">Sección no encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Esta sección no existe. Navega desde el menú lateral.
      </p>
    </div>
  );
}
