import { useMemo } from 'react';
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
    <div className="flex h-full items-start justify-center overflow-y-auto p-6" data-view="preview">
      <div className="w-full max-w-xl">
        <header className="mb-3">
          <h1 className="text-lg font-semibold text-slate-100">Preview — {manifest.title}</h1>
          <p className="text-xs text-slate-500">
            Instant client-side playtest of the compiled manifest.
          </p>
        </header>
        <div
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-slate-100"
          data-region="player"
        >
          <StoryPlayer manifest={manifest} />
        </div>
      </div>
    </div>
  );
}
