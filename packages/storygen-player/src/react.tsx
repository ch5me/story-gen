import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import type { VariableValue, WebManifest } from '@ch5me/storygen-schema';
import { createPlayer } from './runtime';
import type { Player, PlayerPosition } from './runtime';

/**
 * Thin React bindings over the headless {@link createPlayer} runtime. The JSX
 * here compiles through `react/jsx-runtime` (jsx: react-jsx); we never import the
 * React namespace just to satisfy the transform.
 */

export interface UsePlayer {
  position: PlayerPosition;
  flags: Record<string, VariableValue>;
  isEnded: boolean;
  advance(): void;
  choose(optionId: string): void;
  player: Player;
}

/**
 * Hook wrapping the headless runtime. The player instance is memoized per
 * manifest; mutating calls bump a render tick so consumers re-read `current()`.
 */
export function usePlayer(manifest: WebManifest): UsePlayer {
  const player = useMemo(() => createPlayer(manifest), [manifest]);
  const [, setTick] = useState(0);
  const bump = (): void => setTick((tick) => tick + 1);

  return {
    position: player.current(),
    flags: player.flags(),
    isEnded: player.isEnded(),
    advance: () => {
      player.advance();
      bump();
    },
    choose: (optionId: string) => {
      player.choose(optionId);
      bump();
    },
    player,
  };
}

/**
 * The seam for alternative renderers. The default DOM renderer is
 * {@link StoryPlayer}. A PixiVN adapter (Pixi'VN visual-novel renderer) is
 * deferred to v2 — it will implement this same interface so the headless runtime
 * stays the single source of truth for walk semantics.
 */
export interface RenderAdapter {
  /** Render the current player position to the adapter's target surface. */
  render(props: StoryPlayerProps): ReactElement | null;
}

export interface StoryPlayerProps {
  manifest: WebManifest;
  /** Optional label for the advance affordance (default: "Continue"). */
  continueLabel?: string;
}

/**
 * Minimal, unstyled DOM renderer for a compiled story. Renders the current
 * presentation beat (narration/dialogue text, or a choice as buttons) plus a
 * continue affordance for narration/dialogue. Apps supply their own styling.
 */
export function StoryPlayer(props: StoryPlayerProps): ReactElement {
  const { manifest, continueLabel = 'Continue' } = props;
  const { position, isEnded, advance, choose } = usePlayer(manifest);
  const { beat } = position;

  if (isEnded || beat === null) {
    return <div data-storygen="end">The End.</div>;
  }

  if (beat.kind === 'choice') {
    return (
      <div data-storygen="choice">
        {beat.prompt !== undefined ? <p data-storygen="choice-prompt">{beat.prompt}</p> : null}
        <ul data-storygen="choice-options">
          {beat.options.map((option) => (
            <li key={option.id}>
              <button type="button" onClick={() => choose(option.id)}>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (beat.kind === 'dialogue') {
    return (
      <div data-storygen="dialogue">
        <p data-storygen="speaker">{beat.speaker}</p>
        <p data-storygen="text">{beat.text}</p>
        <button type="button" onClick={advance}>
          {continueLabel}
        </button>
      </div>
    );
  }

  return (
    <div data-storygen="narration">
      <p data-storygen="text">{beat.text}</p>
      <button type="button" onClick={advance}>
        {continueLabel}
      </button>
    </div>
  );
}
