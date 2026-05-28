'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/cn';
import { StateBadge } from '@/components/ui/Badge';
import { BoardCard } from './BoardCard';
import type { StoryState } from '@/lib/types';
import type { StoryWithArchive } from '@/lib/api-client';
import { CHRIS_ALLOWED_TRANSITIONS } from '@/lib/types';

interface BoardColumnProps {
  state: StoryState;
  stories: StoryWithArchive[];
  /** Estado origen que se está dragging (para feedback drop allowed/forbidden) */
  draggingFromState: StoryState | null;
  wipCap?: number;
}

export function BoardColumn({
  state,
  stories,
  draggingFromState,
  wipCap,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `state:${state}`,
    data: { state },
  });

  let dropFeedback: 'allowed' | 'forbidden' | null = null;
  if (draggingFromState && draggingFromState !== state) {
    const allowed = CHRIS_ALLOWED_TRANSITIONS.some(
      (t) => t.from === draggingFromState && t.to === state
    );
    dropFeedback = allowed ? 'allowed' : 'forbidden';
  }

  return (
    <div className="w-48 shrink-0 flex flex-col">
      <header className="flex items-center justify-between mb-2 px-1">
        <StateBadge state={state} />
        <div className="text-[10px] text-[var(--color-muted)] font-mono">
          {stories.length}
          {wipCap !== undefined && (
            <span className={stories.length > wipCap ? 'text-orange-400' : ''}>
              /{wipCap}
            </span>
          )}
        </div>
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[400px] p-1.5 rounded border transition-colors',
          'bg-[var(--color-panel)] border-[var(--color-border)]',
          isOver && dropFeedback === 'allowed' && 'bg-[var(--color-accent)]/10 border-dashed border-[var(--color-accent)]',
          isOver && dropFeedback === 'forbidden' && 'bg-red-900/10 border-dashed border-red-700'
        )}
      >
        {stories.length === 0 ? (
          <div className="text-[10px] text-[var(--color-muted)] italic text-center mt-4">
            Sin stories.
          </div>
        ) : (
          <div className="space-y-1.5">
            {stories.map((s) => (
              <BoardCard key={s.story_id} story={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
