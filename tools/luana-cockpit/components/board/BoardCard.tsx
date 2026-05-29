'use client';

import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/cn';
import { StateBadge, Pill } from '@/components/ui/Badge';
import { useDrawer } from '@/components/providers/DrawerProvider';
import type { StoryWithArchive } from '@/lib/api-client';

// Solo idea ↔ refining son draggables (Chris-allowed)
const DRAGGABLE_STATES = new Set(['idea', 'refining']);

export function BoardCard({ story }: { story: StoryWithArchive }) {
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
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? listeners : {})}
      {...attributes}
      onClick={() => {
        if (isDragging) return;
        openStory(story.story_id);
      }}
      className={cn(
        'p-2 rounded border text-xs bg-[var(--color-panel2)] border-[var(--color-border)]',
        'hover:border-[#3a4358] transition-all',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        isDragging && 'opacity-40'
      )}
    >
      <div className="font-mono text-[10px] text-[var(--color-muted)] mb-1 truncate">
        {story.story_id}
      </div>
      {story.parse_error && (
        <div
          className="mb-1 px-1.5 py-1 rounded bg-red-950/50 border border-red-700 text-red-300 text-[10px] leading-tight"
          title={story.parse_error}
        >
          ⚠ checkpoint inválido — {story.parse_error}
        </div>
      )}
      {story.goal && (
        <div className="text-[11px] line-clamp-2">{story.goal}</div>
      )}
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {story.priority && (
          <Pill className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-text)]">
            {story.priority}
          </Pill>
        )}
        {story.surfaces?.map((s) => (
          <Pill
            key={s}
            className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-muted)]"
          >
            {s}
          </Pill>
        ))}
        {story.cap_target && (() => {
          const parts = story.cap_target.split('.');
          if (parts.length === 2) {
            const [agentPart, areaPart] = parts;
            return (
              <>
                <Pill className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-muted)] text-[10px]">
                  {agentPart}
                </Pill>
                <Pill className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-muted)] text-[10px] opacity-75">
                  {areaPart}
                </Pill>
              </>
            );
          }
          // Fallback para format legacy "module/slug"
          return (
            <Pill className="bg-[var(--color-panel)] border border-[var(--color-border)] text-[var(--color-muted)]">
              {story.cap_target}
            </Pill>
          );
        })()}
      </div>
    </div>
  );
}
