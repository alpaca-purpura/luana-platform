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
import type { Capability } from '@/lib/types';

interface AgentSlot {
  id: string;
  emoji: string;
  name: string;
  subtitle: string;
  /** Lista de modules considerados owned por este agente */
  modules: string[];
}

const AGENTS: AgentSlot[] = [
  {
    id: 'lisa',
    emoji: '🏥',
    name: 'Lisa',
    subtitle: 'Mi Clínica',
    modules: ['brand', 'clinic', 'team', 'authority'],
  },
  {
    id: 'valeria',
    emoji: '🗓',
    name: 'Valeria',
    subtitle: 'Mi Día',
    modules: ['scheduling', 'appointments', 'agenda', 'reminders'],
  },
  {
    id: 'adrian',
    emoji: '💼',
    name: 'Adrián',
    subtitle: 'Vender',
    modules: ['sales_agent', 'offer', 'crm', 'campaigns'],
  },
  {
    id: 'lucas',
    emoji: '📣',
    name: 'Lucas',
    subtitle: 'Marketing',
    modules: ['landing', 'analytics', 'connections', 'assets'],
  },
  {
    id: 'camila',
    emoji: '🌟',
    name: 'Camila',
    subtitle: 'Cohortes + reputación',
    modules: ['reputation', 'cohorts', 'community', 'reviews'],
  },
  {
    id: 'config',
    emoji: '⚙',
    name: 'Configurar',
    subtitle: 'tenant_domains · iam',
    modules: ['iam', 'tenant_domains', 'config', 'admin'],
  },
];

const INFRA_MODULES = new Set([
  'copilot',
  'observability',
  'platform',
  'payment',
  'sales_agent_engine',
  'agentic',
  'commercial_calendar',
]);

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
      return c.status !== 'deprecated' && c.status !== 'sunset';
    });
  }, [caps, showLive, showDraft]);

  const byAgent = useMemo(() => {
    const map = new Map<string, Capability[]>();
    AGENTS.forEach((a) => map.set(a.id, []));
    const orphans: Capability[] = [];
    const infra: Capability[] = [];

    for (const c of filtered) {
      if (INFRA_MODULES.has(c.module)) {
        infra.push(c);
        continue;
      }
      const agent = AGENTS.find((a) => a.modules.includes(c.module));
      if (agent) {
        map.get(agent.id)!.push(c);
      } else {
        orphans.push(c);
      }
    }

    return { map, orphans, infra };
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

      {byAgent.infra.length > 0 && (
        <Card className="!p-4">
          <header className="flex items-baseline gap-2 mb-3 border-b border-[var(--color-border)] pb-2">
            <span aria-hidden="true" className="text-xl">
              🔧
            </span>
            <h2 className="text-sm font-semibold">Infra</h2>
            <span className="text-[10px] text-[var(--color-muted)]">
              ({byAgent.infra.length} caps)
            </span>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {byAgent.infra.map((c) => (
              <CapItem key={`${c.module}/${c.slug}`} cap={c} />
            ))}
          </div>
        </Card>
      )}

      {byAgent.orphans.length > 0 && (
        <Card className="!p-4 mt-4">
          <header className="flex items-baseline gap-2 mb-3">
            <span aria-hidden="true">❓</span>
            <h2 className="text-sm font-semibold">Otros módulos</h2>
            <span className="text-[10px] text-[var(--color-muted)]">
              ({byAgent.orphans.length} caps)
            </span>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {byAgent.orphans.map((c) => (
              <CapItem key={`${c.module}/${c.slug}`} cap={c} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function AgentSection({ agent, caps }: { agent: AgentSlot; caps: Capability[] }) {
  return (
    <Card className="!p-4 h-full">
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
        <div className="space-y-1.5">
          {caps.map((c) => (
            <CapItem key={`${c.module}/${c.slug}`} cap={c} />
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
        <span className="font-mono text-[11px] truncate flex-1">
          {cap.module}/{cap.slug}
        </span>
      </div>
      {cap.atomics.length > 0 && (
        <div className="text-[10px] text-[var(--color-muted)] mt-0.5">
          {cap.atomics.length} atomic{cap.atomics.length !== 1 ? 's' : ''}
        </div>
      )}
    </button>
  );
}
