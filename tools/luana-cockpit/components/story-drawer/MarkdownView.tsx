'use client';

import { useEffect, useState } from 'react';
import { Spinner, ErrorBanner, EmptyState } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ExternalLink } from 'lucide-react';
import { getFile, openInEditor } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface MarkdownViewProps {
  /** Path relativo al workspace root (whitelist /api/file aplica). */
  relPath: string;
  /** Mensaje si el archivo no existe (404) */
  missingMessage?: string;
}

/**
 * Render markdown sin librería externa pesada — usa pre-formatted con
 * estilos básicos. Para v0.6 mínima viable. Phase 6 podría agregar
 * react-markdown si se valida que la UX simple no es suficiente.
 */
export function MarkdownView({ relPath, missingMessage }: MarkdownViewProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMissing(false);
    getFile(relPath)
      .then((c) => {
        if (cancelled) return;
        setContent(c);
      })
      .catch((err: Error & { status?: number }) => {
        if (cancelled) return;
        if (err.status === 404) {
          setMissing(true);
        } else {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [relPath]);

  async function handleOpenInEditor() {
    try {
      await openInEditor(relPath);
      toast.success('archivo abierto en editor externo');
    } catch (err) {
      toast.error(`error abriendo: ${(err as Error).message}`);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 justify-between">
        <div className="text-[11px] text-[var(--color-muted)] font-mono truncate">
          {relPath}
        </div>
        <Button size="sm" onClick={handleOpenInEditor} className="shrink-0">
          <ExternalLink className="w-3 h-3" />
          xed
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <Spinner />
          Cargando archivo…
        </div>
      )}
      {error && <ErrorBanner message={error} />}
      {missing && (
        <EmptyState>{missingMessage ?? 'archivo no existe todavía.'}</EmptyState>
      )}
      {content !== null && (
        <pre className="bg-[var(--color-panel2)] border border-[var(--color-border)] rounded p-3 text-xs whitespace-pre-wrap font-mono leading-relaxed text-[var(--color-text)] overflow-x-auto max-h-[60vh]">
          {content}
        </pre>
      )}
    </div>
  );
}
