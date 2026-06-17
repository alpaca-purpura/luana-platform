// cap: comunify-shell-organism
/**
 * [agent]/not-found.tsx — Agent-level contextual 404.
 * Renders inside shell chrome when agent slug is invalid.
 */

export default function AgentNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="text-5xl" aria-hidden="true">
        404
      </span>
      <h1 className="text-xl font-semibold text-foreground">Agente no encontrado</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Este agente no existe. Navega desde el menú lateral.
      </p>
    </div>
  );
}
