import { useMemo } from 'react';
import type { ReactElement } from 'react';
import type { VariableValue, WebManifest } from '@ch5me/storygen-schema';
import { sampleProject } from '@ch5me/storygen-schema';
import { compileWebManifest } from '@ch5me/storygen-compiler';
import { usePlayer } from '@ch5me/storygen-player';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@ch5me/ch5-ui-web';
import { ArrowRight } from 'lucide-react';

/**
 * Runtime reader. With no manifest prop it compiles the bundled `sampleProject`
 * so the reader runs standalone; pass a `manifest` to play any compiled story.
 *
 * It drives the headless `usePlayer` runtime directly (rather than the packaged
 * `StoryPlayer`) so the reading surface owns its own CH5 styling and flag
 * display, rendered entirely with `@ch5me/ch5-ui-web` components and tokens.
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
    <TooltipProvider>
      <main className="flex min-h-dvh justify-center px-6 py-16">
        <Reader manifest={manifest} />
      </main>
    </TooltipProvider>
  );
}

function Reader(props: { manifest: WebManifest }): ReactElement {
  const { position, flags, isEnded, advance, choose } = usePlayer(props.manifest);
  const { beat } = position;

  return (
    <article className="flex w-full max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ff-text)]">
          {props.manifest.title}
        </h1>
        <Separator className="mt-4" />
      </header>

      <section aria-live="polite">
        <Card className="min-h-40">
          {isEnded || beat === null ? (
            <CardContent className="py-10">
              <p className="text-lg italic text-[var(--ff-muted-foreground)]" data-testid="story-end">
                The End.
              </p>
            </CardContent>
          ) : beat.kind === 'choice' ? (
            <>
              {beat.prompt !== undefined ? (
                <CardHeader>
                  <CardTitle
                    className="text-lg font-medium italic text-[var(--ff-text)]"
                    data-testid="choice-prompt"
                  >
                    {beat.prompt}
                  </CardTitle>
                </CardHeader>
              ) : null}
              <CardContent className="flex flex-col gap-2">
                {beat.options.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant="outline"
                    className="justify-start text-left"
                    onClick={() => choose(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </CardContent>
            </>
          ) : beat.kind === 'dialogue' ? (
            <>
              <CardHeader>
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ff-primary)]">
                  {beat.speaker}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <p className="text-lg leading-relaxed text-[var(--ff-text)]">{beat.text}</p>
                <ContinueButton onClick={advance} />
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col gap-6 py-8">
              <p className="text-lg leading-relaxed text-[var(--ff-text)]">{beat.text}</p>
              <ContinueButton onClick={advance} />
            </CardContent>
          )}
        </Card>
      </section>

      <FlagBar flags={flags} />
    </article>
  );
}

function ContinueButton(props: { onClick: () => void }): ReactElement {
  return (
    <Button type="button" variant="primary" className="self-start" onClick={props.onClick}>
      Continue
      <ArrowRight className="size-4" />
    </Button>
  );
}

function FlagBar(props: { flags: Record<string, VariableValue> }): ReactElement {
  const entries = Object.entries(props.flags);
  return (
    <footer className="flex flex-wrap items-center gap-2" data-testid="flags">
      {entries.length === 0 ? (
        <span className="text-xs text-[var(--ff-muted-foreground)]">no flags set</span>
      ) : (
        entries.map(([key, value]) => (
          <Tooltip key={key}>
            <TooltipTrigger
              render={
                <Badge variant="secondary" className="font-mono text-xs">
                  {key}: {String(value)}
                </Badge>
              }
            />
            <TooltipContent>Story flag</TooltipContent>
          </Tooltip>
        ))
      )}
    </footer>
  );
}
