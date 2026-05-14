import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel — Vitalia",
};

/**
 * Layout del panel de administración — sidebar + header (contexto clinic_owner).
 * Sidebar real con @luana/shared SidebarLayout en T-fe-3.
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      {/* TODO T-fe-3: sidebar con <SidebarLayout> de @luana/shared */}
      <aside
        className="hidden w-64 flex-shrink-0 border-r bg-white lg:block"
        aria-label="Navegación principal"
      >
        <div className="p-4">
          <p className="text-xs text-gray-400">
            Sidebar — pendiente T-fe-3
          </p>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        {/* TODO T-fe-3: header con <PageHeader> + <TenantSwitcher> */}
        <header className="border-b bg-white px-6 py-4">
          <p className="text-xs text-gray-400">
            Header — pendiente T-fe-3
          </p>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
