'use client';

import { Select } from '@/components/ui/Select';
import { useBrand } from '@/components/providers/BrandProvider';

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
            {b}
          </option>
        ))}
      </Select>
    </div>
  );
}
