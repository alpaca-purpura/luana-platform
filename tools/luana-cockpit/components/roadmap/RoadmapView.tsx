'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui/Spinner';
import { Panel } from '@/components/ui/Card';
import { ReleaseCard } from './ReleaseCard';
import { NewReleaseModal } from '@/components/modals/NewReleaseModal';
import { MergeReleaseModal } from '@/components/modals/MergeReleaseModal';
import { useBrand } from '@/components/providers/BrandProvider';
import { useFileWatchEvents } from '@/components/providers/FileWatchProvider';
import {
  listReleases,
  listStories,
  updateStory,
  type StoryWithArchive,
} from '@/lib/api-client';
import type { Release } from '@/lib/types';

export function RoadmapView() {
  const { brand } = useBrand();
  const [releases, setReleases] = useState<Release[]>([]);
  const [stories, setStories] = useState<StoryWithArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideShipped, setHideShipped] = useState(false);
  const [newReleaseOpen, setNewReleaseOpen] = useState(false);
  const [mergeReleaseId, setMergeReleaseId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([listReleases(brand), listStories(brand)])
      .then(([r, s]) => {
        setReleases(r);
        setStories(s);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [brand]);

  useEffect(() => {
    load();
  }, [load]);

  // Live reload cuando archivos del SSoT cambien
  useFileWatchEvents((event) => {
    if (event.brand && event.brand !== brand) return;
    if (event.docType === 'checkpoint' || event.docType === 'release') {
      load();
    }
  });

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const storyId = active.id as string;
    const overId = over.id as string;
    if (!overId.startsWith('release:')) return;

    const targetReleaseId = overId.replace('release:', '');
    const story = stories.find((s) => s.story_id === storyId);
    if (!story) return;
    if (story.release === targetReleaseId) return;

    // Optimistic update
    setStories((prev) =>
      prev.map((s) =>
        s.story_id === storyId ? { ...s, release: targetReleaseId } : s
      )
    );

    try {
      await updateStory(storyId, brand, { release: targetReleaseId });
      toast.success(`${storyId} → ${targetReleaseId}`);
    } catch (err) {
      toast.error(`No se pudo mover: ${(err as Error).message}`);
      load(); // revertir desde server
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Spinner /> Cargando roadmap…
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

  const releasesShown = hideShipped
    ? releases.filter((r) => r.status !== 'shipped')
    : releases;

  const sortedReleases = [...releasesShown].sort((a, b) => a.order - b.order);

  return (
    <div className="p-6">
      <header className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold">Roadmap · planeación temporal</h1>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5 max-w-3xl">
            Arrastra stories entre releases mientras estén en estado{' '}
            <b>idea</b>, <b>refining</b> o <b>refined</b>. Una vez en{' '}
            <code>ready</code> o más, queda anclada (solo Claude la mueve). Al
            cerrar todas las stories de un release, se habilita merge.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => setHideShipped((v) => !v)}>
            {hideShipped ? (
              <>
                <Eye className="w-3 h-3" />
                mostrar shipped
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3" />
                ocultar shipped
              </>
            )}
          </Button>
          <Button variant="primary" onClick={() => setNewReleaseOpen(true)}>
            <Plus className="w-3 h-3" />
            Nuevo release
          </Button>
        </div>
      </header>

      {sortedReleases.length === 0 ? (
        <Panel className="p-8">
          <EmptyState>
            Sin releases todavía para {brand}. Crea el primero con el botón
            arriba.
          </EmptyState>
        </Panel>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="space-y-3">
            {sortedReleases.map((r) => (
              <ReleaseCard
                key={r.release_id}
                release={r}
                stories={stories.filter((s) => s.release === r.release_id)}
                onMergeRequested={setMergeReleaseId}
              />
            ))}
          </div>
        </DndContext>
      )}

      <NewReleaseModal
        open={newReleaseOpen}
        onClose={() => setNewReleaseOpen(false)}
        onCreated={load}
      />
      {mergeReleaseId && (
        <MergeReleaseModal
          open={mergeReleaseId !== null}
          onClose={() => setMergeReleaseId(null)}
          releaseId={mergeReleaseId}
          onMerged={load}
        />
      )}
    </div>
  );
}
