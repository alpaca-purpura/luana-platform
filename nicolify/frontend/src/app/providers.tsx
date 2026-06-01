"use client";

// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-1
/**
 * Providers — Nicolify root providers wrapper.
 *
 * Wraps the app with:
 *   1. ThemeProvider (next-themes) — attribute="data-theme", dark mode .dark class
 *   2. ClerkProvider — Clerk authentication (Clerk auth delegada 100%)
 *   3. QueryClientProvider — React Query (data fetching)
 *
 * ThemeProvider added in T-1 (nicolify-r0-shell tokens/theme).
 * storageKey: "nicolify-theme" (brand-scoped to avoid collision with vitalia).
 *
 * Spanish neutro: comentarios técnicos en español neutro.
 */

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers — ThemeProvider + ClerkProvider + QueryClientProvider.
 */
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 min stale time default
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      storageKey="nicolify-theme"
      disableTransitionOnChange
    >
      <ClerkProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}
