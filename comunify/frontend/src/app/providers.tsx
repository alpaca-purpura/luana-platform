"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

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
      })
  );

  return (
    // ThemeProvider (next-themes) — attribute="data-theme" → sets <html data-theme="dark">.
    // Required for the dark toggle to work (ThemeToggle was a no-op without a provider).
    // Pairs with globals.css @custom-variant + .dark/[data-theme] overrides (canon §2.10).
    // storageKey brand-scoped to avoid collision across brand dev tabs.
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      storageKey="comunify-theme"
      disableTransitionOnChange
    >
      <ClerkProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}
