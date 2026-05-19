import type { Metadata } from "next";
import { AppShell } from "@/components/shared/shell";

export const metadata: Metadata = {
  title: "Panel — Vitalia",
};

/**
 * Dashboard layout — AppShell with Sidebar + TopBar.
 *
 * T-3: Reemplaza placeholder shell con AppShell real (Sidebar + TopBar).
 * Sidebar y TopBar son Client Components (estado colapso + acciones).
 * Este layout file es Server Component — solo pasa `children`.
 *
 * D9: chrome UI Spanish neutro tuteo.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
