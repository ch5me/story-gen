import { useState } from 'react';
import type {
  Beat,
  Character,
  DialogueBeat,
  NarrationBeat,
  Project,
  Scene,
} from '@ch5me/storygen-schema';
import {
  plotLinksForScene,
  primaryStory,
  replaceBeat,
  scenesOf,
} from '../project-selectors';

interface SceneEditorProps {
  project: Project;
  onChange: (next: Project) => void;
}

/**
 * Scene Editor: pick a scene, edit its beats. Narration/dialogue text are
 * controlled inputs; dialogue beats get character/expression/outfit selects. A
 * plot-grid strip shows the threads linked to the current scene.
 */
export function SceneEditor({ project, onChange }: SceneEditorProps): React.ReactElement {
  const story = primaryStory(project);
  const scenes = scenesOf(story);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    scenes[0]?.id ?? story.startSceneId,
  );
  const scene = scenes.find((s) => s.id === selectedSceneId) ?? scenes[0];

  if (!scene) {
    return <div className="p-4 text-slate-400">This story has no scenes.</div>;
  }

  return (
    <div className="flex h-full" data-view="scene-editor">
      <nav className="w-52 shrink-0 overflow-y-auto border-r border-slate-800 p-2">
        <h2 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Scenes
        </h2>
        <ul className="space-y-0.5">
          {scenes.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelectedSceneId(s.id)}
                aria-pressed={s.id === scene.id}
                className={`w-full rounded px-2 py-1 text-left text-sm ${
                  s.id === scene.id
                    ? 'bg-sky-600/30 text-sky-200'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        <header className="mb-3">
          <h1 className="text-lg font-semibold text-slate-100">{scene.title}</h1>
          {scene.summary ? <p className="text-sm text-slate-400">{scene.summary}</p> : null}
        </header>

        <PlotGridStrip project={project} sceneId={scene.id} />

        <ol className="mt-4 space-y-3">
          {scene.beats.map((beat) => (
            <li key={beat.id}>
              <BeatEditor
                beat={beat}
                scene={scene}
                characters={project.world.characters}
                onBeatChange={(next) => onChange(replaceBeat(project, beat.id, next))}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function PlotGridStrip({
  project,
  sceneId,
}: {
  project: Project;
  sceneId: string;
}): React.ReactElement {
  const story = primaryStory(project);
  const links = plotLinksForScene(story, sceneId);
  const threadsById = new Map(project.world.plotThreads.map((thread) => [thread.id, thread]));

  return (
    <section
      className="rounded border border-slate-800 bg-slate-900/60 p-2"
      data-region="plot-grid"
      aria-label="Plot threads linked to this scene"
    >
      <h3 className="pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Plot threads
      </h3>
      {links.length === 0 ? (
        <p className="text-xs text-slate-500">No plot threads linked.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {links.map((link) => {
            const thread = threadsById.get(link.plotThreadId);
            return (
              <span
                key={link.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-200"
                data-plot-thread={link.plotThreadId}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: thread?.color ?? '#64748b' }}
                />
                {thread?.name ?? link.plotThreadId}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface BeatEditorProps {
  beat: Beat;
  scene: Scene;
  characters: Character[];
  onBeatChange: (next: Beat) => void;
}

function BeatEditor({ beat, characters, onBeatChange }: BeatEditorProps): React.ReactElement {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/40 p-3" data-beat-id={beat.id}>
      <div className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
        <span className="rounded bg-slate-800 px-1.5 py-0.5">{beat.kind}</span>
        <span>{beat.id}</span>
      </div>
      {beat.kind === 'narration' ? (
        <NarrationFields beat={beat} onBeatChange={onBeatChange} />
      ) : beat.kind === 'dialogue' ? (
        <DialogueFields beat={beat} characters={characters} onBeatChange={onBeatChange} />
      ) : (
        <ReadOnlyBeat beat={beat} />
      )}
    </div>
  );
}

function NarrationFields({
  beat,
  onBeatChange,
}: {
  beat: NarrationBeat;
  onBeatChange: (next: Beat) => void;
}): React.ReactElement {
  const id = `narration-${beat.id}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs text-slate-400">
        Narration
      </label>
      <textarea
        id={id}
        value={beat.text}
        onChange={(event) => onBeatChange({ ...beat, text: event.target.value })}
        className="w-full resize-y rounded border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100"
        rows={2}
      />
    </div>
  );
}

function DialogueFields({
  beat,
  characters,
  onBeatChange,
}: {
  beat: DialogueBeat;
  characters: Character[];
  onBeatChange: (next: Beat) => void;
}): React.ReactElement {
  const character = characters.find((c) => c.id === beat.characterId);
  const textId = `dialogue-text-${beat.id}`;
  const charId = `dialogue-char-${beat.id}`;
  const exprId = `dialogue-expr-${beat.id}`;
  const outfitId = `dialogue-outfit-${beat.id}`;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor={charId} className="mb-1 block text-xs text-slate-400">
            Character
          </label>
          <select
            id={charId}
            value={beat.characterId}
            onChange={(event) => onBeatChange({ ...beat, characterId: event.target.value })}
            className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-sm text-slate-100"
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={exprId} className="mb-1 block text-xs text-slate-400">
            Expression
          </label>
          <select
            id={exprId}
            value={beat.expression ?? ''}
            onChange={(event) =>
              onBeatChange({
                ...beat,
                expression: event.target.value === '' ? undefined : event.target.value,
              })
            }
            className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-sm text-slate-100"
          >
            <option value="">(none)</option>
            {(character?.expressions ?? []).map((expr) => (
              <option key={expr} value={expr}>
                {expr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={outfitId} className="mb-1 block text-xs text-slate-400">
            Outfit
          </label>
          <select
            id={outfitId}
            value={beat.outfitId ?? ''}
            onChange={(event) =>
              onBeatChange({
                ...beat,
                outfitId: event.target.value === '' ? undefined : event.target.value,
              })
            }
            className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-sm text-slate-100"
          >
            <option value="">(none)</option>
            {(character?.outfits ?? []).map((outfit) => (
              <option key={outfit.id} value={outfit.id}>
                {outfit.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={textId} className="mb-1 block text-xs text-slate-400">
          Line
        </label>
        <textarea
          id={textId}
          value={beat.text}
          onChange={(event) => onBeatChange({ ...beat, text: event.target.value })}
          className="w-full resize-y rounded border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100"
          rows={2}
        />
      </div>
    </div>
  );
}

function ReadOnlyBeat({ beat }: { beat: Beat }): React.ReactElement {
  const summary = beatSummary(beat);
  return <p className="text-sm text-slate-300">{summary}</p>;
}

function beatSummary(beat: Beat): string {
  switch (beat.kind) {
    case 'choice':
      return `Choice: ${beat.options.map((option) => option.label).join(' / ')}`;
    case 'state_change':
      return `Set ${Object.entries(beat.set)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(', ')}`;
    case 'stage':
      return `Stage${beat.present ? ` — present: ${beat.present.join(', ')}` : ''}`;
    case 'panel_cue':
      return `Panel: ${beat.description}`;
    case 'asset_event':
      return `Asset ${beat.event}: ${beat.assetId}`;
    case 'jump':
      return `Jump → ${beat.target}`;
    case 'branch':
      return `Branch (${beat.branches.length} condition${beat.branches.length === 1 ? '' : 's'})`;
    default:
      return beat.kind;
  }
}
