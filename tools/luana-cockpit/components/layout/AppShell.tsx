'use client';

import { Toaster } from 'react-hot-toast';
import { type ReactNode } from 'react';
import { BrandProvider, useBrand } from '@/components/providers/BrandProvider';
import { DrawerProvider } from '@/components/providers/DrawerProvider';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StoryDrawer } from '@/components/story-drawer/StoryDrawer';
import { CapDrawer } from '@/components/cap-drawer/CapDrawer';

function ShellInner({ children }: { children: ReactNode }) {
  const { brand } = useBrand();
  return (
    <div className="flex min-h-screen h-screen overflow-hidden">
      <Sidebar brand={brand} />
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
      <StoryDrawer />
      <CapDrawer />
    </div>
  );
}

export function AppShell({
  children,
  brands,
}: {
  children: ReactNode;
  brands: string[];
}) {
  return (
    <BrandProvider brands={brands}>
      <DrawerProvider>
        <ShellInner>{children}</ShellInner>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-panel2)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontSize: '12px',
            },
          }}
        />
      </DrawerProvider>
    </BrandProvider>
  );
}
