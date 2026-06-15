import { describe, it, expect } from 'vitest';
import { Compiler } from 'inkjs/full';
import { WebManifestSchema, sampleProject } from '@ch5me/storygen-schema';
import {
  compileWebManifest,
  compileRenpy,
  compileInk,
  compileAll,
} from '../index';

describe('compileWebManifest', () => {
  it('produces a stable, schema-valid manifest', () => {
    const result = compileWebManifest(sampleProject);
    expect(result).toMatchSnapshot();
    expect(WebManifestSchema.safeParse(result).success).toBe(true);
  });

  it('emits a node for every gathered scene', () => {
    const result = compileWebManifest(sampleProject);
    expect(result.nodes['scene_arrival']).toBeDefined();
    expect(result.nodes['scene_meet']).toBeDefined();
    expect(result.nodes['scene_linger']).toBeDefined();
    expect(result.nodes['scene_close']).toBeDefined();
  });

  it('maps the scene_arrival choice into a runtime choice beat with two options', () => {
    const result = compileWebManifest(sampleProject);
    const arrival = result.nodes['scene_arrival'];
    expect(arrival).toBeDefined();
    const choice = arrival!.beats.find((b) => b.kind === 'choice');
    expect(choice).toBeDefined();
    if (choice?.kind !== 'choice') throw new Error('expected a choice beat');
    expect(choice.options).toHaveLength(2);
    expect(choice.options.map((o) => o.target)).toEqual(['scene_meet', 'scene_linger']);
  });

  it('resolves dialogue speakers from world character names', () => {
    const result = compileWebManifest(sampleProject);
    const meet = result.nodes['scene_meet'];
    const dialogue = meet!.beats.find((b) => b.kind === 'dialogue');
    if (dialogue?.kind !== 'dialogue') throw new Error('expected a dialogue beat');
    expect(dialogue.speaker).toBe('Devin');
    expect(dialogue.characterId).toBe('devin');
  });

  it('drops canonical-only beats (stage/panel_cue) from the web runtime subset', () => {
    const result = compileWebManifest(sampleProject);
    const arrival = result.nodes['scene_arrival'];
    const kinds = arrival!.beats.map((b) => b.kind);
    expect(kinds).not.toContain('stage');
    expect(kinds).not.toContain('panel_cue');
  });

  it('throws a typed error when the requested story is missing', () => {
    expect(() => compileWebManifest(sampleProject, { storyId: 'nope' })).toThrow(
      /story "nope" not found/,
    );
  });

  it('throws a typed error when a dialogue references an unknown character', () => {
    const broken = structuredClone(sampleProject);
    const scene = broken.stories[0]!.chapters[0]!.scenes.find((s) => s.id === 'scene_meet')!;
    const dialogue = scene.beats.find((b) => b.kind === 'dialogue')!;
    if (dialogue.kind === 'dialogue') dialogue.characterId = 'ghost';
    expect(() => compileWebManifest(broken)).toThrow(/unknown character "ghost"/);
  });
});

describe('compileRenpy', () => {
  it('produces a deterministic .rpy script', () => {
    const result = compileRenpy(sampleProject);
    expect(result).toMatchSnapshot();
  });
});

describe('compileInk', () => {
  it('produces deterministic Ink source', () => {
    const result = compileInk(sampleProject);
    expect(result).toMatchSnapshot();
  });

  it('compiles cleanly under inkjs into a Story', () => {
    const source = compileInk(sampleProject);
    const compiler = new Compiler(source);
    const story = compiler.Compile();
    expect(story).toBeDefined();
    // The compiled story runs and emits the opening narration before its first
    // choice — proves the Ink is genuinely valid, not just non-throwing.
    const output = story.ContinueMaximally();
    expect(output).toContain('The rooftop bar glows against a bruise-blue sky.');
    expect(story.currentChoices.length).toBe(2);
  });
});

describe('determinism', () => {
  it('compiles identical output for identical input', () => {
    const a = compileAll(sampleProject);
    const b = compileAll(sampleProject);
    expect(a.web).toEqual(b.web);
    expect(a.renpy).toBe(b.renpy);
    expect(a.ink).toBe(b.ink);
  });
});
