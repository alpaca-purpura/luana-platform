// cap: shell-organism.shell-nicolify
/**
 * AgentAvatar.stories.tsx — CSF3 stories para AgentAvatar.
 *
 * Cubre los 6 agentes de Nicolify (Luana + 5 Ribbon) en los 3 tamaños.
 * También verifica el fallback de imagen (initial letter cuando 404).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AGENT_CATALOG } from "@/lib/agent-catalog";

import { AgentAvatar } from "./AgentAvatar";

const meta: Meta<typeof AgentAvatar> = {
  title: "Shell/Agentes/AgentAvatar",
  component: AgentAvatar,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    slug: {
      control: "select",
      options: ["luana", "abel", "brenda", "christian", "sara", "norvil"],
      description: "Identificador del agente",
    },
    size: {
      control: "radio",
      options: ["sm", "md", "lg"],
      description: "Tamaño del avatar",
    },
    name: {
      control: "text",
    },
    initial: {
      control: "text",
    },
    thumbnail: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AgentAvatar>;

const catalog = AGENT_CATALOG;

/** Avatar de Luana — orquestadora, color índigo. */
export const Luana: Story = {
  args: {
    slug: catalog.luana.slug,
    name: catalog.luana.name,
    initial: catalog.luana.initial,
    thumbnail: catalog.luana.thumbnail,
    size: "md",
  },
};

/** Avatar de Abel — estrategia ICP, color violeta. */
export const Abel: Story = {
  args: {
    slug: catalog.abel.slug,
    name: catalog.abel.name,
    initial: catalog.abel.initial,
    thumbnail: catalog.abel.thumbnail,
    size: "md",
  },
};

/** Tamaño sm (24px) — usado en el nav compacto. */
export const TamanoSm: Story = {
  args: {
    ...Abel.args,
    size: "sm",
  },
};

/** Tamaño lg (48px) — usado en paneles de detalle. */
export const TamanoLg: Story = {
  args: {
    ...Abel.args,
    size: "lg",
  },
};

/** Fallback con initial — thumbnail inválida, muestra la letra del agente. */
export const FallbackInitial: Story = {
  args: {
    slug: "brenda",
    name: "Brenda",
    initial: "B",
    thumbnail: "/ruta-que-no-existe.svg",
    size: "md",
  },
};

/** Los 6 agentes lado a lado — tamaño md. */
export const TodosLosAgentes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(["luana", "abel", "brenda", "christian", "sara", "norvil"] as const).map((slug) => {
        const agent = catalog[slug];
        return (
          <div key={slug} className="flex flex-col items-center gap-2">
            <AgentAvatar
              slug={agent.slug}
              name={agent.name}
              initial={agent.initial}
              thumbnail={agent.thumbnail}
              size="lg"
            />
            <span className="text-xs text-muted-foreground">{agent.name}</span>
          </div>
        );
      })}
    </div>
  ),
};

/** Los 6 agentes en tamaño sm. */
export const TodosLosAgentesSmall: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      {(["luana", "abel", "brenda", "christian", "sara", "norvil"] as const).map((slug) => {
        const agent = catalog[slug];
        return (
          <AgentAvatar
            key={slug}
            slug={agent.slug}
            name={agent.name}
            initial={agent.initial}
            thumbnail={agent.thumbnail}
            size="sm"
          />
        );
      })}
    </div>
  ),
};
