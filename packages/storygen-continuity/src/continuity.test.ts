import { describe, expect, it } from 'vitest';
import { sampleProject, type Project } from '@ch5me/storygen-schema';
import { checkContinuity, type ContinuityIssue } from './index';

function errorsOf(issues: ContinuityIssue[]): ContinuityIssue[] {
  return issues.filter((issue) => issue.severity === 'error');
}

function codesOf(issues: ContinuityIssue[]): string[] {
  return issues.map((issue) => issue.code);
}

describe('checkContinuity on the sample project', () => {
  it('returns zero error issues', () => {
    const issues = checkContinuity(sampleProject);
    expect(errorsOf(issues)).toEqual([]);
  });

  it('returns zero warnings too (sample is fully linked)', () => {
    const issues = checkContinuity(sampleProject);
    expect(issues).toEqual([]);
  });

  it('is deterministic: identical input yields identical output', () => {
    const a = checkContinuity(sampleProject);
    const b = checkContinuity(structuredClone(sampleProject) as Project);
    expect(a).toEqual(b);
  });

  it('throws fast when an unknown storyId is requested', () => {
    expect(() => checkContinuity(sampleProject, { storyId: 'nope' })).toThrow(
      /not found/,
    );
  });
});

describe('MISSING_ROUTE_TARGET', () => {
  it('flags a choice option whose target scene does not exist', () => {
    const project = structuredClone(sampleProject) as Project;
    const scene = project.stories[0]!.chapters[0]!.scenes[0]!; // scene_arrival
    const choice = scene.beats.find((b) => b.kind === 'choice')!;
    if (choice.kind !== 'choice') throw new Error('expected choice beat');
    choice.options[0]!.target = 'scene_ghost';

    const issues = checkContinuity(project);
    const route = issues.filter((i) => i.code === 'MISSING_ROUTE_TARGET');
    expect(route).toHaveLength(1);
    expect(route[0]!.severity).toBe('error');
    expect(route[0]!.sceneId).toBe('scene_arrival');
    expect(route[0]!.beatId).toBe(choice.id);
    expect(errorsOf(issues).map((i) => i.code)).toContain('MISSING_ROUTE_TARGET');
  });

  it('flags a dangling scene.next fall-through', () => {
    const project = structuredClone(sampleProject) as Project;
    project.stories[0]!.chapters[0]!.scenes[3]!.next = 'scene_nowhere'; // scene_close

    const route = checkContinuity(project).filter(
      (i) => i.code === 'MISSING_ROUTE_TARGET',
    );
    expect(route).toHaveLength(1);
    expect(route[0]!.sceneId).toBe('scene_close');
    expect(route[0]!.beatId).toBeUndefined();
  });
});

describe('APPEARANCE_LOCK_MISMATCH', () => {
  it('flags a dialogue outfitId that is not in the character canon', () => {
    const project = structuredClone(sampleProject) as Project;
    const scene = project.stories[0]!.chapters[0]!.scenes[0]!; // scene_arrival
    const dialogue = scene.beats.find(
      (b) => b.kind === 'dialogue' && b.characterId === 'mara',
    )!;
    if (dialogue.kind !== 'dialogue') throw new Error('expected dialogue beat');
    dialogue.outfitId = 'outfit_not_real';

    const issues = checkContinuity(project);
    const lock = issues.filter((i) => i.code === 'APPEARANCE_LOCK_MISMATCH');
    expect(lock).toHaveLength(1);
    expect(lock[0]!.severity).toBe('error');
    expect(lock[0]!.characterId).toBe('mara');
    expect(lock[0]!.beatId).toBe(dialogue.id);
  });
});

describe('WARDROBE_DRIFT', () => {
  it('warns when a character outfit changes with no stage/asset_event between', () => {
    // Build a tiny story: two mara dialogue beats with different outfits, no
    // stage/asset_event between them.
    const project = structuredClone(sampleProject) as Project;
    const scene = project.stories[0]!.chapters[0]!.scenes[0]!; // scene_arrival
    // Give mara a second canonical outfit so this is NOT a lock mismatch.
    const mara = project.world.characters.find((c) => c.id === 'mara')!;
    mara.outfits.push({ id: 'outfit_mara_gown', name: 'Evening gown' });
    // Append a second mara dialogue with a different outfit and remove the
    // intervening stage signal effect by inserting right after her first line.
    scene.beats = [
      { id: 'd1', kind: 'dialogue', characterId: 'mara', text: 'Hi.', outfitId: 'outfit_mara_casual' },
      { id: 'd2', kind: 'dialogue', characterId: 'mara', text: 'Bye.', outfitId: 'outfit_mara_gown' },
    ];

    const issues = checkContinuity(project, { storyId: 'story_main' });
    const drift = issues.filter((i) => i.code === 'WARDROBE_DRIFT');
    expect(drift).toHaveLength(1);
    expect(drift[0]!.severity).toBe('warning');
    expect(drift[0]!.characterId).toBe('mara');
    expect(drift[0]!.beatId).toBe('d2');
    // And no errors leaked in.
    expect(errorsOf(issues)).toEqual([]);
  });

  it('does NOT warn when a stage beat sits between outfit changes', () => {
    const project = structuredClone(sampleProject) as Project;
    const scene = project.stories[0]!.chapters[0]!.scenes[0]!;
    const mara = project.world.characters.find((c) => c.id === 'mara')!;
    mara.outfits.push({ id: 'outfit_mara_gown', name: 'Evening gown' });
    scene.beats = [
      { id: 'd1', kind: 'dialogue', characterId: 'mara', text: 'Hi.', outfitId: 'outfit_mara_casual' },
      { id: 's1', kind: 'stage', locationId: 'loc_rooftop', present: ['mara'] },
      { id: 'd2', kind: 'dialogue', characterId: 'mara', text: 'Bye.', outfitId: 'outfit_mara_gown' },
    ];

    const drift = checkContinuity(project, { storyId: 'story_main' }).filter(
      (i) => i.code === 'WARDROBE_DRIFT',
    );
    expect(drift).toEqual([]);
  });
});

describe('FACT_CONTRADICTION', () => {
  it('flags two different constant values for one key on a linear path', () => {
    const project = structuredClone(sampleProject) as Project;
    const scene = project.stories[0]!.chapters[0]!.scenes[1]!; // scene_meet
    // Inject two contradicting unconditional state_change beats before any
    // choice/branch, on the same linear run.
    scene.beats = [
      { id: 'sc1', kind: 'state_change', set: { affection: 1 } },
      { id: 'sc2', kind: 'state_change', set: { affection: 5 } },
    ];

    const issues = checkContinuity(project);
    const fact = issues.filter((i) => i.code === 'FACT_CONTRADICTION');
    expect(fact).toHaveLength(1);
    expect(fact[0]!.severity).toBe('error');
    expect(fact[0]!.sceneId).toBe('scene_meet');
    expect(fact[0]!.beatId).toBe('sc2');
  });

  it('does NOT flag re-assigning the same value', () => {
    const project = structuredClone(sampleProject) as Project;
    const scene = project.stories[0]!.chapters[0]!.scenes[1]!;
    scene.beats = [
      { id: 'sc1', kind: 'state_change', set: { affection: 1 } },
      { id: 'sc2', kind: 'state_change', set: { affection: 1 } },
    ];

    const fact = checkContinuity(project).filter(
      (i) => i.code === 'FACT_CONTRADICTION',
    );
    expect(fact).toEqual([]);
  });
});

describe('PLOT_THREAD_ORPHAN', () => {
  it('warns when a plot thread has no ScenePlotLink referencing it', () => {
    const project = structuredClone(sampleProject) as Project;
    project.world.plotThreads.push({ id: 'thread_orphan', name: 'Orphan Arc' });

    const issues = checkContinuity(project);
    const orphan = issues.filter((i) => i.code === 'PLOT_THREAD_ORPHAN');
    expect(orphan).toHaveLength(1);
    expect(orphan[0]!.severity).toBe('warning');
    expect(orphan[0]!.message).toContain('thread_orphan');
    // It is world-scoped even when a single story is linted.
    const scoped = checkContinuity(project, { storyId: 'story_main' }).filter(
      (i) => i.code === 'PLOT_THREAD_ORPHAN',
    );
    expect(codesOf(scoped)).toContain('PLOT_THREAD_ORPHAN');
  });
});
