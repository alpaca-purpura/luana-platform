'use client';

import { Select } from '@/components/ui/Select';
import { useBrand } from '@/components/providers/BrandProvider';
import { PLATFORM_SLUG, PLATFORM_LABEL } from '@/lib/platform-context';

/** Label visible por contexto: platform se distingue de las marcas reales. */
function brandOptionLabel(b: string): string {
  return b === PLATFORM_SLUG ? `⬡ ${PLATFORM_LABEL}` : b;
}

export function BrandSwitcher() {
  const { brand, setBrand, brands } = useBrand();

  if (brands.length <= 1) {
    return (
      <div className="text-[11px] text-[var(--color-muted)]">
        Brand: <span className="text-[var(--color-text)] font-medium">{brand}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] text-[var(--color-muted)]" htmlFor="brand-switcher">
        Brand
      </label>
      <Select
        id="brand-switcher"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        className="!w-auto !py-1"
      >
        {brands.map((b) => (
          <option key={b} value={b}>
            {brandOptionLabel(b)}
          </option>
        ))}
      </Select>
    </div>
  );
}
