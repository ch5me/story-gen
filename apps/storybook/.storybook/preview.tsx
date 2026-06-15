import type { Preview, Decorator } from '@storybook/react';
import '../src/theme.css';

// Apply CH5 dark theme to document body before each story renders.
// Theme is a DOM attribute — no React ThemeProvider per CH5 design system convention.
document.body.setAttribute('data-ch5-theme', 'dark');

const withTheme: Decorator = (Story) => {
  document.body.setAttribute('data-ch5-theme', 'dark');
  return <Story />;
};

const preview: Preview = {
  decorators: [withTheme],
  parameters: {
    backgrounds: { disable: true },
    layout: 'centered',
  },
};

export default preview;
