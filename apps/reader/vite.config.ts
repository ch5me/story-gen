import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pkg = (name: string): string =>
  `/Users/hassoncs/src/ch5/story-gen/packages/storygen-${name}/src/index.ts`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 45181,
    host: '127.0.0.1',
  },
  resolve: {
    alias: {
      '@ch5me/storygen-schema': pkg('schema'),
      '@ch5me/storygen-compiler': pkg('compiler'),
      '@ch5me/storygen-player': pkg('player'),
    },
    preserveSymlinks: true,
  },
});
