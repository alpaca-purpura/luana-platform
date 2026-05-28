'use client';

import { MarkdownView } from './MarkdownView';
import { storyArtifactRel } from '@/lib/story-paths';

interface ArtifactTabProps {
  storyPath: string;
  /** Lista ordenada de artifacts candidatos · primero encontrado se renderiza */
  candidates: string[];
  missingMessage?: string;
}

export function ArtifactTab({
  storyPath,
  candidates,
  missingMessage,
}: ArtifactTabProps) {
  // Por ahora rendereamos el primer candidato. Si falla 404, el MarkdownView
  // muestra missingMessage. UX podría mejorar testando existencia HEAD vía
  // /api/file para encontrar el primero existente — Phase 6 quizás.
  const rel = storyArtifactRel(storyPath, candidates[0]);
  if (!rel) {
    return (
      <div className="text-xs text-[var(--color-muted)] italic">
        path inválido (story fuera del workspace).
      </div>
    );
  }
  return <MarkdownView relPath={rel} missingMessage={missingMessage} />;
}
