"use client";

/**
 * Providers — Nicolify root providers wrapper.
 *
 * Wraps the app with:
 *   1. ClerkProvider — Clerk authentication (Clerk auth delegada 100%)
 *   2. QueryClientProvider — React Query (data fetching)
 *
 * NOTE: No ThemeProvider yet — design tokens story is separate (nicolify-r0-design-system-tokens).
 * No TenantStoreBootstrap — tenant store is future story.
 *
 * T-3 (nicolify-r0-dev-stack): bootstrap auth vertical slice.
 * Port from vitalia/frontend/src/app/providers.tsx re-temizado para nicolify.
 */

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers — wraps app with ClerkProvider + QueryClientProvider.
 */
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 min default stale time
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ClerkProvider>
  );
}
