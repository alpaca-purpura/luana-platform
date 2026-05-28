'use client';

import { BrandSwitcher } from './BrandSwitcher';

export function Header() {
  return (
    <header className="bg-[var(--color-panel)] border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between gap-4 shrink-0">
      <BrandSwitcher />
      <div className="flex items-center gap-3 text-[11px] text-[var(--color-muted)]">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"
          />
          watching
        </span>
        <span className="hidden sm:inline">workspace · luana-platform</span>
        <span>chris</span>
      </div>
    </header>
  );
}
