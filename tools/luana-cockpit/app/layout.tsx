import type { Metadata } from 'next';
import { getBrands } from '@/lib/workspace';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luana Cockpit · SDD multi-brand',
  description: 'Visualizador + editor del workflow Spec-Driven Development de Luana platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  let brands: string[] = [];
  try {
    brands = getBrands();
  } catch {
    brands = ['vitalia'];
  }

  return (
    <html lang="es">
      <body>
        <AppShell brands={brands}>{children}</AppShell>
      </body>
    </html>
  );
}
