import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Workspace root = luana-nicolify/ (two levels up from nicolify/frontend)
const WS_ROOT = path.resolve(__dirname, '../../')
const LUANA_HOOKS_SRC = path.resolve(WS_ROOT, 'core/@luana/hooks/src')

// Map @luana/* workspace packages to their source for test environment.
// zustand is a peerDependency of @luana/hooks. In Vitest, when Vite
// processes the aliased source file at core/@luana/hooks/src/, it
// looks for 'zustand' relative to that file's path — but there's no
// node_modules/zustand in core/ (pnpm hoists it to the consumer).
// Fix: also alias 'zustand' so it always resolves from nicolify/frontend.
const FRONTEND_NM = path.resolve(__dirname, 'node_modules')
const lanaAliases = {
  '@luana/hooks/create-ssr-safe-persisted-store': path.join(LUANA_HOOKS_SRC, 'create-ssr-safe-persisted-store.ts'),
  '@luana/hooks/use-store-hydration': path.join(LUANA_HOOKS_SRC, 'use-store-hydration.ts'),
  '@luana/hooks/use-copilot-offset': path.join(LUANA_HOOKS_SRC, 'use-copilot-offset.ts'),
  '@luana/hooks/use-shell-mutex': path.join(LUANA_HOOKS_SRC, 'use-shell-mutex.ts'),
  '@luana/hooks/use-is-mounted': path.join(LUANA_HOOKS_SRC, 'use-is-mounted.ts'),
  '@luana/hooks/use-viewport': path.join(LUANA_HOOKS_SRC, 'use-viewport.ts'),
  '@luana/hooks': path.join(LUANA_HOOKS_SRC, 'index.ts'),
  // Force zustand to resolve from nicolify/frontend so workspace src files can find it
  'zustand': path.join(FRONTEND_NM, 'zustand'),
  'zustand/middleware': path.join(FRONTEND_NM, 'zustand/middleware'),
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: lanaAliases,
    dedupe: ['zustand', 'react', 'react-dom'],
  },
  test: {
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    exclude: ['e2e/**', 'node_modules/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      ...lanaAliases,
    },
    coverage: {
      provider: 'v8',
      include: ['src/features/**', 'src/lib/**', 'src/components/shared/**'],
      exclude: ['src/components/ui/**', '**/*.d.ts', '**/*.test.*', '**/*.md'],
      reporter: ['text', 'text-summary'],
      thresholds: {
        // Phase 4 Milestone 1: 20% (achieved 2026-04-15: actual ~25%/21%/22%/25%)
        // Milestone 2 target: 40% — focus on hooks (React Query) and lib/utils
        statements: 20,
        branches: 20,
        functions: 20,
        lines: 20,
      },
    },
  },
})
