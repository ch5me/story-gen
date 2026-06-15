import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

/**
 * Smoke test: render <App /> with no props so it compiles and plays the bundled
 * sampleProject. Walk the opening narration, take the "Walk over" choice, and
 * confirm the story progresses past the choice into scene_meet.
 */
describe('reader App (compiled sampleProject)', () => {
  it('opens on the rooftop narration, then plays through a choice', () => {
    render(<App />);

    // Opening narration is the first presentation beat.
    expect(
      screen.getByText('The rooftop bar glows against a bruise-blue sky.'),
    ).toBeInTheDocument();

    // Advance through narration/dialogue until the choice prompt appears.
    const choicePrompt = 'Approach the stranger by the bar?';
    advanceUntil(() => screen.queryByText(choicePrompt) !== null);

    expect(screen.getByText(choicePrompt)).toBeInTheDocument();

    // Pick the route that leads to Devin.
    fireEvent.click(screen.getByRole('button', { name: 'Walk over' }));

    // Story has progressed past the choice into scene_meet.
    expect(screen.getByText('You have good taste in rooftops.')).toBeInTheDocument();
    expect(screen.queryByText(choicePrompt)).not.toBeInTheDocument();

    // The chosen option set met_devin — flag surface reflects it.
    expect(screen.getByTestId('flags')).toHaveTextContent('met_devin: true');
  });
});

/** Click "Continue" until `predicate` holds, with a hard cap to avoid hangs. */
function advanceUntil(predicate: () => boolean): void {
  for (let step = 0; step < 25; step += 1) {
    if (predicate()) {
      return;
    }
    const continueButton = screen.queryByRole('button', { name: 'Continue' });
    if (!continueButton) {
      throw new Error('advanceUntil: no Continue button and predicate still false');
    }
    fireEvent.click(continueButton);
  }
  throw new Error('advanceUntil: predicate never became true within step cap');
}
