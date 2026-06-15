import type {
  Project,
  Story,
  Scene,
  Beat,
  Character,
} from '@ch5me/storygen-schema';

/**
 * The set of continuity rule identifiers the linter can emit.
 *
 * - MISSING_ROUTE_TARGET (error): a routing reference (choice target, jump
 *   target, scene.next, branch target, branch fallback) does not resolve to a
 *   scene that exists within the same story.
 * - WARDROBE_DRIFT (warning): a character's outfit changes between two dialogue
 *   beats without an intervening `stage` or `asset_event` beat to motivate it.
 * - APPEARANCE_LOCK_MISMATCH (error): a dialogue/panel_cue references an
 *   outfitId that is not part of that character's canonical outfit list.
 * - FACT_CONTRADICTION (error): two unconditional `state_change` beats on one
 *   linear (no choice/branch between them) path assign the same key two
 *   different constant values.
 * - PLOT_THREAD_ORPHAN (warning): a world plot thread has no ScenePlotLink
 *   (across all stories) referencing it.
 */
export type ContinuityCode =
  | 'MISSING_ROUTE_TARGET'
  | 'WARDROBE_DRIFT'
  | 'APPEARANCE_LOCK_MISMATCH'
  | 'FACT_CONTRADICTION'
  | 'PLOT_THREAD_ORPHAN';

/** A single finding produced by the continuity linter. */
export interface ContinuityIssue {
  severity: 'error' | 'warning';
  code: ContinuityCode;
  message: string;
  storyId?: string;
  sceneId?: string;
  beatId?: string;
  characterId?: string;
}

/**
 * Run the deterministic continuity linter over a project.
 *
 * Determinism: detectors iterate the project structure in document order and
 * never use randomness, so identical input yields identical output (including
 * issue ordering). Issues are grouped detector-by-detector, route checks first.
 *
 * @param project The canonical project to lint.
 * @param opts.storyId When provided, only that story is linted for the
 *   per-story detectors (route/wardrobe/appearance/fact). The plot-thread
 *   orphan detector is world-scoped and always considers every story so that
 *   restricting to one story cannot produce false orphans.
 */
export function checkContinuity(
  project: Project,
  opts?: { storyId?: string },
): ContinuityIssue[] {
  const stories = selectStories(project, opts?.storyId);
  const issues: ContinuityIssue[] = [];

  for (const story of stories) {
    issues.push(...checkMissingRouteTargets(story));
  }
  for (const story of stories) {
    issues.push(...checkAppearanceLockMismatch(project, story));
  }
  for (const story of stories) {
    issues.push(...checkWardrobeDrift(story));
  }
  for (const story of stories) {
    issues.push(...checkFactContradiction(story));
  }
  issues.push(...checkPlotThreadOrphans(project));

  return issues;
}

/**
 * Resolve the set of stories to lint. Fail fast (no silent fallback) when an
 * explicit storyId is requested but absent — a missing target is a caller bug,
 * not something to paper over with an empty result.
 */
function selectStories(project: Project, storyId?: string): Story[] {
  if (storyId === undefined) return project.stories;
  const story = project.stories.find((s) => s.id === storyId);
  if (!story) {
    throw new Error(
      `checkContinuity: requested storyId '${storyId}' not found in project '${project.id}'.`,
    );
  }
  return [story];
}

/** Flatten every scene of a story in document order (chapter, then scene). */
function scenesOf(story: Story): Scene[] {
  const scenes: Scene[] = [];
  for (const chapter of story.chapters) {
    for (const scene of chapter.scenes) {
      scenes.push(scene);
    }
  }
  return scenes;
}

// ---------------------------------------------------------------------------
// MISSING_ROUTE_TARGET (error)
// ---------------------------------------------------------------------------

/**
 * Every routing reference inside a story must resolve to a scene id that exists
 * within that same story. We check: choice option targets, jump targets,
 * branch targets, branch fallbacks, and each scene's `next` fall-through.
 */
function checkMissingRouteTargets(story: Story): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];
  const sceneIds = new Set(scenesOf(story).map((scene) => scene.id));

  const report = (
    target: string,
    sceneId: string,
    beatId: string | undefined,
    label: string,
  ): void => {
    if (sceneIds.has(target)) return;
    issues.push({
      severity: 'error',
      code: 'MISSING_ROUTE_TARGET',
      message: `${label} references scene '${target}', which does not exist in story '${story.id}'.`,
      storyId: story.id,
      sceneId,
      ...(beatId ? { beatId } : {}),
    });
  };

  for (const scene of scenesOf(story)) {
    for (const beat of scene.beats) {
      switch (beat.kind) {
        case 'choice':
          for (const option of beat.options) {
            report(option.target, scene.id, beat.id, `Choice option '${option.id}'`);
          }
          break;
        case 'jump':
          report(beat.target, scene.id, beat.id, `Jump beat`);
          break;
        case 'branch':
          for (const branch of beat.branches) {
            report(branch.target, scene.id, beat.id, `Branch target`);
          }
          if (beat.fallback !== undefined) {
            report(beat.fallback, scene.id, beat.id, `Branch fallback`);
          }
          break;
        default:
          break;
      }
    }
    if (scene.next !== undefined) {
      report(scene.next, scene.id, undefined, `Scene '${scene.id}' next`);
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// APPEARANCE_LOCK_MISMATCH (error)
// ---------------------------------------------------------------------------

/**
 * A dialogue or panel_cue may name a characterId + outfitId. The referenced
 * outfitId must belong to that character's canonical `outfits`. An outfitId
 * that is not in the character's canon is the minimum-required error.
 *
 * Note on appearanceLocks: locks constrain free-text appearance fields
 * (e.g. hair_color) that no beat field directly carries in the v1 beat union,
 * so there is nothing in a beat to contradict a lock today; only the
 * outfit-not-in-canon rule is enforceable and is implemented here.
 */
function checkAppearanceLockMismatch(
  project: Project,
  story: Story,
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];
  const charById = indexCharacters(project);

  const reportOutfit = (
    characterId: string,
    outfitId: string,
    sceneId: string,
    beatId: string,
  ): void => {
    const character = charById.get(characterId);
    if (!character) {
      issues.push({
        severity: 'error',
        code: 'APPEARANCE_LOCK_MISMATCH',
        message: `Beat references unknown characterId '${characterId}'.`,
        storyId: story.id,
        sceneId,
        beatId,
        characterId,
      });
      return;
    }
    const known = character.outfits.some((outfit) => outfit.id === outfitId);
    if (known) return;
    issues.push({
      severity: 'error',
      code: 'APPEARANCE_LOCK_MISMATCH',
      message: `Outfit '${outfitId}' is not in the canon outfits of character '${characterId}'.`,
      storyId: story.id,
      sceneId,
      beatId,
      characterId,
    });
  };

  for (const scene of scenesOf(story)) {
    for (const beat of scene.beats) {
      if (beat.kind === 'dialogue' && beat.outfitId !== undefined) {
        reportOutfit(beat.characterId, beat.outfitId, scene.id, beat.id);
      }
      // panel_cue carries characterIds but no outfitId in the v1 beat union;
      // when characterIds reference unknown characters that is still a canon
      // mismatch worth surfacing.
      if (beat.kind === 'panel_cue' && beat.characterIds !== undefined) {
        for (const characterId of beat.characterIds) {
          if (!charById.has(characterId)) {
            issues.push({
              severity: 'error',
              code: 'APPEARANCE_LOCK_MISMATCH',
              message: `Panel cue references unknown characterId '${characterId}'.`,
              storyId: story.id,
              sceneId: scene.id,
              beatId: beat.id,
              characterId,
            });
          }
        }
      }
    }
  }

  return issues;
}

function indexCharacters(project: Project): Map<string, Character> {
  const byId = new Map<string, Character>();
  for (const character of project.world.characters) {
    byId.set(character.id, character);
  }
  return byId;
}

// ---------------------------------------------------------------------------
// WARDROBE_DRIFT (warning)
// ---------------------------------------------------------------------------

/**
 * Track each character's current outfit across the linear beat order of the
 * whole story (scenes in document order, beats in order). When a dialogue beat
 * gives a character a different outfitId than the one last seen, that is only
 * acceptable if an outfit-changing signal — a `stage` or `asset_event` beat —
 * appeared since the last outfit was established. Otherwise warn: the wardrobe
 * silently drifted.
 *
 * The first outfit observed for a character establishes a baseline and never
 * warns. A `stage`/`asset_event` beat clears the "needs a signal" debt for all
 * characters, modelling a scene change or asset swap that can motivate a new
 * look.
 */
function checkWardrobeDrift(story: Story): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];
  const currentOutfit = new Map<string, string>();
  let changeSignalSinceLastOutfit = false;

  for (const scene of scenesOf(story)) {
    for (const beat of scene.beats) {
      if (beat.kind === 'stage' || beat.kind === 'asset_event') {
        changeSignalSinceLastOutfit = true;
        continue;
      }
      if (beat.kind !== 'dialogue' || beat.outfitId === undefined) continue;

      const previous = currentOutfit.get(beat.characterId);
      if (previous === undefined) {
        // Baseline outfit for this character — establish, do not warn.
        currentOutfit.set(beat.characterId, beat.outfitId);
        changeSignalSinceLastOutfit = false;
        continue;
      }
      if (previous === beat.outfitId) {
        // Same outfit, no drift.
        continue;
      }
      if (!changeSignalSinceLastOutfit) {
        issues.push({
          severity: 'warning',
          code: 'WARDROBE_DRIFT',
          message: `Character '${beat.characterId}' changed outfit from '${previous}' to '${beat.outfitId}' without an intervening stage or asset_event beat.`,
          storyId: story.id,
          sceneId: scene.id,
          beatId: beat.id,
          characterId: beat.characterId,
        });
      }
      currentOutfit.set(beat.characterId, beat.outfitId);
      changeSignalSinceLastOutfit = false;
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// FACT_CONTRADICTION (error)
// ---------------------------------------------------------------------------

/**
 * Within a single scene's beat list (a linear path: we stop scanning at the
 * first `choice` or `branch` beat, after which control is no longer linear),
 * if two unconditional `state_change` beats assign the SAME key two DIFFERENT
 * constant values, that is a contradiction. Re-assigning the same key to the
 * same value is fine; later assignments overwrite, so we compare against the
 * most recent constant we recorded for that key.
 *
 * We scope to one scene because that is the only place the schema guarantees a
 * strictly linear, choice-free run of state_change beats. Across scenes,
 * control flow (jumps/choices/next) can interleave, so cross-scene comparison
 * would not be a single linear path.
 */
function checkFactContradiction(story: Story): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];

  for (const scene of scenesOf(story)) {
    const lastValue = new Map<string, { value: ValueT; beatId: string }>();
    for (const beat of scene.beats) {
      if (beat.kind === 'choice' || beat.kind === 'branch') {
        // Path is no longer linear past this point; stop scanning this scene.
        break;
      }
      if (beat.kind !== 'state_change') continue;
      for (const [key, value] of Object.entries(beat.set)) {
        const prior = lastValue.get(key);
        if (prior && !valuesEqual(prior.value, value)) {
          issues.push({
            severity: 'error',
            code: 'FACT_CONTRADICTION',
            message: `Flag '${key}' is set to '${formatValue(prior.value)}' (beat '${prior.beatId}') then '${formatValue(value)}' (beat '${beat.id}') on one linear path in scene '${scene.id}'.`,
            storyId: story.id,
            sceneId: scene.id,
            beatId: beat.id,
          });
        }
        lastValue.set(key, { value, beatId: beat.id });
      }
    }
  }

  return issues;
}

type ValueT = string | number | boolean;

function valuesEqual(a: ValueT, b: ValueT): boolean {
  return a === b;
}

function formatValue(value: ValueT): string {
  return String(value);
}

// ---------------------------------------------------------------------------
// PLOT_THREAD_ORPHAN (warning)
// ---------------------------------------------------------------------------

/**
 * A plot thread declared in `world.plotThreads` is orphaned when no
 * ScenePlotLink in ANY story references its id. This is always world-scoped:
 * even when linting a single story we consult every story's links so that a
 * thread used elsewhere is not falsely reported.
 */
function checkPlotThreadOrphans(project: Project): ContinuityIssue[] {
  const linkedThreadIds = new Set<string>();
  for (const story of project.stories) {
    for (const link of story.scenePlotLinks) {
      linkedThreadIds.add(link.plotThreadId);
    }
  }

  const issues: ContinuityIssue[] = [];
  for (const thread of project.world.plotThreads) {
    if (linkedThreadIds.has(thread.id)) continue;
    issues.push({
      severity: 'warning',
      code: 'PLOT_THREAD_ORPHAN',
      message: `Plot thread '${thread.id}' (${thread.name}) is not referenced by any ScenePlotLink.`,
    });
  }

  return issues;
}

// Reference Beat type so an unused-import never silently masks a contract drift.
export type { Beat as ContinuityBeat };
