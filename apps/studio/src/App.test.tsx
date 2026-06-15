import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { sampleProject } from '@ch5me/storygen-schema';
import { App } from './App';

/**
 * Offline smoke test: the project is injected via props so no network is hit.
 * Walks the three load-bearing surfaces — Story Map, Scene Editor, Preview.
 */
describe('App', () => {
  it('renders the Story Map with a node per scene', () => {
    render(<App initialProject={sampleProject} />);

    const map = screen.getByTestId('story-map');
    expect(map).toBeInTheDocument();
    // The accessible scene index mirrors the graph's nodes (one per scene) and
    // is the stable surface to assert on regardless of canvas measurement.
    const sceneIndex = within(map).getByRole('list', { name: 'Scenes' });
    expect(within(sceneIndex).getByText('Arrival')).toBeInTheDocument();
    expect(within(sceneIndex).getByText('scene_arrival')).toBeInTheDocument();
  });

  it('shows a beat line in the Scene Editor', () => {
    render(<App initialProject={sampleProject} />);

    fireEvent.click(screen.getByRole('button', { name: 'Scene Editor' }));

    expect(screen.getByDisplayValue('Quite a view.')).toBeInTheDocument();
  });

  it('plays the first narration in Preview', async () => {
    render(<App initialProject={sampleProject} />);

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(
      await screen.findByText('The rooftop bar glows against a bruise-blue sky.'),
    ).toBeInTheDocument();
  });
});
