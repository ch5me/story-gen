import {
  WebManifestSchema,
  type Project,
  type Scene,
  type Beat,
  type RuntimeBeat,
  type RuntimeChoiceOption,
  type CompiledNode,
  type WebManifest,
  type AssetManifestEntry,
  type Character,
  type VariableValue,
} from '@ch5me/storygen-schema';
import {
  selectStory,
  gatherScenes,
  indexCharacters,
  requireCharacterName,
  type CompileOptions,
} from './internal/story-selection';

/**
 * Map a single canonical beat to its v1 runtime equivalent, or `null` when the
 * beat kind is not part of the web runtime subset.
 *
 * The web runtime renders only `narration | dialogue | choice | set | jump`.
 * The `stage`, `panel_cue`, `asset_event`, and `branch` beats stay in the
 * canonical model (they drive comic panels, asset channels, and authoring-time
 * branching) but are intentionally skipped here — the web reader has no surface
 * for them, so dropping them is correct, not a silent data loss.
 */
function mapBeat(beat: Beat, characters: Map<string, Character>): RuntimeBeat | null {
  switch (beat.kind) {
    case 'narration':
      return {
        id: beat.id,
        kind: 'narration',
        text: beat.text,
        ...(beat.assetId === undefined ? {} : { assetId: beat.assetId }),
      };
    case 'dialogue':
      return {
        id: beat.id,
        kind: 'dialogue',
        speaker: requireCharacterName(characters, beat.characterId, beat.id),
        characterId: beat.characterId,
        text: beat.text,
        ...(beat.expression === undefined ? {} : { expression: beat.expression }),
        ...(beat.assetId === undefined ? {} : { assetId: beat.assetId }),
      };
    case 'choice': {
      const options: RuntimeChoiceOption[] = beat.options.map((option) => ({
        id: option.id,
        label: option.label,
        target: option.target,
        ...(option.setFlags === undefined ? {} : { setFlags: option.setFlags }),
      }));
      return {
        id: beat.id,
        kind: 'choice',
        ...(beat.prompt === undefined ? {} : { prompt: beat.prompt }),
        options,
      };
    }
    case 'state_change':
      return { id: beat.id, kind: 'set', set: beat.set };
    case 'jump':
      return { id: beat.id, kind: 'jump', target: beat.target };
    // Canonical-only beats with no v1 web runtime representation.
    case 'stage':
    case 'panel_cue':
    case 'asset_event':
    case 'branch':
      return null;
    default: {
      const exhaustive: never = beat;
      throw new Error(`compiler: unhandled beat kind: ${JSON.stringify(exhaustive)}`);
    }
  }
}

function compileScene(scene: Scene, characters: Map<string, Character>): CompiledNode {
  const beats: RuntimeBeat[] = [];
  for (const beat of scene.beats) {
    const mapped = mapBeat(beat, characters);
    if (mapped !== null) {
      beats.push(mapped);
    }
  }
  return {
    id: scene.id,
    title: scene.title,
    beats,
    next: scene.next ?? null,
  };
}

/**
 * Compile the canonical project into a player-ready {@link WebManifest}. The
 * output is validated against {@link WebManifestSchema} before returning, so a
 * malformed manifest fails loud at the compiler boundary.
 */
export function compileWebManifest(project: Project, opts?: CompileOptions): WebManifest {
  const story = selectStory(project, opts);
  const characters = indexCharacters(project);
  const scenes = gatherScenes(story);

  const nodes: Record<string, CompiledNode> = {};
  for (const scene of scenes) {
    nodes[scene.id] = compileScene(scene, characters);
  }

  const variables: Record<string, VariableValue> = {};
  for (const variable of project.variables) {
    variables[variable.key] = variable.initial;
  }

  const assets: AssetManifestEntry[] = project.world.assets.map((asset) => ({
    id: asset.id,
    kind: asset.kind,
    ...(asset.url === undefined ? {} : { url: asset.url }),
    status: asset.status,
  }));

  const manifest: WebManifest = {
    version: 1,
    projectId: project.id,
    title: story.title,
    startNodeId: story.startSceneId,
    variables,
    nodes,
    assets,
  };

  return WebManifestSchema.parse(manifest);
}
