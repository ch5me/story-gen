import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const PACKAGES_DIR = '/Users/hassoncs/src/ch5/story-gen/packages';

/**
 * Map each '@ch5me/storygen-<name>' import to the package SOURCE entrypoint so
 * dev/build/test all consume TypeScript source directly — no prebuilt dist
 * required. Keeping the alias list explicit (rather than a glob) makes a missing
 * or renamed package fail loudly at resolve time.
 */
interface AliasEntry {
  find: string | RegExp;
  replacement: string;
}

const storygenAlias = (name: string): AliasEntry => ({
  find: `@ch5me/storygen-${name}`,
  replacement: `${PACKAGES_DIR}/storygen-${name}/src/index.ts`,
});

export const storygenAliases: AliasEntry[] = [
  storygenAlias('schema'),
  storygenAlias('compiler'),
  storygenAlias('continuity'),
  storygenAlias('prompt-compiler'),
  storygenAlias('player'),
];

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: storygenAliases,
    preserveSymlinks: true,
  },
  server: {
    port: 45180,
    host: '127.0.0.1',
  },
});
