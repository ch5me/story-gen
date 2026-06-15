import { useMemo } from 'react';
import { Card, CardContent, ScrollArea } from '@ch5me/ch5-ui-web';
import { compileWebManifest } from '@ch5me/storygen-compiler';
import { StoryPlayer } from '@ch5me/storygen-player';
import type { Project } from '@ch5me/storygen-schema';

interface PreviewProps {
  project: Project;
}

/**
 * Preview: compile the current project client-side and play it instantly with
 * the shared StoryPlayer — an Inky-style playtest with no server round-trip.
 */
export function Preview({ project }: PreviewProps): React.ReactElement {
  const manifest = useMemo(() => compileWebManifest(project), [project]);

  return (
    <ScrollArea className="h-full" data-view="preview">
      <div className="flex items-start justify-center p-6">
        <div className="w-full max-w-xl">
          <header className="mb-3">
            <h1 className="text-lg font-semibold">Preview — {manifest.title}</h1>
            <p className="text-muted-foreground text-xs">
              Instant client-side playtest of the compiled manifest.
            </p>
          </header>
          <Card data-region="player">
            <CardContent>
              <StoryPlayer manifest={manifest} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}
