'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Wrench, RefreshCw, FileText, Search } from 'lucide-react';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { TOOLTIPS } from '@/lib/tooltips';
import { listHarnessItems, openInEditor } from '@/lib/api-client';
import { ESTADO_ORDER, type HarnessEstado, type HarnessItem } from '@/lib/harness-backlog';

const SOURCE = 'docs/process/harness-backlog.md';

/** Qué significa cada estado + qué acción/decisión tomar (ver lib/tooltips.ts). */
const ESTADO_TOOLTIPS: Record<HarnessEstado, string> = {
  reported: TOOLTIPS.harness_reported,
  triaged: TOOLTIPS.harness_triaged,
  ratified: TOOLTIPS.harness_ratified,
  applied: TOOLTIPS.harness_applied,
  verified: TOOLTIPS.harness_verified,
  deferred: TOOLTIPS.harness_deferred,
  otro: TOOLTIPS.harness_otro,
};

/** Color por columna de estado · ámbar = avance del harness (distinto del púrpura de marca). */
const ESTADO_CLASSES: Record<HarnessEstado, string> = {
  reported: 'bg-[#1f2937] text-[#9ca3af]',
  triaged: 'bg-[#1e3a8a] text-[#93c5fd]',
  ratified: 'bg-[#5b21b6] text-[#ddd6fe]',
  applied: 'bg-[#713f12] text-[#fbbf24]',
  verified: 'bg-[#14532d] text-[#86efac]',
  deferred: 'bg-[#3f3f46] text-[#d4d4d8]',
  otro: 'bg-[#450a0a] text-[#fca5a5]',
};

const ESTADO_LABEL: Record<HarnessEstado, string> = {
  reported: 'reported',
  triaged: 'triaged',
  ratified: 'ratified',
  applied: 'applied',
  verified: 'verified',
  deferred: 'deferred',
  otro: 'otro',
};

function HarnessCard({ item }: { item: HarnessItem }) {
  // El matiz "(cont. N)" / fecha del estado crudo, sin repetir el estado canónico.
  const estadoNote = item.estadoRaw
    .replace(/\*\*|__|`/g, '')
    .replace(new RegExp(`^\\s*${item.estado}\\s*`, 'i'), '')
    .trim();

  return (
    <div className="bg-[var(--color-panel)] border border-[var(--color-border)] border-l-2 border-l-amber-500/70 rounded p-2.5 text-xs">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-mono text-[11px] text-amber-400 font-semibold">{item.id}</span>
        <span title={item.sevLabel} aria-label={item.sevLabel}>
          {item.sevEmoji}
        </span>
      </div>
      <p className="text-[var(--color-text)] leading-snug line-clamp-4">{item.title}</p>
      {estadoNote && (
        <p className="text-[10px] text-[var(--color-muted)] italic mt-1">{estadoNote}</p>
      )}
      {item.ref && (
        <p className="text-[10px] text-[var(--color-muted)] font-mono mt-1 truncate" title={item.ref}>
          {item.ref}
        </p>
      )}
    </div>
  );
}

export function HarnessView() {
  const [items, setItems] = useState<HarnessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listHarnessItems()
      .then((r) => setItems(r.items))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((it) =>
      [it.id, it.item, it.estadoRaw, it.ref, it.sevLabel].join(' ').toLowerCase().includes(q)
    );
  }, [items, search]);

  // Solo mostramos `otro` si hay items que no encajan en el lifecycle.
  const columns = useMemo<HarnessEstado[]>(() => {
    const hasOtro = filtered.some((it) => it.estado === 'otro');
    return hasOtro ? [...ESTADO_ORDER, 'otro'] : [...ESTADO_ORDER];
  }, [filtered]);

  async function handleOpen() {
    try {
      await openInEditor(SOURCE);
      toast.success('Abriendo harness-backlog.md…');
    } catch (err) {
      toast.error(`No se pudo abrir: ${(err as Error).message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Spinner /> Cargando harness backlog…
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
      <header className="mb-3">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" /> Harness Backlog
          <Badge className="bg-amber-900/30 text-amber-300 border border-amber-700/50">
            CORE · read-only
          </Badge>
        </h1>
        <p className="text-[11px] text-[var(--color-muted)] italic mt-1">
          Issue-tracker del harness (skills · rules · hooks · agents · cockpit · templates) —
          no es producto de marca. SSoT: <span className="font-mono">{SOURCE}</span>. La
          captura/transición la maneja el HLP (<span className="font-mono">/harness-issue</span> + lotes);
          el cockpit solo lo visualiza.
        </p>
      </header>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-panel2)] text-[var(--color-text)] hover:border-amber-600/60 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" /> Abrir archivo
        </button>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-[var(--color-border)] bg-[var(--color-panel2)] text-[var(--color-text)] hover:border-amber-600/60 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recargar
        </button>
        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-[var(--color-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar HB-N, texto, ref…"
            className="!py-1"
          />
        </div>
        <Badge className="bg-[var(--color-panel2)] text-[var(--color-muted)]">
          {filtered.length} items
        </Badge>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>Sin items en el harness backlog (o el archivo no existe en este worktree).</EmptyState>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map((estado) => {
            const colItems = filtered
              .filter((it) => it.estado === estado)
              .sort((a, b) => a.num - b.num);
            return (
              <div key={estado} className="shrink-0 w-60 flex flex-col">
                <div className="flex items-center justify-between mb-2 px-1">
                  <Tooltip content={ESTADO_TOOLTIPS[estado]} variant="badge">
                    <Badge className={ESTADO_CLASSES[estado]}>{ESTADO_LABEL[estado]}</Badge>
                  </Tooltip>
                  <span className="text-[11px] text-[var(--color-muted)]">{colItems.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {colItems.length === 0 ? (
                    <p className="text-[10px] text-[var(--color-muted)] italic px-1 py-2">—</p>
                  ) : (
                    colItems.map((it) => <HarnessCard key={it.id} item={it} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
