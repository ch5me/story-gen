import type { Meta, StoryObj } from '@storybook/react';
import { compileWebManifest } from '@ch5me/storygen-compiler';
import { sampleProject } from '@ch5me/storygen-schema';
import { StoryPlayer } from '@ch5me/storygen-player';

// Compile once at module load — deterministic for a given sampleProject.
const manifest = compileWebManifest(sampleProject);

const meta: Meta<typeof StoryPlayer> = {
  title: 'StoryGen/StoryPlayer',
  component: StoryPlayer,
  parameters: { layout: 'centered' },
  argTypes: {
    continueLabel: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof StoryPlayer>;

export const Default: Story = {
  args: {
    manifest,
    continueLabel: 'Continue',
  },
  render: (args) => (
    <div
      className="w-96 rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-lg"
      data-ch5-theme="dark"
    >
      <StoryPlayer {...args} />
    </div>
  ),
};

export const CustomContinueLabel: Story = {
  args: {
    manifest,
    continueLabel: '▶ Next',
  },
  render: (args) => (
    <div
      className="w-96 rounded-xl border border-[var(--ff-border)] bg-[var(--ff-surface)] p-6 shadow-lg"
      data-ch5-theme="dark"
    >
      <StoryPlayer {...args} />
    </div>
  ),
};
