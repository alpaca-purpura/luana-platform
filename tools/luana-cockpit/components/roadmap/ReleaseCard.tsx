'use client';

import { useDroppable } from '@dnd-kit/core';
import { Rocket } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { ReleaseStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Spinner';
import { StoryChip } from './StoryChip';
import type { Release } from '@/lib/types';
import type { StoryWithArchive } from '@/lib/api-client';

interface ReleaseCardProps {
  release: Release;
  stories: StoryWithArchive[];
  onMergeRequested: (releaseId: string) => void;
}

const TERMINAL_STATES = new Set(['done', 'dropped']);

export function ReleaseCard({ release, stories, onMergeRequested }: ReleaseCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `release:${release.release_id}`,
    data: { releaseId: release.release_id },
  });

  const allTerminal =
    stories.length > 0 && stories.every((s) => TERMINAL_STATES.has(s.state));
  const ready =
    release.status === 'ready_to_merge' ||
    (release.status === 'in_progress' && allTerminal);

  // Counts por estado para badge
  const counts = stories.reduce<Record<string, number>>((acc, s) => {
    acc[s.state] = (acc[s.state] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-[var(--color-panel)] border border-[var(--color-border)] rounded-lg">
      <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-semibold">
              {release.release_id}
            </span>
            <ReleaseStatusBadge status={release.status} />
            <span className="text-[11px] text-[var(--color-muted)]">
              {stories.length} stories
            </span>
          </div>
          <div className="text-xs">{release.name}</div>
          {release.description && (
            <div className="text-[11px] text-[var(--color-muted)] mt-0.5 line-clamp-2">
              {release.description}
            </div>
          )}
          {release.target_date && (
            <div className="text-[10px] text-[var(--color-muted)] mt-1 font-mono">
              🗓 target: {release.target_date}
            </div>
          )}
        </div>
        {ready && release.status !== 'shipped' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => onMergeRequested(release.release_id)}
          >
            <Rocket className="w-3 h-3" />
            Merge a main
          </Button>
        )}
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          'p-3 min-h-[100px] transition-colors rounded-b-lg',
          isOver && 'bg-[var(--color-accent)]/10 border-2 border-dashed border-[var(--color-accent)]/50'
        )}
      >
        {stories.length === 0 ? (
          <EmptyState>Sin stories asignadas todavía.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {stories.map((s) => (
              <StoryChip key={s.story_id} story={s} />
            ))}
          </div>
        )}

        {/* Mini state counts */}
        {Object.keys(counts).length > 0 && (
          <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex flex-wrap gap-1.5">
            {Object.entries(counts).map(([state, count]) => (
              <span
                key={state}
                className="text-[10px] px-1.5 py-0.5 bg-[var(--color-panel2)] border border-[var(--color-border)] rounded font-mono"
              >
                {state} · {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
