import type { Metadata } from 'next';
import { getSelectableBrands } from '@/lib/workspace';
import { AppShell } from '@/components/layout/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luana Cockpit · SDD multi-brand',
  description: 'Visualizador + editor del workflow Spec-Driven Development de Luana platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  let brands: string[] = [];
  try {
    brands = getSelectableBrands();
  } catch {
    brands = ['vitalia'];
  }

  // Brand por defecto del worktree (cockpit-up.sh exporta DEFAULT_BRAND={brand}).
  // 'cross-brand' (hub main) o vacío → sin preferencia, usa la primera detectada.
  const envBrand = process.env.DEFAULT_BRAND;
  const defaultBrand =
    envBrand && envBrand !== 'cross-brand' ? envBrand : undefined;

  return (
    <html lang="es">
      <body>
        <AppShell brands={brands} defaultBrand={defaultBrand}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
