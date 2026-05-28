'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (id: string) => void;
}

export function Tabs({ tabs, defaultTab, onChange }: TabsProps) {
  const [active, setActive] = useState<string>(defaultTab ?? tabs[0]?.id ?? '');
  const current = tabs.find((t) => t.id === active);

  function handleClick(id: string) {
    setActive(id);
    onChange?.(id);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0 border-b border-[var(--color-border)] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={t.disabled}
            onClick={() => !t.disabled && handleClick(t.id)}
            className={cn(
              'px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 border-transparent',
              active === t.id
                ? 'text-[var(--color-text)] border-[var(--color-accent)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]',
              t.disabled && 'opacity-30 cursor-not-allowed'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto py-4">{current?.content}</div>
    </div>
  );
}
