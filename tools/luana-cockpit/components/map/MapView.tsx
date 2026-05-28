'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Badge';
import { useDrawer } from '@/components/providers/DrawerProvider';
import { useBrand } from '@/components/providers/BrandProvider';
import { useFileWatchEvents } from '@/components/providers/FileWatchProvider';
import { listCapabilities } from '@/lib/api-client';
import type { AgentOwner, Capability } from '@/lib/types';

interface AgentSlot {
  id: AgentOwner;
  emoji: string;
  name: string;
  subtitle: string;
}

const AGENTS: AgentSlot[] = [
  { id: 'lisa', emoji: '🏥', name: 'Lisa', subtitle: 'Mi Clínica' },
  { id: 'valeria', emoji: '🗓', name: 'Valeria', subtitle: 'Mi Día' },
  { id: 'adrian', emoji: '💼', name: 'Adrián', subtitle: 'Vender' },
  { id: 'lucas', emoji: '📣', name: 'Lucas', subtitle: 'Marketing' },
  { id: 'camila', emoji: '🌟', name: 'Camila', subtitle: 'Reputación + cohortes' },
  { id: 'config', emoji: '⚙', name: 'Configurar', subtitle: 'tenant · iam · compliance' },
];

// Infra es un agente especial (renderiza al final, plegado por default)
const INFRA_AGENT: AgentSlot = {
  id: 'infra',
  emoji: '🔧',
  name: 'Infra Vitalia',
  subtitle: 'observability · platform · payment · scaffolding',
};

const STATUS_CLASSES: Record<string, string> = {
  live: 'bg-[#14532d] text-[#86efac]',
  beta: 'bg-[#713f12] text-[#fbbf24]',
  deprecated: 'bg-[#3f3f46] text-[#d4d4d8]',
  sunset: 'bg-[#450a0a] text-[#fca5a5]',
};

export function MapView() {
  const { brand } = useBrand();
  const [caps, setCaps] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLive, setShowLive] = useState(true);
  const [showDraft, setShowDraft] = useState(false);
  const [showInfra, setShowInfra] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listCapabilities(brand)
      .then(setCaps)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [brand]);

  useEffect(() => {
    load();
  }, [load]);

  // Live reload cuando un capability YAML cambia
  useFileWatchEvents((event) => {
    if (event.brand && event.brand !== brand) return;
    if (event.docType === 'capability') {
      load();
    }
  });

  const filtered = useMemo(() => {
    return caps.filter((c) => {
      if (c.status === 'live' && !showLive) return false;
      if (c.status === 'beta' && !showDraft) return false;
      if (c.status === 'deprecated' || c.status === 'sunset') return false;
      // v3 · ocultar infra (user_visible: false) salvo toggle
      if (c.user_visible === false && !showInfra) return false;
      return true;
    });
  }, [caps, showLive, showDraft, showInfra]);

  const byAgent = useMemo(() => {
    const map = new Map<AgentOwner, Capability[]>();
    AGENTS.forEach((a) => map.set(a.id, []));
    map.set('infra', []);
    const orphans: Capability[] = [];

    for (const c of filtered) {
      // Filter superseded (oculto del mapa principal)
      if (c.superseded_by) continue;

      const owner = c.agent_owner;
      if (!owner) {
        // Cap sin agent_owner declarado · warning
        orphans.push(c);
        continue;
      }
      const bucket = map.get(owner);
      if (bucket) {
        bucket.push(c);
      } else {
        // agent_owner con valor fuera del set (shouldn't happen) · orphan
        orphans.push(c);
      }
    }

    return { map, orphans };
  }, [filtered]);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Spinner /> Cargando capabilities…
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

  return (
    <div className="p-6">
      <header className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">Mapa Implementado · capabilities live</h1>
          <p className="text-[11px] text-[var(--color-muted)] italic mt-1">
            Solo capabilities <b>cementadas (live)</b>. Las developing viven en
            el Backlog Board.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              className="!w-auto"
              checked={showLive}
              onChange={(e) => setShowLive(e.target.checked)}
            />
            live ✓ ({filtered.filter((c) => c.status === 'live').length})
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              className="!w-auto"
              checked={showDraft}
              onChange={(e) => setShowDraft(e.target.checked)}
            />
            beta ⚪ ({caps.filter((c) => c.status === 'beta').length})
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              className="!w-auto"
              checked={showInfra}
              onChange={(e) => setShowInfra(e.target.checked)}
            />
            infra 🔧 ({caps.filter((c) => c.user_visible === false).length})
          </label>
          <div className="text-[var(--color-muted)]">
            total: {caps.length}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {AGENTS.map((agent) => (
          <AgentSection
            key={agent.id}
            agent={agent}
            caps={byAgent.map.get(agent.id) ?? []}
          />
        ))}
      </div>

      {showInfra && (byAgent.map.get('infra') ?? []).length > 0 && (
        <AgentSection
          agent={INFRA_AGENT}
          caps={byAgent.map.get('infra') ?? []}
          fullWidth
        />
      )}

      {byAgent.orphans.length > 0 && (
        <Card className="!p-4 mt-4 border-red-700">
          <header className="flex items-baseline gap-2 mb-3">
            <span aria-hidden="true">⚠️</span>
            <h2 className="text-sm font-semibold text-red-400">
              Capabilities sin agent_owner declarado
            </h2>
            <span className="text-[10px] text-[var(--color-muted)]">
              ({byAgent.orphans.length} caps · v3 schema incompleto)
            </span>
          </header>
          <div className="text-[11px] text-[var(--color-muted)] mb-2">
            Estos caps necesitan refining para declarar `agent_owner` + `functional_area` per ADR-vitalia-005.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {byAgent.orphans.map((c, i) => (
              <CapItem key={capKey(c, i)} cap={c} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function AgentSection({
  agent,
  caps,
  fullWidth = false,
}: {
  agent: AgentSlot;
  caps: Capability[];
  fullWidth?: boolean;
}) {
  // Group by functional_area dentro del agent
  const byArea = new Map<string, Capability[]>();
  for (const c of caps) {
    const area = c.functional_area ?? `${agent.id}.sin-area`;
    if (!byArea.has(area)) byArea.set(area, []);
    byArea.get(area)!.push(c);
  }
  const areas = Array.from(byArea.entries()).sort();

  return (
    <Card className={`!p-4 h-full ${fullWidth ? 'col-span-full' : ''}`}>
      <header className="flex items-baseline gap-2 mb-3 border-b border-[var(--color-border)] pb-2">
        <span aria-hidden="true" className="text-xl">
          {agent.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold">{agent.name}</h2>
          <p className="text-[10px] text-[var(--color-muted)]">
            {agent.subtitle}
          </p>
        </div>
        <span className="text-[10px] text-[var(--color-muted)] shrink-0">
          {caps.length}
        </span>
      </header>
      {caps.length === 0 ? (
        <EmptyState>Sin capabilities todavía.</EmptyState>
      ) : (
        <div className="space-y-3">
          {areas.map(([area, areaCaps]) => (
            <div key={area}>
              <div className="text-[10px] text-[var(--color-muted)] mb-1 font-mono uppercase tracking-wide">
                {area.replace(`${agent.id}.`, '')}
              </div>
              <div className={fullWidth ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2' : 'space-y-1.5'}>
                {areaCaps.map((c, i) => (
                  <CapItem key={capKey(c, i)} cap={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CapItem({ cap }: { cap: Capability }) {
  const { openCap } = useDrawer();
  return (
    <button
      type="button"
      onClick={() => openCap(cap.module, cap.slug)}
      className={cn(
        'w-full text-left px-2 py-1.5 rounded border text-xs transition-colors',
        'bg-[var(--color-panel)] border-[var(--color-border)]',
        'hover:border-[#3a4358] hover:bg-[var(--color-panel2)]'
      )}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <Pill className={STATUS_CLASSES[cap.status] ?? 'bg-[#1f2937]'}>
          {cap.status}
        </Pill>
        <span className="text-[11px] flex-1 truncate">
          {cap.user_facing_name ?? `${cap.module}/${cap.slug}`}
        </span>
      </div>
      <div className="text-[10px] text-[var(--color-muted)] mt-0.5 font-mono truncate">
        {cap.module}/{cap.slug}
        {cap.atomics.length > 0 && (
          <span className="ml-2">· {cap.atomics.length} atomic{cap.atomics.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </button>
  );
}

/**
 * Genera React key única para un cap. Algunos caps llegan con module/slug
 * vacíos (YAML mal formado, schema v2 incompleto) — el patrón ${module}/${slug}
 * colapsaba en "/" duplicado. Fallback chain: capability_id > path > index.
 */
function capKey(cap: Capability, index: number): string {
  if (cap.capability_id) return `id:${cap.capability_id}`;
  if (cap.path) return `path:${cap.path}`;
  if (cap.module && cap.slug) return `${cap.module}/${cap.slug}`;
  return `idx:${index}:${cap.module ?? '?'}/${cap.slug ?? '?'}`;
}
