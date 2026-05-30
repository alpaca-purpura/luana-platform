'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, ClipboardList, Compass, BookOpen, Network, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '/roadmap', label: 'Roadmap', Icon: Map },
  { href: '/board', label: 'Backlog Board', Icon: ClipboardList },
  { href: '/map', label: 'Mapa Implementado', Icon: Compass },
  { href: '/arquitectura', label: 'Arquitectura', Icon: Network },
  { href: '/drift', label: 'Drift', Icon: AlertTriangle },
  { href: '/learnings', label: 'Learnings', Icon: BookOpen },
];

export function Sidebar({ brand }: { brand: string }) {
  const pathname = usePathname();

  return (
    <aside className="bg-[var(--color-panel)] border-r border-[var(--color-border)] w-56 flex flex-col shrink-0">
      <div className="px-4 py-4 border-b border-[var(--color-border)]">
        <h1 className="text-base font-semibold flex items-center gap-2">
          <span aria-hidden="true">🏥</span> Luana Cockpit
        </h1>
        <p className="text-[10px] text-[var(--color-muted)] mt-1">
          v0.6 · SDD multi-brand
        </p>
      </div>
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs transition-colors',
                active
                  ? 'bg-[var(--color-panel2)] text-[var(--color-text)] border-l-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-panel2)] hover:text-[var(--color-text)]'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-[var(--color-border)] text-[11px] text-[var(--color-muted)]">
        Brand activa: <span className="text-[var(--color-text)] font-medium">{brand}</span>
      </div>
    </aside>
  );
}
