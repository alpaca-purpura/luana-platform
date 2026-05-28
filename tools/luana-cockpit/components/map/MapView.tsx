'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Badge';
import { useDrawer } from '@/components/providers/DrawerProvider';
import { useBrand } from '@/components/providers/BrandProvider';
import { useFileWatchEvents } from '@/components/providers/FileWatchProvider';
import { listCapabilities, getSystemMap, openInEditor, getCapabilityStatus } from '@/lib/api-client';
import type {
  Capability,
  SystemMap,
  AreaStatus,
  AgentDefinition,
  FunctionalArea,
  ComputedStatusReport,
  CapStatusComputed,
} from '@/lib/types';
import { getStatusBadge } from '@/lib/types';

const STATUS_CLASSES: Record<string, string> = {
  live: 'bg-[#14532d] text-[#86efac]',
  beta: 'bg-[#713f12] text-[#fbbf24]',
  deprecated: 'bg-[#3f3f46] text-[#d4d4d8]',
  sunset: 'bg-[#450a0a] text-[#fca5a5]',
};

const STATUS_BADGES: Record<AreaStatus, { label: string; cls: string }> = {
  live: { label: 'live', cls: 'bg-[#14532d] text-[#86efac]' },
  beta: { label: 'beta', cls: 'bg-[#713f12] text-[#fbbf24]' },
  planned: { label: 'planned', cls: 'bg-[#1f2937] text-[#94a3b8]' },
  deprecated: { label: 'deprecated', cls: 'bg-[#450a0a] text-[#fca5a5]' },
};

export function MapView() {
  const { brand } = useBrand();
  const [caps, setCaps] = useState<Capability[]>([]);
  const [systemMap, setSystemMap] = useState<SystemMap | null>(null);
  const [statusReport, setStatusReport] = useState<ComputedStatusReport | null>(null);
  const [statusHint, setStatusHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLive, setShowLive] = useState(true);
  const [showDraft, setShowDraft] = useState(false);
  const [showInfra, setShowInfra] = useState(false);
  const [showPlanned, setShowPlanned] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      listCapabilities(brand),
      getSystemMap(brand),
      getCapabilityStatus(brand),
    ])
      .then(([capsData, mapData, statusData]) => {
        setCaps(capsData);
        setSystemMap(mapData);
        setStatusReport(statusData.status);
        setStatusHint(statusData.hint ?? null);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [brand]);

  useEffect(() => {
    load();
  }, [load]);

  // Live reload cuando un capability YAML cambia
  // (system_map no está en el enum de docType del watcher, pero capability reload también refresca el mapa)
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

  const byAgentArea = useMemo(() => {
    if (!systemMap) return null;

    // Map "<agent_id>.<area_id>" → array de caps shipped
    const capsByArea = new Map<string, Capability[]>();
    for (const c of filtered) {
      if (c.superseded_by) continue;
      const fa = c.functional_area;
      if (!fa) continue;
      if (!capsByArea.has(fa)) capsByArea.set(fa, []);
      capsByArea.get(fa)!.push(c);
    }

    // Build skeleton from SYSTEM-MAP, attach caps
    return systemMap.agents.map((agent) => ({
      agent,
      areas: agent.functional_areas.map((area) => ({
        area,
        fullId: `${agent.id}.${area.id}`,
        caps: capsByArea.get(`${agent.id}.${area.id}`) ?? [],
      })),
    }));
  }, [systemMap, filtered]);

  // Caps sin agent_owner o funcional_area declarado (huérfanas)
  const orphans = useMemo(() => {
    if (!byAgentArea) return [];
    const coveredAreas = new Set(
      byAgentArea.flatMap((b) => b.areas.map((a) => a.fullId))
    );
    return filtered.filter(
      (c) => !c.superseded_by && (!c.agent_owner || !c.functional_area || !coveredAreas.has(c.functional_area ?? ''))
    );
  }, [byAgentArea, filtered]);

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
          {systemMap && (
            <div className="text-[11px] text-[var(--color-muted)] mt-1">
              Lee skeleton de{' '}
              <button
                onClick={() => openInEditor(systemMap._path ?? '')}
                className="font-mono text-[var(--color-accent)] hover:underline"
              >
                SYSTEM-MAP.yaml
              </button>
              {' · '}
              {systemMap.metadata.total_functional_areas} áreas · {systemMap.metadata.total_cross_agent_flows} flujos cross-agent
            </div>
          )}
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
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              className="!w-auto"
              checked={showPlanned}
              onChange={(e) => setShowPlanned(e.target.checked)}
            />
            planned 📋
          </label>
          <div className="text-[var(--color-muted)]">
            total: {caps.length}
          </div>
        </div>
      </header>

      {!statusReport && statusHint && (
        <div className="mb-3 text-[11px] text-amber-400 px-2 py-1 border border-amber-700 rounded flex items-center gap-1.5">
          <span aria-hidden="true">⚠️</span>
          <span>
            Sin datos de verificación.{' '}
            <span className="font-mono">{statusHint}</span>
          </span>
        </div>
      )}

      {byAgentArea ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {byAgentArea
              .filter((b) => b.agent.id !== 'infra')
              .map(({ agent, areas }) => (
                <AgentSection
                  key={agent.id}
                  agent={agent}
                  areas={areas}
                  showPlanned={showPlanned}
                  statusReport={statusReport}
                />
              ))}
          </div>

          {showInfra && (() => {
            const infraData = byAgentArea.find((b) => b.agent.id === 'infra');
            const infraCapsCount = infraData?.areas.reduce((n, a) => n + a.caps.length, 0) ?? 0;
            if (!infraData || infraCapsCount === 0) return null;
            return (
              <AgentSection
                agent={infraData.agent}
                areas={infraData.areas}
                showPlanned={showPlanned}
                fullWidth
                statusReport={statusReport}
              />
            );
          })()}
        </>
      ) : (
        // Fallback si system-map no cargó: vista legacy por agent_owner
        <LegacyFallbackView filtered={filtered} caps={caps} showInfra={showInfra} statusReport={statusReport} />
      )}

      {orphans.length > 0 && (
        <Card className="!p-4 mt-4 border-red-700">
          <header className="flex items-baseline gap-2 mb-3">
            <span aria-hidden="true">⚠️</span>
            <h2 className="text-sm font-semibold text-red-400">
              Capabilities sin agent_owner declarado
            </h2>
            <span className="text-[10px] text-[var(--color-muted)]">
              ({orphans.length} caps · v3 schema incompleto)
            </span>
          </header>
          <div className="text-[11px] text-[var(--color-muted)] mb-2">
            Estos caps necesitan refining para declarar `agent_owner` + `functional_area` per ADR-vitalia-005.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {orphans.map((c, i) => (
              <CapItem key={capKey(c, i)} cap={c} statusReport={statusReport} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function AgentSection({
  agent,
  areas,
  showPlanned,
  fullWidth = false,
  statusReport = null,
}: {
  agent: AgentDefinition;
  areas: Array<{ area: FunctionalArea; fullId: string; caps: Capability[] }>;
  showPlanned: boolean;
  fullWidth?: boolean;
  statusReport?: ComputedStatusReport | null;
}) {
  const totalCaps = areas.reduce((n, a) => n + a.caps.length, 0);

  // Filtrar áreas: si !showPlanned, ocultar áreas planned sin caps
  const visibleAreas = areas.filter((a) => {
    if (!showPlanned && a.area.status === 'planned' && a.caps.length === 0) return false;
    return true;
  });

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
          {totalCaps}
        </span>
      </header>
      {visibleAreas.length === 0 ? (
        <EmptyState>Sin áreas visibles.</EmptyState>
      ) : (
        <div className="space-y-3">
          {visibleAreas.map(({ area, fullId, caps }) => (
            <div key={fullId}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="text-[10px] text-[var(--color-muted)] font-mono uppercase tracking-wide flex-1">
                  {area.name}
                </div>
                <AreaStatusBadge status={area.status} />
              </div>
              {area.description && (
                <div className="text-[10px] text-[var(--color-muted)] italic mb-1 leading-relaxed" title={area.description}>
                  {area.description.length > 80 ? `${area.description.slice(0, 80)}…` : area.description}
                </div>
              )}
              <div className={fullWidth ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2' : 'space-y-1.5'}>
                {caps.length === 0 ? (
                  area.status === 'planned' ? (
                    <div className="text-[11px] text-[var(--color-muted)] italic px-2 py-1 border border-dashed border-[var(--color-border)] rounded">
                      📋 sin caps · estimado release {area.target_release ?? 'TBD'}
                    </div>
                  ) : (
                    <EmptyState>Sin capabilities shipped.</EmptyState>
                  )
                ) : (
                  caps.map((c, i) => (
                    <CapItem key={capKey(c, i)} cap={c} statusReport={statusReport} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AreaStatusBadge({ status }: { status: AreaStatus }) {
  const badge = STATUS_BADGES[status];
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${badge.cls}`}>
      {badge.label}
    </span>
  );
}

/** Vista legacy de fallback si el SYSTEM-MAP no carga. Usa agent_owner de caps directamente. */
function LegacyFallbackView({
  filtered,
  caps,
  showInfra,
  statusReport = null,
}: {
  filtered: Capability[];
  caps: Capability[];
  showInfra: boolean;
  statusReport?: ComputedStatusReport | null;
}) {
  const FALLBACK_AGENTS = [
    { id: 'lisa' as const, emoji: '🏥', name: 'Lisa', subtitle: 'Mi Clínica' },
    { id: 'valeria' as const, emoji: '🗓', name: 'Valeria', subtitle: 'Mi Día' },
    { id: 'adrian' as const, emoji: '💼', name: 'Adrián', subtitle: 'Vender' },
    { id: 'lucas' as const, emoji: '📣', name: 'Lucas', subtitle: 'Marketing' },
    { id: 'camila' as const, emoji: '🌟', name: 'Camila', subtitle: 'Reputación + cohortes' },
    { id: 'config' as const, emoji: '⚙', name: 'Configurar', subtitle: 'tenant · iam · compliance' },
  ];
  const INFRA_FALLBACK = { id: 'infra' as const, emoji: '🔧', name: 'Infra Vitalia', subtitle: 'observability · platform · payment · scaffolding' };

  const byAgent = useMemo(() => {
    const map = new Map<string, Capability[]>();
    FALLBACK_AGENTS.forEach((a) => map.set(a.id, []));
    map.set('infra', []);
    const orphans: Capability[] = [];
    for (const c of filtered) {
      if (c.superseded_by) continue;
      const owner = c.agent_owner;
      if (!owner) { orphans.push(c); continue; }
      const bucket = map.get(owner);
      if (bucket) bucket.push(c);
      else orphans.push(c);
    }
    return { map, orphans };
  }, [filtered]);

  return (
    <>
      <div className="text-[11px] text-amber-400 mb-3 px-2 py-1 border border-amber-700 rounded">
        ⚠️ SYSTEM-MAP.yaml no disponible · mostrando vista legacy por agent_owner
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {FALLBACK_AGENTS.map((agent) => {
          const agentCaps = byAgent.map.get(agent.id) ?? [];
          return (
            <Card key={agent.id} className="!p-4 h-full">
              <header className="flex items-baseline gap-2 mb-3 border-b border-[var(--color-border)] pb-2">
                <span aria-hidden="true" className="text-xl">{agent.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold">{agent.name}</h2>
                  <p className="text-[10px] text-[var(--color-muted)]">{agent.subtitle}</p>
                </div>
                <span className="text-[10px] text-[var(--color-muted)] shrink-0">{agentCaps.length}</span>
              </header>
              {agentCaps.length === 0 ? (
                <EmptyState>Sin capabilities todavía.</EmptyState>
              ) : (
                <div className="space-y-1.5">
                  {agentCaps.map((c, i) => <CapItem key={capKey(c, i)} cap={c} statusReport={statusReport} />)}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {showInfra && (byAgent.map.get('infra') ?? []).length > 0 && (
        <Card className="!p-4 col-span-full">
          <header className="flex items-baseline gap-2 mb-3 border-b border-[var(--color-border)] pb-2">
            <span aria-hidden="true" className="text-xl">{INFRA_FALLBACK.emoji}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold">{INFRA_FALLBACK.name}</h2>
              <p className="text-[10px] text-[var(--color-muted)]">{INFRA_FALLBACK.subtitle}</p>
            </div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {(byAgent.map.get('infra') ?? []).map((c, i) => <CapItem key={capKey(c, i)} cap={c} statusReport={statusReport} />)}
          </div>
        </Card>
      )}
      {byAgent.orphans.length > 0 && (
        <Card className="!p-4 mt-4 border-red-700">
          <h2 className="text-sm font-semibold text-red-400 mb-2">
            ⚠️ Capabilities sin agent_owner ({byAgent.orphans.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {byAgent.orphans.map((c, i) => <CapItem key={capKey(c, i)} cap={c} statusReport={statusReport} />)}
          </div>
        </Card>
      )}
    </>
  );
}

function CapItem({
  cap,
  statusReport = null,
}: {
  cap: Capability;
  statusReport?: ComputedStatusReport | null;
}) {
  const { openCap } = useDrawer();
  const [expanded, setExpanded] = useState(false);

  // Split functional_area en [agent].[area] si está set
  const [agentChip, areaChip] = (cap.functional_area ?? '').split('.', 2);

  // Buscar computed status por slug del cap
  const computed: CapStatusComputed | null =
    statusReport?.capabilities[cap.slug] ?? null;
  const badge = computed ? getStatusBadge(computed.computed_status) : null;

  const hasAtomics = cap.atomics.length > 0;

  return (
    <div
      className={cn(
        'rounded border text-xs transition-colors',
        'bg-[var(--color-panel)] border-[var(--color-border)]'
      )}
    >
      {/* Row principal: click abre drawer o toggle atomics */}
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => openCap(cap.module, cap.slug)}
          className={cn(
            'flex-1 text-left px-2 py-1.5 transition-colors',
            'hover:border-[#3a4358] hover:bg-[var(--color-panel2)] rounded-l'
          )}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <Pill className={STATUS_CLASSES[cap.status] ?? 'bg-[#1f2937]'}>
              {cap.status}
            </Pill>
            {badge && (
              <span
                className="text-[10px]"
                title={`Computed: ${computed?.computed_status}`}
              >
                {badge.emoji}
              </span>
            )}
            <div className="flex items-center gap-1 text-[11px] flex-1 truncate">
              <span className="font-medium truncate">
                {cap.user_facing_name ?? `${cap.module}/${cap.slug}`}
              </span>
              {agentChip && (
                <Pill className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[10px] py-0">
                  {agentChip}
                </Pill>
              )}
              {areaChip && (
                <Pill className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[10px] py-0 opacity-70">
                  {areaChip}
                </Pill>
              )}
            </div>
          </div>
          <div className="text-[10px] text-[var(--color-muted)] mt-0.5 font-mono truncate">
            {cap.module}/{cap.slug}
            {hasAtomics && (
              <span className="ml-2">
                · {cap.atomics.length} atomic{cap.atomics.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </button>

        {/* Toggle expand atomics */}
        <button
          type="button"
          aria-label={expanded ? 'Ocultar atomics' : 'Ver atomics'}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'px-1.5 text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors',
            'border-l border-[var(--color-border)] rounded-r',
            expanded && 'bg-[var(--color-panel2)]'
          )}
        >
          <span aria-hidden="true" className="text-[10px]">
            {expanded ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {/* Atomics drawer */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-2 py-1.5">
          {!hasAtomics ? (
            <div className="text-[10px] text-[var(--color-muted)] italic">
              Sin atomics declarados (cap stub)
            </div>
          ) : (
            <div className="space-y-0.5">
              {cap.atomics.map((a, idx) => {
                // Los atomics pueden tener `name` (v3.1) o `label` (v2 legacy)
                const atomicName =
                  (a as unknown as { name?: string }).name ?? a.label ?? '(sin nombre)';
                const atomicSurface =
                  (a as unknown as { surface?: string }).surface ?? null;
                const atomicStatus =
                  (a as unknown as { status?: string }).status ?? 'live';
                return (
                  <div
                    key={`${a.added_in_story}-${idx}`}
                    className="text-[10px] text-[var(--color-muted)] flex items-center gap-1"
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        atomicStatus === 'live'
                          ? 'bg-green-500'
                          : atomicStatus === 'wip'
                          ? 'bg-blue-500'
                          : 'bg-gray-500'
                      )}
                      title={`status: ${atomicStatus}`}
                    />
                    {atomicSurface && (
                      <span className="font-mono text-[9px] opacity-60 shrink-0">
                        {atomicSurface}
                      </span>
                    )}
                    <span className="truncate">{atomicName}</span>
                  </div>
                );
              })}
            </div>
          )}
          {computed && (
            <div className="mt-1 pt-1 border-t border-[var(--color-border)] text-[9px] text-[var(--color-muted)] font-mono">
              {badge?.emoji} {computed.computed_status} · {computed.atomics_live}/{computed.atomics_total} live
              {computed.drift_reasons.length > 0 && (
                <span className="text-red-400 ml-1" title={computed.drift_reasons.join('; ')}>
                  · drift
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
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
