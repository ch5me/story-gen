import type {
  Character,
  Location,
  Outfit,
  PanelCueBeat,
  Project,
  Scene,
  Story,
  Beat,
} from '@ch5me/storygen-schema';

/** Thrown when a referenced canon precondition is missing. Fail fast, fail loud. */
export class PromptCompileError extends Error {
  override readonly name = 'PromptCompileError';
  constructor(message: string) {
    super(message);
  }
}

/** Sensible negative-prompt defaults applied to every image prompt. */
export const DEFAULT_NEGATIVE_PROMPT = 'deformed, extra fingers, watermark, text';

export interface CompiledPrompt {
  prompt: string;
  negativePrompt: string;
  /** Locked appearance fields, formatted as `field=value`. */
  preserve: string[];
}

export interface PanelPromptArgs {
  /** Optional story id; defaults to the project's start story. */
  storyId?: string;
  sceneId: string;
  beatId: string;
}

function allScenes(story: Story): Scene[] {
  return story.chapters.flatMap((chapter) => chapter.scenes);
}

function findStory(project: Project, storyId: string | undefined): Story {
  const id = storyId ?? project.startStoryId;
  const story = project.stories.find((candidate) => candidate.id === id);
  if (!story) {
    throw new PromptCompileError(`Story not found: ${id}`);
  }
  return story;
}

function findScene(story: Story, sceneId: string): Scene {
  const scene = allScenes(story).find((candidate) => candidate.id === sceneId);
  if (!scene) {
    throw new PromptCompileError(`Scene not found in story ${story.id}: ${sceneId}`);
  }
  return scene;
}

function findBeat(scene: Scene, beatId: string): Beat {
  const beat = scene.beats.find((candidate) => candidate.id === beatId);
  if (!beat) {
    throw new PromptCompileError(`Beat not found in scene ${scene.id}: ${beatId}`);
  }
  return beat;
}

function findCharacter(project: Project, characterId: string): Character {
  const character = project.world.characters.find((candidate) => candidate.id === characterId);
  if (!character) {
    throw new PromptCompileError(`Character not found: ${characterId}`);
  }
  return character;
}

function findLocation(project: Project, locationId: string): Location {
  const location = project.world.locations.find((candidate) => candidate.id === locationId);
  if (!location) {
    throw new PromptCompileError(`Location not found: ${locationId}`);
  }
  return location;
}

/** The character's current/default outfit (first declared), if any. */
function currentOutfit(character: Character): Outfit | undefined {
  return character.outfits[0];
}

/** Locked appearance fields as `field=value`, in declared order. */
function lockedFields(character: Character): string[] {
  return character.appearanceLocks
    .filter((lock) => lock.locked)
    .map((lock) => `${lock.field}=${lock.value}`);
}

function negativePromptFor(characters: Character[]): string {
  const forbidden = characters.flatMap((character) => character.forbiddenChanges);
  const deduped = [...new Set(forbidden)];
  return [...deduped, DEFAULT_NEGATIVE_PROMPT].join(', ');
}

/** Render one character's canon into prompt fragments. */
function characterFragments(character: Character): string[] {
  const fragments: string[] = [character.name];
  if (character.appearance) {
    fragments.push(character.appearance);
  }
  const outfit = currentOutfit(character);
  if (outfit) {
    const outfitText = outfit.description
      ? `wearing ${outfit.name} (${outfit.description})`
      : `wearing ${outfit.name}`;
    fragments.push(outfitText);
  }
  return fragments;
}

function preserveSection(preserve: string[]): string | undefined {
  if (preserve.length === 0) return undefined;
  return `PRESERVE (do not change): ${preserve.join(', ')}`;
}

/**
 * Find the beat to render. If the requested beat is a panel_cue, use it
 * directly; otherwise prefer a character-bearing beat (dialogue / panel_cue) at
 * the requested id, failing fast if the beat carries no character context.
 */
function resolvePanelContext(
  project: Project,
  scene: Scene,
  beat: Beat,
): { panelDescription: string; characters: Character[]; location: Location | undefined } {
  if (beat.kind === 'panel_cue') {
    return resolvePanelCue(project, scene, beat);
  }
  if (beat.kind === 'dialogue') {
    const character = findCharacter(project, beat.characterId);
    const location = scene.locationId ? findLocation(project, scene.locationId) : undefined;
    return { panelDescription: beat.text, characters: [character], location };
  }
  throw new PromptCompileError(
    `Beat ${beat.id} (kind=${beat.kind}) carries no character/panel context to compile a panel prompt`,
  );
}

function resolvePanelCue(
  project: Project,
  scene: Scene,
  beat: PanelCueBeat,
): { panelDescription: string; characters: Character[]; location: Location | undefined } {
  const characterIds = beat.characterIds ?? [];
  const characters = characterIds.map((id) => findCharacter(project, id));
  const locationId = beat.locationId ?? scene.locationId;
  const location = locationId ? findLocation(project, locationId) : undefined;
  return { panelDescription: beat.description, characters, location };
}

/**
 * Compile an image prompt for a single panel beat. Assembles each involved
 * character's name/appearance/current outfit, the location, and the panel cue
 * description; emits a PRESERVE section for any locked appearance fields and
 * returns those fields in `preserve`.
 */
export function compilePanelPrompt(project: Project, args: PanelPromptArgs): CompiledPrompt {
  const story = findStory(project, args.storyId);
  const scene = findScene(story, args.sceneId);
  const beat = findBeat(scene, args.beatId);
  const { panelDescription, characters, location } = resolvePanelContext(project, scene, beat);

  const sections: string[] = [];
  for (const character of characters) {
    sections.push(characterFragments(character).join(', '));
  }
  if (location) {
    const locationText = location.description
      ? `${location.name}: ${location.description}`
      : location.name;
    sections.push(`Location: ${locationText}`);
  }
  sections.push(panelDescription);

  const preserve = [...new Set(characters.flatMap(lockedFields))];
  const preserveText = preserveSection(preserve);
  if (preserveText) {
    sections.push(preserveText);
  }

  return {
    prompt: sections.join('\n'),
    negativePrompt: negativePromptFor(characters),
    preserve,
  };
}

/**
 * Compile a reference/turnaround prompt for a single character (no scene
 * context). Includes name, appearance, current outfit, available expressions,
 * and a PRESERVE section for locked appearance fields.
 */
export function compileCharacterPrompt(project: Project, characterId: string): CompiledPrompt {
  const character = findCharacter(project, characterId);

  const sections: string[] = [characterFragments(character).join(', ')];
  if (character.role) {
    sections.push(`Role: ${character.role}`);
  }
  if (character.expressions.length > 0) {
    sections.push(`Expressions: ${character.expressions.join(', ')}`);
  }

  const preserve = lockedFields(character);
  const preserveText = preserveSection(preserve);
  if (preserveText) {
    sections.push(preserveText);
  }

  return {
    prompt: sections.join('\n'),
    negativePrompt: negativePromptFor([character]),
    preserve,
  };
}
