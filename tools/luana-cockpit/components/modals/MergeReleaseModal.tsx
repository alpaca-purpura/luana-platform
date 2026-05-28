'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner, ErrorBanner } from '@/components/ui/Spinner';
import { useBrand } from '@/components/providers/BrandProvider';
import { postMergeRelease, type MergeReleasePlan } from '@/lib/api-client';

interface MergeReleaseModalProps {
  open: boolean;
  onClose: () => void;
  releaseId: string;
  onMerged?: () => void;
}

export function MergeReleaseModal({
  open,
  onClose,
  releaseId,
  onMerged,
}: MergeReleaseModalProps) {
  const { brand } = useBrand();
  const [plan, setPlan] = useState<MergeReleasePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setConfirmed(false);
    postMergeRelease(brand, releaseId, false)
      .then((p) => setPlan(p))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [open, brand, releaseId]);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const result = await postMergeRelease(brand, releaseId, true);
      if (result.note) {
        toast(result.note, { icon: 'ℹ️' });
      } else {
        toast.success(`Merge ejecutado para ${releaseId}`);
      }
      onClose();
      onMerged?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Merge release ${releaseId} a main`}
      size="lg"
    >
      {loading && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <Spinner /> Construyendo preview…
        </div>
      )}
      {error && <ErrorBanner message={error} />}
      {plan && (
        <>
          <p className="text-xs text-[var(--color-muted)] mb-3">
            Operaciones planeadas (preview · nada se ha ejecutado todavía). En
            v0.6 esto sólo registra la intención · la ejecución real (git mv +
            squash-merge + release-notes) la haces tú o vía{' '}
            <span className="font-mono">/pm-{brand}</span>.
          </p>
          <ol className="space-y-2 mb-4">
            {plan.plan.map((op, i) => (
              <li
                key={i}
                className="bg-[var(--color-panel2)] border border-[var(--color-border)] rounded p-3 text-xs"
              >
                <div className="font-mono text-[10px] text-[var(--color-accent)] mb-1">
                  [{i + 1}] {op.op}
                </div>
                <div>{op.description}</div>
              </li>
            ))}
          </ol>

          <label className="flex items-start gap-2 text-xs mb-4">
            <input
              type="checkbox"
              className="!w-auto mt-0.5"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              Entendido. Confirmo que la ejecución real de git mv +
              squash-merge la haré manualmente o vía{' '}
              <span className="font-mono">/pm-{brand}</span>.
            </span>
          </label>

          <div className="flex justify-end gap-2">
            <Button onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              disabled={!confirmed || submitting}
              onClick={handleConfirm}
            >
              Registrar intención de merge
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
