import type { Project, Story, Scene, Character } from '@ch5me/storygen-schema';

export interface CompileOptions {
  /** Which story to compile; defaults to the project's startStoryId. */
  storyId?: string;
}

/**
 * Resolve the target story. Fail fast (typed Error) when the requested or
 * default story id is not present — never silently pick a different story.
 */
export function selectStory(project: Project, opts?: CompileOptions): Story {
  const storyId = opts?.storyId ?? project.startStoryId;
  const story = project.stories.find((s) => s.id === storyId);
  if (!story) {
    throw new Error(
      `compiler: story "${storyId}" not found in project "${project.id}". ` +
        `Available stories: ${project.stories.map((s) => s.id).join(', ') || '(none)'}.`,
    );
  }
  return story;
}

/**
 * Gather every scene across the story's chapters in a stable, deterministic
 * order (chapter order, then scene order as authored).
 */
export function gatherScenes(story: Story): Scene[] {
  const scenes: Scene[] = [];
  for (const chapter of story.chapters) {
    for (const scene of chapter.scenes) {
      scenes.push(scene);
    }
  }
  return scenes;
}

/** Index world characters by id for fast, fail-fast lookup. */
export function indexCharacters(project: Project): Map<string, Character> {
  const byId = new Map<string, Character>();
  for (const character of project.world.characters) {
    byId.set(character.id, character);
  }
  return byId;
}

/**
 * Resolve a character name by id. Throws a typed Error naming the missing
 * character so dangling dialogue references fail loud rather than rendering an
 * empty speaker.
 */
export function requireCharacterName(
  characters: Map<string, Character>,
  characterId: string,
  beatId: string,
): string {
  const character = characters.get(characterId);
  if (!character) {
    throw new Error(
      `compiler: dialogue beat "${beatId}" references unknown character "${characterId}". ` +
        `Add the character to project.world.characters or fix the reference.`,
    );
  }
  return character.name;
}
