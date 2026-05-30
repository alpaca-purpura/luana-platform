'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { TOOLTIPS } from '@/lib/tooltips';
import { useBrand } from '@/components/providers/BrandProvider';
import { useFileWatchEvents } from '@/components/providers/FileWatchProvider';
import { getCapabilityStatus } from '@/lib/api-client';
import { getStatusBadge, type ComputedStatus, type ComputedStatusReport } from '@/lib/types';

const STATUS_TOOLTIPS: Record<ComputedStatus, string> = {
  'verified-live': TOOLTIPS.verified_live,
  'declared-live': TOOLTIPS.declared_live,
  'partial': TOOLTIPS.partial,
  'wip': TOOLTIPS.wip,
  'stub': TOOLTIPS.stub,
  'drift': TOOLTIPS.drift,
  'deprecated': 'Cap marcada como deprecada · pendiente sunset.',
  'sunset': 'Cap retirada · ya no se mantiene.',
};
import {
  filterDriftEntries,
  sortDriftEntries,
  getNextAction,
  type DriftEntry,
} from '@/lib/drift-helpers';

// ────────────────────────────────────────────────────────────────────────────
// Colores de badge por computed_status
// ────────────────────────────────────────────────────────────────────────────

const STATUS_CLS: Record<ComputedStatus, string> = {
  'verified-live': 'bg-[#14532d] text-[#86efac]',
  'declared-live': 'bg-[#713f12] text-[#fbbf24]',
  'partial': 'bg-[#7c2d12] text-[#fb923c]',
  'wip': 'bg-[#1e3a5f] text-[#93c5fd]',
  'stub': 'bg-[#27272a] text-[#a1a1aa]',
  'drift': 'bg-[#450a0a] text-[#fca5a5]',
  'deprecated': 'bg-[#1f2937] text-[#6b7280]',
  'sunset': 'bg-[#1f2937] text-[#6b7280]',
};

// ────────────────────────────────────────────────────────────────────────────
// Resumen top-line del reporte
// ────────────────────────────────────────────────────────────────────────────

function SummaryLine({ report }: { report: ComputedStatusReport }) {
  const s = report.summary;
  const driftItems: string[] = [];

  if (s.drift > 0)
    driftItems.push(`🔴 ${s.drift} drift`);
  if (s.declared_live > 0)
    driftItems.push(`🟡 ${s.declared_live} declarado`);
  if (s.partial !== undefined && s.partial > 0)
    driftItems.push(`🟠 ${s.partial} parcial`);
  if (s.wip !== undefined && s.wip > 0)
    driftItems.push(`🔵 ${s.wip} wip`);
  if (s.stub > 0)
    driftItems.push(`⚪ ${s.stub} stub`);
  if ((s.deprecated ?? 0) > 0)
    driftItems.push(`⚫ ${s.deprecated} deprecated`);
  if ((s.sunset ?? 0) > 0)
    driftItems.push(`⚫ ${s.sunset} sunset`);

  const totalDrift = s.total_caps - s.verified_live;

  return (
    <div className="text-[11px] text-[var(--color-muted)] space-y-0.5">
      <div>
        <span className="text-[var(--color-text)] font-medium">{totalDrift}</span> caps con drift
        {' · '}
        <span className="text-[#86efac] font-medium">{s.verified_live}</span> verified-live
        {' de '}
        <span className="font-medium">{s.total_caps}</span> total
      </div>
      {driftItems.length > 0 && (
        <div>{driftItems.join(' · ')}</div>
      )}
      <div className="opacity-70">
        Última verificación: {new Date(report.computed_at).toLocaleString('es', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Fila de cap en drift
// ────────────────────────────────────────────────────────────────────────────

function DriftRow({ entry }: { entry: DriftEntry }) {
  const [expanded, setExpanded] = useState(false);
  const badge = getStatusBadge(entry.computed_status);
  const cls = STATUS_CLS[entry.computed_status] ?? STATUS_CLS['stub'];

  return (
    <div className="border border-[var(--color-border)] rounded bg-[var(--color-panel)] text-xs">
      {/* Fila principal */}
      <div className="flex items-stretch">
        <div className="flex-1 px-3 py-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip content={STATUS_TOOLTIPS[entry.computed_status]} variant="badge">
              <Pill className={cn(cls, 'text-[10px] py-0 shrink-0')}>
                {badge.emoji} {badge.label}
              </Pill>
            </Tooltip>
            <span className="font-mono font-medium text-[11px] truncate">
              {entry.slug}
            </span>
            {entry.functional_area && (
              <Pill className="bg-[var(--color-panel2)] border border-[var(--color-border)] text-[10px] py-0 shrink-0">
                {entry.functional_area}
              </Pill>
            )}
            <span className="text-[var(--color-muted)] text-[10px] ml-auto shrink-0">
              {entry.scenarios_total} escenario{entry.scenarios_total !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-[10px] text-[var(--color-muted)] mt-0.5 italic truncate">
            {entry.summary}
          </div>
        </div>

        {/* Toggle expand */}
        <button
          type="button"
          aria-label={expanded ? 'Ocultar detalles' : 'Ver detalles'}
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'px-2 text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors',
            'border-l border-[var(--color-border)] rounded-r text-[10px]',
            expanded && 'bg-[var(--color-panel2)]'
          )}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-3 py-2 space-y-2">
          {entry.drift_reasons.length > 0 && (
            <div>
              <div className="text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wide mb-1">
                Razones
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {entry.drift_reasons.map((reason, i) => (
                  <li key={i} className="text-[11px] text-[var(--color-muted)]">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="text-[10px] font-medium text-[var(--color-muted)] uppercase tracking-wide mb-1">
              Acción sugerida
            </div>
            <div
              className={cn(
                'text-[11px] px-2 py-1.5 rounded border',
                entry.computed_status === 'drift'
                  ? 'border-red-700 text-red-300 bg-[#1f0000]'
                  : 'border-[var(--color-border)] text-[var(--color-text)]'
              )}
            >
              {entry.next_action}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DriftView — componente principal
// ────────────────────────────────────────────────────────────────────────────

export function DriftView() {
  const { brand } = useBrand();
  const [report, setReport] = useState<ComputedStatusReport | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getCapabilityStatus(brand)
      .then((data) => {
        setReport(data.status);
        setHint(data.hint ?? null);
      })
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

  // ── Estados de carga ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Spinner /> Cargando estado de capabilities…
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

  // ── Estado: script no corrido aún ─────────────────────────────────────────

  if (!report) {
    return (
      <div className="p-6 space-y-4">
        <header>
          <h1 className="text-lg font-semibold">🚨 Drift — caps que no están verificadas-live</h1>
        </header>
        <Card className="!p-4">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-2xl">⚠️</span>
            <div className="space-y-2">
              <div className="text-sm font-medium">Reporte de verificación no disponible</div>
              <div className="text-[11px] text-[var(--color-muted)]">
                Para ver el estado de drift, ejecuta el script de verificación:
              </div>
              <pre className="text-[10px] bg-[var(--color-panel2)] border border-[var(--color-border)] px-3 py-2 rounded font-mono overflow-x-auto">
                {hint ?? `python3 scripts/compute_capability_status.py --brand ${brand}`}
              </pre>
              <div className="text-[10px] text-[var(--color-muted)]">
                El script genera{' '}
                <code className="font-mono bg-[var(--color-panel2)] px-1 rounded">
                  {brand}/docs/product/capabilities/_status-computed.json
                </code>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── Derivar entries de drift ───────────────────────────────────────────────

  const rawEntries = filterDriftEntries(report);
  const driftEntries = sortDriftEntries(rawEntries);
  const totalDrift = driftEntries.length;
  const urgentDrift = driftEntries.filter((e) => e.computed_status === 'drift').length;

  // ── Estado: cero drift ────────────────────────────────────────────────────

  if (totalDrift === 0) {
    return (
      <div className="p-6 space-y-4">
        <header>
          <h1 className="text-lg font-semibold">🚨 Drift — caps que no están verificadas-live</h1>
          <div className="mt-1">
            <SummaryLine report={report} />
          </div>
        </header>
        <Card className="!p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <div className="text-sm font-semibold text-[#86efac]">
            Cero drift. Todos los caps están verificados-live.
          </div>
          <div className="text-[11px] text-[var(--color-muted)] mt-1">
            {report.summary.total_caps} caps · {report.summary.verified_live} verified-live
          </div>
        </Card>
      </div>
    );
  }

  // ── Vista principal: lista de caps en drift ───────────────────────────────

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">
            <Tooltip content={TOOLTIPS.drift_tab} variant="header">
              🚨 Drift
            </Tooltip>
            {' — '}
            <span className="text-[var(--color-muted)] font-normal text-base">
              caps que no están verificadas-live
            </span>
          </h1>
          <div className="mt-1">
            <SummaryLine report={report} />
          </div>
        </div>

        {urgentDrift > 0 && (
          <div className="text-[11px] text-red-300 px-2 py-1 border border-red-700 rounded bg-[#1f0000] shrink-0">
            🔴 {urgentDrift} cap{urgentDrift !== 1 ? 's' : ''} en drift URGENTE
          </div>
        )}
      </header>

      {/* Lista por severidad */}
      <div className="space-y-2">
        {driftEntries.map((entry) => (
          <DriftRow key={entry.slug} entry={entry} />
        ))}
      </div>

      {/* Footer */}
      <div className="text-[10px] text-[var(--color-muted)] pt-2 border-t border-[var(--color-border)]">
        Regenerar reporte:{' '}
        <code className="font-mono bg-[var(--color-panel2)] px-1 rounded">
          python3 scripts/compute_capability_status.py --brand {brand}
        </code>
      </div>
    </div>
  );
}
