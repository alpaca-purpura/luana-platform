'use client';

import { useCallback, useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui/Spinner';
import { StateBadge } from '@/components/ui/Badge';
import { CheckpointTab } from './CheckpointTab';
import { ChrisInputTab } from './ChrisInputTab';
import { ArtifactTab } from './ArtifactTab';
import { FilesTab } from './FilesTab';
import { useDrawer } from '@/components/providers/DrawerProvider';
import { useBrand } from '@/components/providers/BrandProvider';
import { getStory, type StoryWithArchive } from '@/lib/api-client';

export function StoryDrawer() {
  const { storyId, closeStory } = useDrawer();
  const { brand } = useBrand();
  const [story, setStory] = useState<StoryWithArchive | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!storyId) return;
    setLoading(true);
    setError(null);
    getStory(storyId, brand)
      .then((s) => setStory(s as StoryWithArchive))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [storyId, brand]);

  useEffect(() => {
    if (storyId) {
      load();
    } else {
      setStory(null);
      setError(null);
    }
  }, [storyId, load]);

  const tabs: TabItem[] = story
    ? [
        {
          id: 'checkpoint',
          label: '📋 Checkpoint',
          content: <CheckpointTab story={story} onUpdated={load} />,
        },
        {
          id: 'chris-input',
          label: '💭 chris-input.md',
          content: <ChrisInputTab storyId={story.story_id} />,
        },
        {
          id: 'spec',
          label: '📝 Spec',
          content: (
            <ArtifactTab
              storyPath={story.path}
              storyState={story.state}
              isArchived={story.is_archived ?? false}
              candidates={['01-spec.md']}
              missingMessage="01-spec.md aún no existe. Se crea cuando la story entra en refining via /po-ux o /po."
            />
          ),
        },
        {
          id: 'design',
          label: '🎨 Diseño',
          content: (
            <ArtifactTab
              storyPath={story.path}
              storyState={story.state}
              isArchived={story.is_archived ?? false}
              candidates={['02-design-ui.md', '02-design-agentic.md']}
              missingMessage="02-design-*.md aún no existe. Se crea cuando la story entra en refining (UI o agéntica)."
            />
          ),
        },
        {
          id: 'arch',
          label: '🏗 Arq',
          content: (
            <ArtifactTab
              storyPath={story.path}
              storyState={story.state}
              isArchived={story.is_archived ?? false}
              candidates={['03-arch.md']}
              missingMessage="03-arch.md aún no existe. Se crea cuando /architect cierra el ready package."
            />
          ),
        },
        {
          id: 'validators',
          label: '✓ Validators',
          content: (
            <ArtifactTab
              storyPath={story.path}
              storyState={story.state}
              isArchived={story.is_archived ?? false}
              candidates={['04-validators.yaml']}
              missingMessage="04-validators.yaml aún no existe. Se crea cuando /architect cierra el ready package."
            />
          ),
        },
        {
          id: 'tickets',
          label: '🎟 Tickets',
          content: (
            <ArtifactTab
              storyPath={story.path}
              storyState={story.state}
              isArchived={story.is_archived ?? false}
              candidates={['06-tickets.yaml']}
              missingMessage="06-tickets.yaml aún no existe. Se crea cuando /architect cierra el ready package."
            />
          ),
        },
        {
          id: 'audit',
          label: '✅ Audit',
          content: (
            <ArtifactTab
              storyPath={story.path}
              storyState={story.state}
              isArchived={story.is_archived ?? false}
              candidates={['06-audit/gherkin-matrix.md']}
              missingMessage="audit aún no se ejecutó. Se genera cuando /auditor cierra Phase D."
            />
          ),
        },
        {
          id: 'files',
          label: '📂 Files',
          content: <FilesTab storyPath={story.path} />,
        },
      ]
    : [];

  return (
    <Drawer
      open={storyId !== null}
      onClose={closeStory}
      title={
        story ? (
          <div className="flex items-center gap-2 min-w-0">
            <StateBadge state={story.state} />
            <span className="font-mono text-sm truncate">{story.story_id}</span>
            {story.is_archived && (
              <span className="text-[10px] text-[var(--color-muted)] uppercase">
                archive
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-[var(--color-muted)]">Story…</span>
        )
      }
      width={900}
    >
      {loading && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <Spinner /> Cargando story…
        </div>
      )}
      {error && <ErrorBanner message={error} />}
      {!loading && !error && story && (
        <>
          {story.goal && (
            <div className="mb-3 text-xs">
              <span className="text-[var(--color-muted)]">Goal:</span>{' '}
              {story.goal}
            </div>
          )}
          <Tabs tabs={tabs} />
        </>
      )}
      {!loading && !error && !story && storyId && (
        <EmptyState>Story sin datos.</EmptyState>
      )}
    </Drawer>
  );
}
