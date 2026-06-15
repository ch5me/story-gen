import type {
  Asset,
  Beat,
  Project,
  Scene,
  ScenePlotLink,
  Story,
} from '@ch5me/storygen-schema';

/**
 * Pure read/transform helpers over a {@link Project}. Views import these instead
 * of re-walking the nested chapter/scene structure, keeping the data shape in
 * one place.
 */

/** The project's primary story (the one its `startStoryId` points at). */
export function primaryStory(project: Project): Story {
  const story = project.stories.find((s) => s.id === project.startStoryId);
  if (!story) {
    throw new Error(
      `project-selectors: startStoryId '${project.startStoryId}' has no matching story in '${project.id}'.`,
    );
  }
  return story;
}

/** Every scene of a story in document order (chapter, then scene). */
export function scenesOf(story: Story): Scene[] {
  return story.chapters.flatMap((chapter) => chapter.scenes);
}

/** Asset ids referenced by a beat (so views can flag missing-asset scenes). */
export function beatAssetIds(beat: Beat): string[] {
  switch (beat.kind) {
    case 'narration':
    case 'dialogue':
    case 'panel_cue':
      return beat.assetId ? [beat.assetId] : [];
    case 'asset_event':
      return [beat.assetId];
    default:
      return [];
  }
}

/** All asset ids a scene references across its beats. */
export function sceneAssetIds(scene: Scene): string[] {
  return scene.beats.flatMap(beatAssetIds);
}

/** Asset ids referenced by a scene that are absent from the world asset list. */
export function missingAssetIds(scene: Scene, assets: Asset[]): string[] {
  const known = new Set(assets.map((asset) => asset.id));
  return sceneAssetIds(scene).filter((id) => !known.has(id));
}

/** Plot links attached to a given scene id. */
export function plotLinksForScene(story: Story, sceneId: string): ScenePlotLink[] {
  return story.scenePlotLinks.filter((link) => link.sceneId === sceneId);
}

/** Scene/jump targets a beat routes to (for Story Map edges). */
export function beatTargets(beat: Beat): string[] {
  switch (beat.kind) {
    case 'choice':
      return beat.options.map((option) => option.target);
    case 'jump':
      return [beat.target];
    case 'branch':
      return [
        ...beat.branches.map((branch) => branch.target),
        ...(beat.fallback ? [beat.fallback] : []),
      ];
    default:
      return [];
  }
}

/**
 * Immutably replace one beat inside a project by id, returning a new Project.
 * Used by the Scene Editor's controlled inputs so edits flow back into App
 * state without mutation.
 */
export function replaceBeat(project: Project, beatId: string, next: Beat): Project {
  return {
    ...project,
    stories: project.stories.map((story) => ({
      ...story,
      chapters: story.chapters.map((chapter) => ({
        ...chapter,
        scenes: chapter.scenes.map((scene) => ({
          ...scene,
          beats: scene.beats.map((beat) => (beat.id === beatId ? next : beat)),
        })),
      })),
    })),
  };
}
