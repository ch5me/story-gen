import type { Meta, StoryObj } from '@storybook/react';
import { compileWebManifest } from '@ch5me/storygen-compiler';
import { sampleProject } from '@ch5me/storygen-schema';
// The standalone reader app's reading-surface, reused verbatim so Storybook shows
// the real reader (not a re-implementation). The reader is its own app
// (apps/reader); it wraps the shared @ch5me/storygen-player runtime.
import { App as ReaderApp } from '../../../reader/src/App';

const meta = {
  title: 'StoryGen/Reader',
  component: ReaderApp,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ReaderApp>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Default: the reader compiles the bundled sample project and plays it. */
export const Default: Story = {};

/** Same surface, driven by an explicitly-compiled manifest. */
export const FromCompiledManifest: Story = {
  args: { manifest: compileWebManifest(sampleProject) },
};
