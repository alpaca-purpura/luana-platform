"use client";

import { useCallback, useState } from "react";

export type NicheSlug =
  | "coaching_life"
  | "coaching_business"
  | "coaching_health"
  | "coaching_fitness"
  | "coaching_finance"
  | "consulting"
  | "mentoring"
  | "teaching"
  | "therapy"
  | "other";

export function useCreatorNiche() {
  const [selectedNiche, setSelectedNiche] = useState<NicheSlug | null>(null);

  const selectNiche = useCallback((niche: NicheSlug) => {
    setSelectedNiche(niche);
  }, []);

  const clearNiche = useCallback(() => {
    setSelectedNiche(null);
  }, []);

  return { selectedNiche, selectNiche, clearNiche };
}
