'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { Spinner, ErrorBanner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { BoardColumn } from './BoardColumn';
import { useBrand } from '@/components/providers/BrandProvider';
import { useFileWatchEvents } from '@/components/providers/FileWatchProvider';
import { isPlatform } from '@/lib/platform-context';
import {
  listReleases,
  listSessions,
  listStories,
  postTransition,
  type StoryWithArchive,
} from '@/lib/api-client';
import {
  CHRIS_ALLOWED_TRANSITIONS,
  type ActiveSession,
  type Release,
  type StoryState,
} from '@/lib/types';

const STATES_ORDER: StoryState[] = [
  'idea',
  'refining',
  'refined',
  'ready',
  'developing',
  'developed',
  'reviewing',
  'done',
  'parked',
  'dropped',
];

const WIP_CAPS: Partial<Record<StoryState, number>> = {
  refining: 3,
  refined: 5,
  ready: 5,
  developing: 3,
  developed: 1,
  reviewing: 1,
};

export function BoardView() {
  const { brand } = useBrand();
  const [stories, setStories] = useState<StoryWithArchive[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [sessionsByStory, setSessionsByStory] = useState<
    Record<string, ActiveSession>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterRelease, setFilterRelease] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [showParked, setShowParked] = useState(false);

  const [draggingState, setDraggingState] = useState<StoryState | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([listStories(brand), listReleases(brand)])
      .then(([s, r]) => {
        setStories(s);
        setReleases(r);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [brand]);

  useEffect(() => {
    load();
  }, [load]);

  // Build-claims vivos (ADR-009): `.session-locks/` es runtime gitignored → el
  // file-watcher de docs no los cubre. Poll liviano cada 5s + carga inicial.
  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      listSessions()
        .then((r) => {
          if (!cancelled) setSessionsByStory(r.by_story);
        })
        .catch(() => {
          /* sin .session-locks/ → mapa vacío, no es error */
        });
    refresh();
    const id = setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Live reload cuando un checkpoint o release del brand cambia
  useFileWatchEvents((event) => {
    if (event.brand && event.brand !== brand) return;
    if (event.docType === 'checkpoint' || event.docType === 'release') {
      load();
    }
  });

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      if (filterRelease && s.release !== filterRelease) return false;
      if (filterType && s.type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          s.story_id,
          s.goal ?? '',
          s.cap_target ?? '',
          s.module ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [stories, filterRelease, filterType, search]);

  const visibleStates = useMemo(() => {
    if (showParked) return STATES_ORDER;
    return STATES_ORDER.filter((s) => s !== 'parked' && s !== 'dropped');
  }, [showParked]);

  function handleDragStart(event: DragStartEvent) {
    const story = event.active.data.current?.story as StoryWithArchive | undefined;
    setDraggingState(story?.state ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDraggingState(null);
    // Platform es solo-lectura: sus transiciones las hace /pm-luana (vía ADR).
    if (isPlatform(brand)) {
      toast('Platform es solo lectura · las transiciones las hace /pm-luana.', {
        icon: '🔒',
      });
      return;
    }
    const { active, over } = event;
    if (!over) return;
    const overId = over.id as string;
    if (!overId.startsWith('state:')) return;

    const targetState = overId.replace('state:', '') as StoryState;
    const story = filtered.find((s) => s.story_id === active.id);
    if (!story) return;
    if (story.state === targetState) return;

    const allowed = CHRIS_ALLOWED_TRANSITIONS.find(
      (t) => t.from === story.state && t.to === targetState
    );

    if (!allowed) {
      toast.error(
        `Transición ${story.state} → ${targetState} la hace Claude vía skill.`
      );
      return;
    }

    if (allowed.requiresReason) {
      toast(
        `${allowed.verb} requiere razón. Abre la story para confirmar.`,
        { icon: '✋' }
      );
      return;
    }

    // Optimistic update
    setStories((prev) =>
      prev.map((s) =>
        s.story_id === story.story_id ? { ...s, state: targetState } : s
      )
    );

    try {
      await postTransition(brand, story.story_id, targetState);
      toast.success(`${story.story_id}: ${story.state} → ${targetState}`);
    } catch (err) {
      toast.error(`No se pudo: ${(err as Error).message}`);
      load();
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Spinner /> Cargando board…
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

  const wipRefining = filtered.filter((s) => s.state === 'refining').length;
  const wipDeveloping = filtered.filter((s) => s.state === 'developing').length;

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          Backlog Board · 10 estados v4
          {isPlatform(brand) && (
            <Badge className="bg-amber-900/30 text-amber-300 border border-amber-700/50">
              CORE · solo lectura
            </Badge>
          )}
        </h1>
        <p className="text-[11px] text-[var(--color-muted)] italic mt-1">
          {isPlatform(brand) ? (
            <>
              Stories platform-level (owner <span className="font-mono">/pm-luana</span>).
              Solo lectura: las transiciones se hacen vía skill, no acá.
            </>
          ) : (
            <>
              Arrastra entre <b>idea ↔ refining</b> para priorizar. El resto las
              mueve Claude vía /po-ux · /architect · /dev-team · /auditor.
            </>
          )}
        </p>
      </header>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <Select
          value={filterRelease}
          onChange={(e) => setFilterRelease(e.target.value)}
          className="!w-auto !py-1"
        >
          <option value="">release: todos</option>
          {releases.map((r) => (
            <option key={r.release_id} value={r.release_id}>
              {r.release_id} · {r.name}
            </option>
          ))}
        </Select>
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="!w-auto !py-1"
        >
          <option value="">tipo: todos</option>
          <option value="ui">ui</option>
          <option value="service">service</option>
          <option value="agentic">agentic</option>
          <option value="tech">tech</option>
          <option value="func">func</option>
        </Select>
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            className="!w-auto"
            checked={showParked}
            onChange={(e) => setShowParked(e.target.checked)}
          />
          mostrar parked + dropped
        </label>
        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-[var(--color-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="!py-1"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge
            className={
              wipRefining > 3
                ? 'bg-orange-900/40 text-orange-300'
                : 'bg-[var(--color-panel2)] text-[var(--color-muted)]'
            }
          >
            WIP refining {wipRefining}/3
          </Badge>
          <Badge
            className={
              wipDeveloping > 3
                ? 'bg-orange-900/40 text-orange-300'
                : 'bg-[var(--color-panel2)] text-[var(--color-muted)]'
            }
          >
            WIP developing {wipDeveloping}/3
          </Badge>
        </div>
      </div>

      {Object.keys(sessionsByStory).length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap text-[11px]">
          <span className="text-[var(--color-muted)]">🔨 Construyendo ahora:</span>
          {Object.values(sessionsByStory).map((s) => (
            <Badge
              key={s.storyId}
              className="bg-amber-900/30 text-amber-300 border border-amber-700/50 font-mono"
            >
              {s.lane ?? `pid${s.pid}`} → {s.storyId}
            </Badge>
          ))}
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {visibleStates.map((state) => (
            <BoardColumn
              key={state}
              state={state}
              stories={filtered.filter((s) => s.state === state)}
              draggingFromState={draggingState}
              wipCap={WIP_CAPS[state]}
              sessions={sessionsByStory}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
