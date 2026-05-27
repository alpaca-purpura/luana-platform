import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luana Cockpit · SDD multi-brand',
  description: 'Visualizador + editor del workflow Spec-Driven Development de Luana platform',
};

const NAV_ITEMS = [
  { href: '/roadmap', label: 'Roadmap', icon: '🗺' },
  { href: '/board', label: 'Backlog Board', icon: '📋' },
  { href: '/map', label: 'Mapa Implementado', icon: '🧭' },
  { href: '/learnings', label: 'Learnings', icon: '📚' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen">
          {/* Sidebar — placeholder · Phase 5.4 implementará la nav completa */}
          <aside className="panel w-56 border-r border-[var(--color-border)] flex flex-col">
            <div className="px-4 py-4 border-b border-[var(--color-border)]">
              <h1 className="text-base font-semibold">Luana Cockpit</h1>
              <p className="text-xs text-muted mt-1">v0.6 · SDD multi-brand</p>
            </div>
            <nav className="flex-1 py-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-sm hover:bg-[var(--color-panel2)] transition-colors"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-[var(--color-border)] text-xs text-muted">
              Brand: <span className="text-text">vitalia</span>
            </div>
          </aside>

          <main className="flex-1 flex flex-col">
            {/* Header — placeholder · Phase 5.4 implementará brand switcher + filters */}
            <header className="panel border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm text-muted">Workspace</span>
                <span className="ml-2 text-sm">luana-platform</span>
              </div>
              <div className="text-xs text-muted">
                Phase 5.1 · skeleton workspace
              </div>
            </header>

            <div className="flex-1 overflow-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
