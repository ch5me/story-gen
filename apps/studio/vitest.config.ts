import { defineConfig } from 'vitest/config';
import { storygenAliases } from './vite.config';

/**
 * Vitest is kept separate from the Vite app config so the React app config can
 * pin `vite@6` (and its `@vitejs/plugin-react` plugin type) while Vitest runs on
 * its own bundled Vite. We do NOT register the React plugin here: esbuild's
 * automatic JSX runtime (below) transforms `.tsx` for tests, and the package
 * source aliases are shared from `vite.config.ts` so both surfaces resolve
 * imports identically.
 */
export default defineConfig({
  resolve: {
    alias: storygenAliases,
    preserveSymlinks: true,
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
