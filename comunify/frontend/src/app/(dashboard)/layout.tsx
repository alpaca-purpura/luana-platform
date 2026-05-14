import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Comunify",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar placeholder — full implementation in T-fe-4/T-fe-6 */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <span className="text-lg font-semibold text-gray-900">Comunify</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Navegación principal">
          {/* Nav items added in T-fe-4 */}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
