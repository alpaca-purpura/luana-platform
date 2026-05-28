'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, Search } from 'lucide-react';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Badge';
import { useBrand } from '@/components/providers/BrandProvider';
import { useFileWatchEvents } from '@/components/providers/FileWatchProvider';
import { listLearnings, openInEditor, type LearningEntry } from '@/lib/api-client';

const TYPE_CLASSES: Record<string, string> = {
  technical: 'bg-[#1e3a8a] text-[#93c5fd]',
  business: 'bg-[#365314] text-[#a3e635]',
  process: 'bg-[#5b21b6] text-[#ddd6fe]',
  tooling: 'bg-[#713f12] text-[#fbbf24]',
};

export function LearningsView() {
  const { brand } = useBrand();
  const [items, setItems] = useState<LearningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listLearnings(brand)
      .then(setItems)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [brand]);

  useEffect(() => {
    load();
  }, [load]);

  // Live reload cuando un learning .md cambia
  useFileWatchEvents((event) => {
    if (event.brand && event.brand !== brand) return;
    if (event.docType === 'learning') {
      load();
    }
  });

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((l) => {
      const haystack = [
        l.slug,
        l.title ?? '',
        l.preview ?? '',
        ...(l.tags ?? []),
        l.type ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search]);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Spinner /> Cargando learnings…
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

  async function handleOpen(absPath: string) {
    try {
      await openInEditor(absPath);
      toast.success('archivo abierto');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="p-6">
      <header className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">Learnings · timeline</h1>
          <p className="text-[11px] text-[var(--color-muted)] italic mt-1">
            {items.length} aprendizajes capturados en{' '}
            <span className="font-mono">{brand}/docs/learnings/</span>.
          </p>
        </div>
        <div className="flex items-center gap-1.5 max-w-xs">
          <Search className="w-3.5 h-3.5 text-[var(--color-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, tag, contenido…"
            className="!py-1"
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <EmptyState>
          {items.length === 0
            ? 'Aún no hay learnings capturados.'
            : 'Sin resultados para esa búsqueda.'}
        </EmptyState>
      ) : (
        <ol className="space-y-3">
          {filtered.map((l) => (
            <li key={l.slug}>
              <Card className="!p-4">
                <header className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {l.date && (
                        <span className="font-mono text-[10px] text-[var(--color-muted)]">
                          {l.date}
                        </span>
                      )}
                      {l.type && (
                        <Pill
                          className={
                            TYPE_CLASSES[l.type] ??
                            'bg-[var(--color-panel)] border border-[var(--color-border)]'
                          }
                        >
                          {l.type}
                        </Pill>
                      )}
                      {l.tags?.slice(0, 5).map((t) => (
                        <Pill
                          key={t}
                          className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-muted)]"
                        >
                          #{t}
                        </Pill>
                      ))}
                    </div>
                    <h2 className="text-sm font-semibold truncate">
                      {l.title ?? l.slug}
                    </h2>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpen(l.path)}
                    aria-label="Abrir en editor"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </header>
                {l.preview && (
                  <p className="text-xs text-[var(--color-muted)] line-clamp-3">
                    {l.preview}
                  </p>
                )}
                <div className="text-[10px] font-mono text-[var(--color-muted)] mt-2 truncate">
                  {l.path}
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
