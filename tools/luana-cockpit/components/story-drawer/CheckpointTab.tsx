'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { StoryWithArchive } from '@/lib/api-client';
import { postTransition } from '@/lib/api-client';
import { CHRIS_ALLOWED_TRANSITIONS, type StoryState } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { StateBadge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { useBrand } from '@/components/providers/BrandProvider';

interface CheckpointTabProps {
  story: StoryWithArchive;
  onUpdated: () => void;
}

const STATE_OWNERS: Partial<Record<StoryState, string>> = {
  refined: '/architect (o /pm-{brand} para ratificar)',
  ready: '/architect (cierra ready package)',
  developing: '/dev-team',
  developed: '/dev-team',
  reviewing: '/auditor (AUTO-HANDOFF desde developed)',
  done: '/pm-{brand} (Fase F MERGE)',
};

export function CheckpointTab({ story, onUpdated }: CheckpointTabProps) {
  const { brand } = useBrand();
  const [pendingTarget, setPendingTarget] = useState<StoryState | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allowedTransitions = CHRIS_ALLOWED_TRANSITIONS.filter(
    (t) => t.from === story.state
  );

  async function executeTransition(target: StoryState, reasonText: string) {
    setSubmitting(true);
    try {
      await postTransition(brand, story.story_id, target, reasonText || undefined);
      toast.success(`Estado: ${story.state} → ${target}`);
      setPendingTarget(null);
      setReason('');
      onUpdated();
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  function handleTransitionClick(target: StoryState) {
    const transition = CHRIS_ALLOWED_TRANSITIONS.find(
      (t) => t.from === story.state && t.to === target
    );
    if (!transition) return;
    if (transition.requiresReason) {
      setPendingTarget(target);
    } else {
      executeTransition(target, '');
    }
  }

  const isTerminal = story.state === 'done' || story.state === 'dropped';
  const isDone = story.state === 'done';

  return (
    <div className="space-y-4">
      {/* Estado actual + frontmatter read-only */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Estado actual</h3>
          <StateBadge state={story.state} />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <FmField label="Story ID" value={story.story_id} mono />
          <FmField label="Brand" value={story.brand} />
          <FmField label="Release" value={story.release ?? '—'} />
          <FmField label="Cap target" value={story.cap_target ?? '—'} mono />
          <FmField
            label="Cap change type"
            value={story.cap_change_type ?? '—'}
          />
          <FmField label="Parent story" value={story.parent_story ?? '—'} mono />
          <FmField label="Owner" value={story.owner ?? '—'} />
          <FmField label="Type" value={story.type ?? '—'} />
          <FmField label="Module" value={story.module ?? '—'} />
          <FmField label="Priority" value={story.priority ?? '—'} />
        </dl>

        {story.next_action && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-xs">
            <div className="text-[var(--color-muted)] mb-1">Next action:</div>
            <div className="font-mono text-[11px] bg-[var(--color-panel)] px-2 py-1 rounded">
              {story.next_action}
            </div>
          </div>
        )}

        {story.parked_reason && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-xs">
            <div className="text-[var(--color-muted)] mb-1">Razón parked:</div>
            <div className="italic">{story.parked_reason}</div>
          </div>
        )}
        {story.dropped_reason && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-xs">
            <div className="text-[var(--color-muted)] mb-1">Razón dropped:</div>
            <div className="italic">{story.dropped_reason}</div>
          </div>
        )}
      </Card>

      {/* Banner done */}
      {isDone && (
        <div className="px-3 py-2 bg-[#14532d]/30 border border-[#14532d] rounded text-xs text-[#86efac]">
          ✓ Esta story está cementada. Para extender el resultado, crea una story
          hija basada en esta desde la pestaña Files o desde el botón abajo.
        </div>
      )}

      {/* Acciones permitidas a chris */}
      <div>
        <div className="text-xs text-[var(--color-muted)] mb-2 font-medium">
          Transiciones permitidas
        </div>
        {allowedTransitions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allowedTransitions.map((t) => (
              <Button
                key={t.to}
                variant={t.to === 'dropped' ? 'danger' : 'default'}
                size="sm"
                onClick={() => handleTransitionClick(t.to)}
                disabled={submitting}
              >
                {t.verb} → <StateBadge state={t.to} className="ml-1" />
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[var(--color-muted)] italic">
            {isTerminal
              ? 'Estado terminal · no admite transiciones desde el cockpit.'
              : `La transición desde ${story.state} la ejecuta ${
                  STATE_OWNERS[story.state] ?? 'una skill de Claude'
                }. Invoca la skill desde Claude Code.`}
          </div>
        )}
      </div>

      {/* Modal pedir razón */}
      <Modal
        open={pendingTarget !== null}
        onClose={() => {
          setPendingTarget(null);
          setReason('');
        }}
        title={`Razón obligatoria → ${pendingTarget}`}
        size="md"
      >
        <p className="text-xs text-[var(--color-muted)] mb-3">
          Esta razón queda registrada en checkpoint.md y sirve como contexto
          futuro (al reactivar parked o auditar dropped).
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Por qué tomás esta decisión… (mínimo 10 caracteres)"
          rows={4}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={() => {
              setPendingTarget(null);
              setReason('');
            }}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant={pendingTarget === 'dropped' ? 'danger' : 'primary'}
            disabled={reason.trim().length < 10 || submitting}
            onClick={() => pendingTarget && executeTransition(pendingTarget, reason)}
          >
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function FmField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="text-[var(--color-muted)]">{label}</dt>
      <dd className={mono ? 'font-mono text-[11px]' : ''}>{value}</dd>
    </>
  );
}
