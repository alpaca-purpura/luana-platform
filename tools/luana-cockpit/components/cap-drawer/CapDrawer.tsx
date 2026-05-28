'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, Pill } from '@/components/ui/Badge';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui/Spinner';
import { ExternalLink, Plus } from 'lucide-react';
import { useDrawer } from '@/components/providers/DrawerProvider';
import { useBrand } from '@/components/providers/BrandProvider';
import { getCapability, openInEditor } from '@/lib/api-client';
import { ExtendCapModal } from './ExtendCapModal';
import type { Capability } from '@/lib/types';
import toast from 'react-hot-toast';

const STATUS_CLASSES: Record<string, string> = {
  live: 'bg-[#14532d] text-[#86efac]',
  beta: 'bg-[#713f12] text-[#fbbf24]',
  deprecated: 'bg-[#3f3f46] text-[#d4d4d8]',
  sunset: 'bg-[#450a0a] text-[#fca5a5]',
};

export function CapDrawer() {
  const { capRef, closeCap, openStory } = useDrawer();
  const { brand } = useBrand();
  const [cap, setCap] = useState<Capability | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extendOpen, setExtendOpen] = useState(false);

  useEffect(() => {
    if (!capRef) {
      setCap(null);
      return;
    }
    setLoading(true);
    setError(null);
    getCapability(capRef.module, capRef.slug, brand)
      .then((c) => setCap(c))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [capRef, brand]);

  async function handleOpenYaml() {
    if (!cap?.path) return;
    try {
      await openInEditor(cap.path);
      toast.success('YAML abierto');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Drawer
      open={capRef !== null}
      onClose={closeCap}
      title={
        cap ? (
          <div className="flex items-center gap-2 min-w-0">
            <Badge className={STATUS_CLASSES[cap.status] ?? 'bg-[#1f2937]'}>
              {cap.status}
            </Badge>
            <span className="font-mono text-sm truncate">
              {cap.module}/{cap.slug}
            </span>
          </div>
        ) : (
          <span className="text-sm text-[var(--color-muted)]">Capability…</span>
        )
      }
      width={800}
    >
      {loading && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <Spinner /> Cargando capability…
        </div>
      )}
      {error && <ErrorBanner message={error} />}
      {!loading && !error && cap && (
        <div className="space-y-5">
          {/* YAML pointer */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">YAML ledger</h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleOpenYaml}>
                  <ExternalLink className="w-3 h-3" />
                  xed
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setExtendOpen(true)}
                >
                  <Plus className="w-3 h-3" />
                  Extender
                </Button>
              </div>
            </div>
            <div className="text-[11px] font-mono text-[var(--color-muted)] truncate">
              {cap.path ?? '—'}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mt-3">
              <dt className="text-[var(--color-muted)]">License</dt>
              <dd>
                <Pill className="bg-[var(--color-panel)] border border-[var(--color-border)]">
                  {cap.license}
                </Pill>
              </dd>
              <dt className="text-[var(--color-muted)]">Created in story</dt>
              <dd className="font-mono text-[11px]">{cap.created_in_story}</dd>
              <dt className="text-[var(--color-muted)]">Created date</dt>
              <dd>{cap.created_date}</dd>
              <dt className="text-[var(--color-muted)]">Last modified</dt>
              <dd>{cap.last_modified}</dd>
              <dt className="text-[var(--color-muted)]">Parent cap</dt>
              <dd className="font-mono text-[11px]">{cap.parent_cap ?? '—'}</dd>
              {cap.architecture_pattern && (
                <>
                  <dt className="text-[var(--color-muted)]">Pattern</dt>
                  <dd className="text-[11px]">{cap.architecture_pattern}</dd>
                </>
              )}
            </dl>
          </Card>

          {/* Atomics */}
          <section>
            <h3 className="text-sm font-semibold mb-2">
              Atomics ({cap.atomics.length})
            </h3>
            {cap.atomics.length === 0 ? (
              <EmptyState>Sin atomics declarados.</EmptyState>
            ) : (
              <ul className="space-y-1.5">
                {cap.atomics.map((a, i) => (
                  <li
                    key={i}
                    className={
                      a.deprecated_in_story
                        ? 'flex items-start gap-2 text-xs text-[var(--color-muted)] line-through'
                        : 'flex items-start gap-2 text-xs'
                    }
                  >
                    <span className="font-mono text-[10px] text-[var(--color-muted)] shrink-0 w-24">
                      {a.added_date}
                    </span>
                    <span className="flex-1">{a.label}</span>
                    <button
                      onClick={() => openStory(a.added_in_story)}
                      className="text-[10px] text-[var(--color-accent)] hover:underline font-mono"
                    >
                      {a.added_in_story}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Changelog */}
          <section>
            <h3 className="text-sm font-semibold mb-2">
              Historial · change log ({cap.change_log.length})
            </h3>
            {cap.change_log.length === 0 ? (
              <EmptyState>Sin entries todavía.</EmptyState>
            ) : (
              <ol className="border-l-2 border-[var(--color-border)] pl-4 space-y-3">
                {cap.change_log.map((entry, i) => (
                  <li key={i} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[var(--color-accent)] border-2 border-[var(--color-panel)]"
                    />
                    <div className="text-[10px] text-[var(--color-muted)] font-mono mb-0.5">
                      {entry.date} · {entry.type} ·{' '}
                      <button
                        onClick={() => openStory(entry.story_id)}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {entry.story_id}
                      </button>
                    </div>
                    <div className="text-xs">{entry.summary}</div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}

      {cap && (
        <ExtendCapModal
          open={extendOpen}
          onClose={() => setExtendOpen(false)}
          brand={brand}
          parentCap={{ module: cap.module, slug: cap.slug }}
          onCreated={(storyId) => {
            openStory(storyId);
            closeCap();
          }}
        />
      )}
    </Drawer>
  );
}
