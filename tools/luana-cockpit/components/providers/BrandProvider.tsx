'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface BrandContextValue {
  brand: string;
  setBrand: (b: string) => void;
  brands: string[];
}

const BrandContext = createContext<BrandContextValue | null>(null);

const STORAGE_KEY = 'cockpit:brand';
const DEFAULT_BRAND = 'vitalia';

export function BrandProvider({
  children,
  brands,
}: {
  children: ReactNode;
  brands: string[];
}) {
  const [brand, setBrandState] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_BRAND;
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_BRAND;
  });

  useEffect(() => {
    // Verifica que la brand persistida sigue disponible
    if (brands.length > 0 && !brands.includes(brand)) {
      setBrandState(brands[0]);
    }
  }, [brand, brands]);

  const setBrand = (b: string) => {
    setBrandState(b);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, b);
    }
  };

  const value = useMemo(
    () => ({ brand, setBrand, brands }),
    [brand, brands]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand fuera de BrandProvider');
  return ctx;
}
