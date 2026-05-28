'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Badge, Pill } from '@/components/ui/Badge';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { useBrand } from '@/components/providers/BrandProvider';
import { useFileWatchEvents } from '@/components/providers/FileWatchProvider';
import { getSystemMap, openInEditor } from '@/lib/api-client';
import type { SystemMap, AreaStatus, CrossAgentFlow, AgentOwner } from '@/lib/types';

const STATUS_BADGES: Record<AreaStatus, { label: string; cls: string }> = {
  live: { label: 'live', cls: 'bg-[#14532d] text-[#86efac]' },
  beta: { label: 'beta', cls: 'bg-[#713f12] text-[#fbbf24]' },
  planned: { label: 'planned', cls: 'bg-[#1f2937] text-[#94a3b8]' },
  deprecated: { label: 'deprecated', cls: 'bg-[#450a0a] text-[#fca5a5]' },
};

export function ArchitectureView() {
  const { brand } = useBrand();
  const [systemMap, setSystemMap] = useState<SystemMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getSystemMap(brand)
      .then(setSystemMap)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [brand]);

  useEffect(() => {
    load();
  }, [load]);

  // Live reload cuando SYSTEM-MAP cambia
  useFileWatchEvents((event) => {
    if (event.brand && event.brand !== brand) return;
    if (event.path?.includes('SYSTEM-MAP.yaml')) {
      load();
    }
  });

  async function handleEditYaml() {
    if (!systemMap?._path) return;
    try {
      await openInEditor(systemMap._path);
      toast.success('SYSTEM-MAP.yaml abierto');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Spinner /> Cargando arquitectura…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6">
        <ErrorBanner message={error} />
      </div>
    );
  }
  if (!systemMap) {
    return (
      <div className="p-6">
        <EmptyState>SYSTEM-MAP.yaml no disponible.</EmptyState>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">🏗 Arquitectura del producto</h1>
          <p className="text-[11px] text-[var(--color-muted)] mt-1">
            SSoT estructural · ADR-vitalia-005 · schema v{systemMap.version} · cement {systemMap.cement_date}
          </p>
        </div>
        <Button size="sm" onClick={handleEditYaml}>
          <ExternalLink className="w-3 h-3" />
          Editar SYSTEM-MAP.yaml
        </Button>
      </header>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="!p-3">
          <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-wide">Agentes</div>
          <div className="text-2xl font-semibold mt-1">{systemMap.metadata.total_agents}</div>
        </Card>
        <Card className="!p-3">
          <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-wide">Áreas funcionales</div>
          <div className="text-2xl font-semibold mt-1">{systemMap.metadata.total_functional_areas}</div>
        </Card>
        <Card className="!p-3">
          <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-wide">Flujos cross-agent</div>
          <div className="text-2xl font-semibold mt-1">{systemMap.metadata.total_cross_agent_flows}</div>
        </Card>
        <Card className="!p-3">
          <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-wide">Data entities</div>
          <div className="text-2xl font-semibold mt-1">{systemMap.metadata.total_data_entities}</div>
        </Card>
      </div>

      {/* Jerarquía completa */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">🌳 Jerarquía completa</h2>
        <HierarchyTree systemMap={systemMap} />
      </Card>

      {/* Mermaid diagrama */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">📊 Diagrama Mermaid</h2>
        <MermaidDiagram systemMap={systemMap} />
      </Card>

      {/* Flujos cross-agent */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">
          🔄 Flujos cross-agent ({systemMap.cross_agent_flows.length})
        </h2>
        {systemMap.cross_agent_flows.length === 0 ? (
          <EmptyState>Sin flujos declarados.</EmptyState>
        ) : (
          <div className="space-y-3">
            {systemMap.cross_agent_flows.map((flow) => (
              <FlowCard key={flow.id} flow={flow} />
            ))}
          </div>
        )}
      </Card>

      {/* Data ownership matrix */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">
          📦 Data ownership ({Object.keys(systemMap.data_ownership).length} entities)
        </h2>
        <DataOwnershipTable ownership={systemMap.data_ownership} />
      </Card>

      {/* Áreas planificadas */}
      <Card>
        <h2 className="text-sm font-semibold mb-3">
          📋 Áreas planificadas (sin caps shipped todavía)
        </h2>
        <PlannedAreasList systemMap={systemMap} />
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// HierarchyTree
// ────────────────────────────────────────────────────────────────────────────

function HierarchyTree({ systemMap }: { systemMap: SystemMap }) {
  return (
    <ul className="text-xs space-y-2">
      {systemMap.agents.map((agent) => (
        <li key={agent.id}>
          <div className="font-medium flex items-center gap-2">
            <span>{agent.emoji}</span>
            <span>{agent.name}</span>
            <span className="text-[var(--color-muted)] text-[10px]">{agent.subtitle}</span>
            <span className="text-[10px] text-[var(--color-muted)] ml-auto">
              {agent.functional_areas.length} áreas
            </span>
          </div>
          <ul className="ml-6 mt-1 space-y-0.5">
            {agent.functional_areas.map((area) => {
              const badge = STATUS_BADGES[area.status];
              return (
                <li key={area.id} className="flex items-center gap-2 text-[11px]">
                  <span className="font-mono text-[var(--color-muted)] text-[10px]">
                    {agent.id}.{area.id}
                  </span>
                  <span>{area.name}</span>
                  <Pill className={`${badge.cls} text-[9px] py-0`}>{badge.label}</Pill>
                  {area.target_release && (
                    <span className="text-[9px] text-[var(--color-muted)]">
                      → {area.target_release}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MermaidDiagram (text-based · evita dep mermaid runtime)
// ────────────────────────────────────────────────────────────────────────────

function MermaidDiagram({ systemMap }: { systemMap: SystemMap }) {
  const mermaidText = generateMermaidGraph(systemMap);
  return (
    <div className="space-y-2">
      <pre className="text-[10px] bg-[var(--color-panel2)] border border-[var(--color-border)] p-3 rounded overflow-x-auto whitespace-pre leading-relaxed">
        {mermaidText}
      </pre>
      <p className="text-[10px] text-[var(--color-muted)]">
        Copia este código a{' '}
        <a
          href="https://mermaid.live"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-accent)] hover:underline"
        >
          mermaid.live
        </a>{' '}
        para visualizar el diagrama.
      </p>
    </div>
  );
}

function generateMermaidGraph(systemMap: SystemMap): string {
  const lines: string[] = ['graph TB'];
  lines.push('  vitalia[Vitalia · brand]');
  for (const agent of systemMap.agents) {
    lines.push(`  vitalia --> ${agent.id}[${agent.emoji} ${agent.name}]`);
    for (const area of agent.functional_areas) {
      const nodeId = `${agent.id}_${area.id}`.replace(/-/g, '_');
      const statusEmoji =
        area.status === 'live'
          ? '✓'
          : area.status === 'planned'
            ? '📋'
            : area.status === 'beta'
              ? '⚙'
              : '⊘';
      lines.push(`  ${agent.id} --> ${nodeId}[${statusEmoji} ${area.name}]`);
    }
  }
  // Cross-agent flows
  for (const flow of systemMap.cross_agent_flows) {
    const fromNode = `${flow.trigger.agent}_${flow.trigger.area}`.replace(/-/g, '_');
    for (const action of flow.actions) {
      const toNode = `${action.agent}_${action.area}`.replace(/-/g, '_');
      lines.push(`  ${fromNode} -.->|${flow.id}| ${toNode}`);
    }
  }
  return lines.join('\n');
}

// ────────────────────────────────────────────────────────────────────────────
// FlowCard
// ────────────────────────────────────────────────────────────────────────────

function FlowCard({ flow }: { flow: CrossAgentFlow }) {
  const badge = STATUS_BADGES[flow.status];
  return (
    <div className="border border-[var(--color-border)] rounded p-3 bg-[var(--color-panel)] text-xs">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="font-mono text-[10px]">{flow.id}</span>
        <Pill className={`${badge.cls} text-[9px] py-0`}>{badge.label}</Pill>
        <Pill className="bg-[var(--color-panel2)] border border-[var(--color-border)] text-[9px] py-0">
          {flow.mechanism}
        </Pill>
        {flow.event_name && (
          <span className="text-[10px] text-[var(--color-muted)] font-mono">
            event: {flow.event_name}
          </span>
        )}
        {flow.endpoint && (
          <span className="text-[10px] text-[var(--color-muted)] font-mono">{flow.endpoint}</span>
        )}
        {flow.table && (
          <span className="text-[10px] text-[var(--color-muted)] font-mono">table: {flow.table}</span>
        )}
        {flow.target_release && (
          <span className="text-[9px] text-[var(--color-muted)]">→ {flow.target_release}</span>
        )}
      </div>
      <div className="text-[11px] space-y-1">
        <div>
          <strong>Trigger:</strong>{' '}
          <span className="font-mono text-[10px]">
            {flow.trigger.agent}.{flow.trigger.area}
          </span>{' '}
          · {flow.trigger.condition}
        </div>
        <ul className="list-disc list-inside text-[var(--color-muted)] space-y-0.5 mt-1">
          {flow.actions.map((action, i) => (
            <li key={i}>
              <strong className="text-[var(--color-text)] font-mono text-[10px]">
                {action.agent}.{action.area}:
              </strong>{' '}
              {action.what}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DataOwnershipTable
// ────────────────────────────────────────────────────────────────────────────

function DataOwnershipTable({
  ownership,
}: {
  ownership: SystemMap['data_ownership'];
}) {
  const entries = Object.entries(ownership);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead className="text-[10px] text-[var(--color-muted)] uppercase tracking-wide">
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left p-2">Entity</th>
            <th className="text-left p-2">Module</th>
            <th className="text-left p-2">Owner agent</th>
            <th className="text-left p-2">Consumed by</th>
            <th className="text-left p-2">PHI</th>
            <th className="text-left p-2">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, ent]) => (
            <tr key={name} className="border-b border-[var(--color-border)] hover:bg-[var(--color-panel)]">
              <td className="p-2 font-medium">{name}</td>
              <td className="p-2 font-mono text-[10px]">{ent.owner_module}</td>
              <td className="p-2">{ent.owner_agent}</td>
              <td className="p-2 text-[10px] text-[var(--color-muted)]">
                {ent.consumed_by.join(', ')}
              </td>
              <td className="p-2">{ent.phi ? '🔒 PHI' : '—'}</td>
              <td className="p-2 text-[10px] text-[var(--color-muted)] max-w-xs leading-relaxed">
                {ent.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PlannedAreasList
// ────────────────────────────────────────────────────────────────────────────

interface PlannedArea {
  agent: AgentOwner;
  agentEmoji: string;
  areaId: string;
  areaName: string;
  targetRelease?: string | null;
  description?: string;
}

function PlannedAreasList({ systemMap }: { systemMap: SystemMap }) {
  const planned: PlannedArea[] = [];

  for (const agent of systemMap.agents) {
    for (const area of agent.functional_areas) {
      if (area.status === 'planned') {
        planned.push({
          agent: agent.id,
          agentEmoji: agent.emoji,
          areaId: area.id,
          areaName: area.name,
          targetRelease: area.target_release,
          description: area.description,
        });
      }
    }
  }

  // Ordenar por target_release (TBD/null al final)
  planned.sort((a, b) => {
    if (!a.targetRelease && !b.targetRelease) return 0;
    if (!a.targetRelease) return 1;
    if (!b.targetRelease) return -1;
    return a.targetRelease.localeCompare(b.targetRelease);
  });

  if (planned.length === 0) {
    return <EmptyState>No hay áreas planificadas pendientes.</EmptyState>;
  }

  return (
    <ul className="space-y-2">
      {planned.map((p) => (
        <li
          key={`${p.agent}.${p.areaId}`}
          className="flex items-start gap-2 text-[11px] border-l-2 border-[var(--color-border)] pl-3"
        >
          <span className="mt-0.5">{p.agentEmoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] text-[var(--color-muted)]">
                {p.agent}.{p.areaId}
              </span>
              <span className="font-medium">{p.areaName}</span>
              <Badge className="bg-[var(--color-panel2)] border border-[var(--color-border)] text-[9px] py-0 px-1.5">
                {p.targetRelease ?? 'TBD'}
              </Badge>
            </div>
            {p.description && (
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5 leading-relaxed">
                {p.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
