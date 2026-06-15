import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  NativeSelect,
  NativeSelectOption,
  ScrollArea,
  Textarea,
  cn,
} from '@ch5me/ch5-ui-web';
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
    return <div className="text-muted-foreground p-4">This story has no scenes.</div>;
  }

  return (
    <div className="flex h-full" data-view="scene-editor">
      <nav className="w-52 shrink-0 border-r" aria-label="Scenes">
        <ScrollArea className="h-full">
          <div className="p-2">
            <h2 className="text-muted-foreground px-2 pb-2 text-xs font-semibold uppercase tracking-wide">
              Scenes
            </h2>
            <ul className="flex flex-col gap-0.5">
              {scenes.map((s) => {
                const active = s.id === scene.id;
                return (
                  <li key={s.id}>
                    <Button
                      type="button"
                      variant={active ? 'secondary' : 'ghost'}
                      size="sm"
                      aria-pressed={active}
                      onClick={() => setSelectedSceneId(s.id)}
                      className={cn('w-full justify-start', active && 'font-medium')}
                    >
                      {s.title}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        </ScrollArea>
      </nav>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <header className="mb-3">
            <h1 className="text-lg font-semibold">{scene.title}</h1>
            {scene.summary ? <p className="text-muted-foreground text-sm">{scene.summary}</p> : null}
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
      </ScrollArea>
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
    <Card data-region="plot-grid" aria-label="Plot threads linked to this scene">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          Plot threads
        </CardTitle>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-muted-foreground text-xs">No plot threads linked.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {links.map((link) => {
              const thread = threadsById.get(link.plotThreadId);
              return (
                <Badge
                  key={link.id}
                  variant="outline"
                  className="gap-1.5"
                  data-plot-thread={link.plotThreadId}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: thread?.color ?? 'var(--ff-subtle)' }}
                  />
                  {thread?.name ?? link.plotThreadId}
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
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
    <Card data-beat-id={beat.id}>
      <CardHeader>
        <div className="text-muted-foreground flex items-center gap-2 text-[11px] uppercase tracking-wide">
          <Badge variant="secondary">{beat.kind}</Badge>
          <span>{beat.id}</span>
        </div>
      </CardHeader>
      <CardContent>
        {beat.kind === 'narration' ? (
          <NarrationFields beat={beat} onBeatChange={onBeatChange} />
        ) : beat.kind === 'dialogue' ? (
          <DialogueFields beat={beat} characters={characters} onBeatChange={onBeatChange} />
        ) : (
          <ReadOnlyBeat beat={beat} />
        )}
      </CardContent>
    </Card>
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
      <Label htmlFor={id} className="text-muted-foreground mb-1 text-xs">
        Narration
      </Label>
      <Textarea
        id={id}
        value={beat.text}
        onChange={(event) => onBeatChange({ ...beat, text: event.target.value })}
        rows={2}
        className="resize-y"
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
          <Label htmlFor={charId} className="text-muted-foreground mb-1 text-xs">
            Character
          </Label>
          <NativeSelect
            id={charId}
            size="sm"
            className="w-full"
            value={beat.characterId}
            onChange={(event) => onBeatChange({ ...beat, characterId: event.target.value })}
          >
            {characters.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label htmlFor={exprId} className="text-muted-foreground mb-1 text-xs">
            Expression
          </Label>
          <NativeSelect
            id={exprId}
            size="sm"
            className="w-full"
            value={beat.expression ?? ''}
            onChange={(event) =>
              onBeatChange({
                ...beat,
                expression: event.target.value === '' ? undefined : event.target.value,
              })
            }
          >
            <NativeSelectOption value="">(none)</NativeSelectOption>
            {(character?.expressions ?? []).map((expr) => (
              <NativeSelectOption key={expr} value={expr}>
                {expr}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label htmlFor={outfitId} className="text-muted-foreground mb-1 text-xs">
            Outfit
          </Label>
          <NativeSelect
            id={outfitId}
            size="sm"
            className="w-full"
            value={beat.outfitId ?? ''}
            onChange={(event) =>
              onBeatChange({
                ...beat,
                outfitId: event.target.value === '' ? undefined : event.target.value,
              })
            }
          >
            <NativeSelectOption value="">(none)</NativeSelectOption>
            {(character?.outfits ?? []).map((outfit) => (
              <NativeSelectOption key={outfit.id} value={outfit.id}>
                {outfit.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div>
        <Label htmlFor={textId} className="text-muted-foreground mb-1 text-xs">
          Line
        </Label>
        <Textarea
          id={textId}
          value={beat.text}
          onChange={(event) => onBeatChange({ ...beat, text: event.target.value })}
          rows={2}
          className="resize-y"
        />
      </div>
    </div>
  );
}

function ReadOnlyBeat({ beat }: { beat: Beat }): React.ReactElement {
  const summary = beatSummary(beat);
  return <p className="text-foreground/80 text-sm">{summary}</p>;
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
