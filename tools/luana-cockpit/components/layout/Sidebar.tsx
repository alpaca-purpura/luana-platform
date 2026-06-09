'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map,
  ClipboardList,
  Compass,
  BookOpen,
  Network,
  AlertTriangle,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { viewAppliesTo, isPlatform, PLATFORM_LABEL, type CockpitView } from '@/lib/platform-context';
import { listCilBoard } from '@/lib/api-client';

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** Vista a la que mapea · usado para atenuar las que no aplican a platform. */
  view?: CockpitView;
}

// Vistas brand-scoped (dependen de la marca activa).
const NAV_ITEMS: NavItem[] = [
  { href: '/roadmap', label: 'Roadmap', Icon: Map, view: 'roadmap' },
  { href: '/board', label: 'Backlog Board', Icon: ClipboardList, view: 'board' },
  { href: '/map', label: 'Mapa Implementado', Icon: Compass, view: 'map' },
  { href: '/arquitectura', label: 'Arquitectura', Icon: Network, view: 'arquitectura' },
  { href: '/drift', label: 'Drift', Icon: AlertTriangle, view: 'drift' },
  { href: '/learnings', label: 'Learnings', Icon: BookOpen, view: 'learnings' },
];

// Vistas transversales (no dependen de la marca · core/harness/CIL).
const CORE_NAV_ITEMS: NavItem[] = [
  { href: '/harness', label: 'Harness · CIL', Icon: Wrench },
];

function NavLink({
  item,
  active,
  dimmed,
  badge,
}: {
  item: NavItem;
  active: boolean;
  dimmed?: boolean;
  badge?: number;
}) {
  const { href, label, Icon } = item;
  return (
    <Link
      href={href}
      title={dimmed ? 'No aplica para Platform' : undefined}
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-xs transition-colors',
        active
          ? 'bg-[var(--color-panel2)] text-[var(--color-text)] border-l-2 border-[var(--color-accent)]'
          : 'text-[var(--color-muted)] hover:bg-[var(--color-panel2)] hover:text-[var(--color-text)]',
        dimmed && 'opacity-40'
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {badge != null && badge > 0 && (
        <span
          className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-300 border border-amber-700/50"
          title={`${badge} items abiertos en el CIL (L1 harness + L3 deuda)`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ brand }: { brand: string }) {
  const pathname = usePathname();
  // Badge en vivo del nav /harness = items abiertos del CIL (L1 + L3). Best-effort:
  // si el fetch falla (worktree sin archivos), el badge simplemente no aparece.
  const [cilOpen, setCilOpen] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    listCilBoard()
      .then((b) => alive && setCilOpen(b.l1.open + b.l3.open))
      .catch(() => alive && setCilOpen(null));
    return () => {
      alive = false;
    };
  }, []);

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
      <nav className="flex-1 py-3 flex flex-col">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href}
            dimmed={item.view ? !viewAppliesTo(brand, item.view) : false}
          />
        ))}
        <div className="px-4 pt-4 pb-1 text-[9px] uppercase tracking-wider text-[var(--color-muted)]">
          Transversal · core
        </div>
        {CORE_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname === item.href}
            badge={item.href === '/harness' ? cilOpen ?? undefined : undefined}
          />
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-[var(--color-border)] text-[11px] text-[var(--color-muted)]">
        {isPlatform(brand) ? (
          <span>
            Contexto:{' '}
            <span className="text-[var(--color-text)] font-medium">⬡ {PLATFORM_LABEL}</span>
            <span className="block text-[10px] mt-0.5 italic">
              stories transversales (owner /pm-luana) — Board + Learnings
            </span>
          </span>
        ) : (
          <span>
            Brand activa: <span className="text-[var(--color-text)] font-medium">{brand}</span>
            <span className="block text-[10px] mt-0.5 italic">
              ⬡ stories platform/core → elegí «Platform · core» en el selector
            </span>
          </span>
        )}
      </div>
    </aside>
  );
}
