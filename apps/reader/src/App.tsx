import { useMemo } from 'react';
import type { ReactElement } from 'react';
import type { VariableValue, WebManifest } from '@ch5me/storygen-schema';
import { sampleProject } from '@ch5me/storygen-schema';
import { compileWebManifest } from '@ch5me/storygen-compiler';
import { usePlayer } from '@ch5me/storygen-player';

/**
 * Runtime reader. With no manifest prop it compiles the bundled `sampleProject`
 * so the reader runs standalone; pass a `manifest` to play any compiled story.
 *
 * It drives the headless `usePlayer` runtime directly (rather than the packaged
 * `StoryPlayer`) so the reading surface owns its own styling and flag display.
 */
export function App(props: { manifest?: WebManifest }): ReactElement {
  // Compile the sample only when no manifest is supplied. Memoized so the player
  // instance (keyed on manifest identity) stays stable across renders.
  const fallbackManifest = useMemo(
    () => (props.manifest ? null : compileWebManifest(sampleProject)),
    [props.manifest],
  );

  const manifest = props.manifest ?? fallbackManifest;
  if (!manifest) {
    // Unreachable: exactly one of prop/fallback is always defined. Fail loud.
    throw new Error('App: no manifest available — neither prop nor compiled sample resolved.');
  }

  return (
    <main className="reader">
      <Reader manifest={manifest} />
    </main>
  );
}

function Reader(props: { manifest: WebManifest }): ReactElement {
  const { position, flags, isEnded, advance, choose } = usePlayer(props.manifest);
  const { beat } = position;

  return (
    <article className="reader__column">
      <header className="reader__header">
        <h1 className="reader__title">{props.manifest.title}</h1>
      </header>

      <section className="reader__stage" aria-live="polite">
        {isEnded || beat === null ? (
          <p className="reader__end" data-testid="story-end">
            The End.
          </p>
        ) : beat.kind === 'choice' ? (
          <div className="reader__choice">
            {beat.prompt !== undefined ? (
              <p className="reader__prompt" data-testid="choice-prompt">
                {beat.prompt}
              </p>
            ) : null}
            <ul className="reader__options">
              {beat.options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    className="reader__option"
                    onClick={() => choose(option.id)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : beat.kind === 'dialogue' ? (
          <div className="reader__beat reader__beat--dialogue">
            <p className="reader__speaker">{beat.speaker}</p>
            <p className="reader__text">{beat.text}</p>
            <button type="button" className="reader__advance" onClick={advance}>
              Continue
            </button>
          </div>
        ) : (
          <div className="reader__beat reader__beat--narration">
            <p className="reader__text">{beat.text}</p>
            <button type="button" className="reader__advance" onClick={advance}>
              Continue
            </button>
          </div>
        )}
      </section>

      <FlagBar flags={flags} />
    </article>
  );
}

function FlagBar(props: { flags: Record<string, VariableValue> }): ReactElement {
  const entries = Object.entries(props.flags);
  return (
    <footer className="reader__flags" data-testid="flags">
      {entries.length === 0 ? (
        <span className="reader__flag reader__flag--empty">no flags set</span>
      ) : (
        entries.map(([key, value]) => (
          <span key={key} className="reader__flag">
            {key}: {String(value)}
          </span>
        ))
      )}
    </footer>
  );
}
