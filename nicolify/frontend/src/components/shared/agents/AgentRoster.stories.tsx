// cap: shell-organism.shell-nicolify
/**
 * AgentRoster.stories.tsx — Roster doc-story para los 6 agentes de Nicolify.
 *
 * Muestra todos los agentes con su estado de implementación:
 *   - Construido (✅): Luana, Abel
 *   - Pendiente (🔜): Brenda, Christian, Sara, Norvil
 *
 * Esta story es puramente documental — compone AgentAvatar (componente real)
 * con una píldora de estado. NO crea componentes nuevos que representen
 * agentes pendientes (sin runtime, sin story falsa).
 *
 * Mantener sincronizado con SHELL-DESIGN-CONTRACT.md § Agentes.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AGENT_CATALOG, type AgentSlug } from "@/lib/agent-catalog";

import { AgentAvatar } from "./AgentAvatar";

// ── Estado de implementación por agente ────────────────────────────────────────

type AgentBuildStatus = "construido" | "pendiente";

const AGENT_BUILD_STATUS: Record<AgentSlug, AgentBuildStatus> = {
  luana: "construido",
  abel: "construido",
  brenda: "pendiente",
  christian: "pendiente",
  sara: "pendiente",
  norvil: "pendiente",
};

// ── Componente de roster inline ────────────────────────────────────────────────

function RosterCard({ slug }: { slug: AgentSlug }) {
  const agent = AGENT_CATALOG[slug];
  const status = AGENT_BUILD_STATUS[slug];
  const isConstruido = status === "construido";

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border/60 bg-card w-36">
      <AgentAvatar
        slug={agent.slug}
        name={agent.name}
        initial={agent.initial}
        thumbnail={agent.thumbnail}
        size="lg"
      />
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-sm font-semibold text-foreground">{agent.name}</span>
        <span className="text-xs text-muted-foreground leading-tight">{agent.role}</span>
      </div>
      <span
        className={
          isConstruido
            ? "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground"
        }
        aria-label={`Estado: ${isConstruido ? "construido" : "pendiente"}`}
      >
        {isConstruido ? "✅ Construido" : "🔜 Pendiente"}
      </span>
    </div>
  );
}

function AgentRosterDoc() {
  const slugs: AgentSlug[] = ["luana", "abel", "brenda", "christian", "sara", "norvil"];

  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">Equipo de agentes — Nicolify</h2>
        <p className="text-sm text-muted-foreground">
          6 agentes: Luana (orquestadora sidebar) + 5 especialistas Ribbon. Estado de implementación
          por release.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        {slugs.map((slug) => (
          <RosterCard key={slug} slug={slug} />
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Leyenda
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>✅ Construido — runtime + story completados</span>
          <span>🔜 Pendiente — sin componente runtime aún (release futuro)</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Avatares: SVG placeholder en{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            public/agents/{"{slug}"}/avatar.svg
          </code>{" "}
          — Chris entrega los finales. No regenerar.
        </p>
      </div>
    </div>
  );
}

// ── Meta + Story ───────────────────────────────────────────────────────────────

const meta: Meta = {
  title: "Agentes/Roster",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj;

/**
 * Roster completo — los 6 agentes con su estado actual de implementación.
 * Actualizar AGENT_BUILD_STATUS cuando se complete cada agente.
 */
export const RosterCompleto: Story = {
  render: () => <AgentRosterDoc />,
};
