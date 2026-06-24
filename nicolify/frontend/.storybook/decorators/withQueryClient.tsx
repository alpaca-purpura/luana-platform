/**
 * withSeededQuery — Storybook decorator que crea un QueryClient fresco
 * y lo pre-puebla con datos sintéticos antes de renderizar la story.
 *
 * Patrón cache-seed (NO MSW, NO vi.mock):
 *   qc.setQueryData(key, fixture) → React Query lee del cache (staleTime=Infinity).
 *
 * Uso:
 * ```tsx
 * export const MiStory: StoryObj<...> = {
 *   decorators: [withSeededQuery((qc) => {
 *     qc.setQueryData(['abel', 'icp', 'list'], icpListFixture);
 *   })],
 * };
 * ```
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Decorator } from "@storybook/nextjs-vite";

/**
 * Crea un decorator que envuelve la story en un QueryClientProvider con
 * datos pre-cargados vía setQueryData.
 *
 * @param seed función que recibe el QueryClient recién creado y lo puebla
 */
export const withSeededQuery = (seed: (qc: QueryClient) => void): Decorator =>
  function WithSeededQueryDecorator(Story) {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
          gcTime: Infinity,
        },
      },
    });
    seed(qc);
    return (
      <QueryClientProvider client={qc}>
        <Story />
      </QueryClientProvider>
    );
  };

/**
 * Decorator sin datos pre-cargados — solo provee el QueryClientProvider.
 * Útil para stories que no necesitan datos (loading / empty states puros).
 */
export const withEmptyQuery: Decorator = function WithEmptyQueryDecorator(Story) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
    },
  });
  return (
    <QueryClientProvider client={qc}>
      <Story />
    </QueryClientProvider>
  );
};
