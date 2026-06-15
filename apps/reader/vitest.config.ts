import { defineConfig } from 'vitest/config';

const pkg = (name: string): string =>
  `/Users/hassoncs/src/ch5/story-gen/packages/storygen-${name}/src/index.ts`;

export default defineConfig({
  // Use esbuild's automatic JSX runtime for .tsx instead of @vitejs/plugin-react.
  // Registering the React plugin here triggers a Plugin type clash between the
  // repo's vite@6 and the vite that vitest nests, so we transform JSX directly.
  esbuild: {
    jsx: 'automatic',
    include: [/\.tsx?$/],
  },
  resolve: {
    alias: {
      '@ch5me/storygen-schema': pkg('schema'),
      '@ch5me/storygen-compiler': pkg('compiler'),
      '@ch5me/storygen-player': pkg('player'),
    },
    preserveSymlinks: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
