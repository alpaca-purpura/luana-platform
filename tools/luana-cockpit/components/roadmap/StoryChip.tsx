'use client';

import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/cn';
import { StateBadge } from '@/components/ui/Badge';
import { useDrawer } from '@/components/providers/DrawerProvider';
import type { StoryWithArchive } from '@/lib/api-client';

const DRAGGABLE_STATES = new Set(['idea', 'refining', 'refined']);

export function StoryChip({ story }: { story: StoryWithArchive }) {
  const { openStory } = useDrawer();
  const draggable = DRAGGABLE_STATES.has(story.state);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: story.story_id,
    disabled: !draggable,
    data: { story },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? listeners : {})}
      {...attributes}
      onClick={(e) => {
        // No abrir drawer al iniciar drag
        if (isDragging) return;
        e.stopPropagation();
        openStory(story.story_id);
      }}
      className={cn(
        'p-2 rounded border text-xs bg-[var(--color-panel2)] border-[var(--color-border)]',
        'hover:border-[#3a4358] transition-all',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        isDragging && 'opacity-40'
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <StateBadge state={story.state} />
        {story.priority && (
          <span className="text-[10px] font-mono text-[var(--color-muted)]">
            {story.priority}
          </span>
        )}
      </div>
      <div className="font-mono text-[11px] truncate">{story.story_id}</div>
      {story.goal && (
        <div className="text-[11px] text-[var(--color-muted)] truncate mt-0.5">
          {story.goal}
        </div>
      )}
    </div>
  );
}
