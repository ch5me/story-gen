import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';
import type { UserConfig } from 'vite';

const PACKAGES_DIR = '/Users/hassoncs/src/ch5/story-gen/packages';

const storygenAlias = (name: string): { find: string; replacement: string } => ({
  find: `@ch5me/storygen-${name}`,
  replacement: `${PACKAGES_DIR}/storygen-${name}/src/index.ts`,
});

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  viteFinal: async (viteConfig): Promise<UserConfig> => {
    const existingAlias = Array.isArray(viteConfig.resolve?.alias)
      ? viteConfig.resolve.alias
      : [];

    return {
      ...viteConfig,
      plugins: [tailwindcss(), ...(viteConfig.plugins ?? [])],
      resolve: {
        ...viteConfig.resolve,
        preserveSymlinks: true,
        alias: [
          storygenAlias('schema'),
          storygenAlias('compiler'),
          storygenAlias('continuity'),
          storygenAlias('prompt-compiler'),
          storygenAlias('player'),
          ...existingAlias,
        ],
      },
    };
  },
};

export default config;
