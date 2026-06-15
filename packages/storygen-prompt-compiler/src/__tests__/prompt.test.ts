import { describe, expect, it } from 'vitest';
import { sampleProject } from '@ch5me/storygen-schema';
import {
  compileCharacterPrompt,
  compilePanelPrompt,
  PromptCompileError,
  DEFAULT_NEGATIVE_PROMPT,
} from '../index';

describe('compilePanelPrompt', () => {
  it('compiles scene_arrival panel cue b_arr_4 with character + location + locked appearance', () => {
    const result = compilePanelPrompt(sampleProject, {
      sceneId: 'scene_arrival',
      beatId: 'b_arr_4',
    });

    // Character name + location appear in the prompt.
    expect(result.prompt).toContain('Mara');
    expect(result.prompt).toContain('Rooftop Bar');
    // The panel cue description is carried through.
    expect(result.prompt).toContain('Mara leans on the rooftop railing');

    // Mara locks hair_color=auburn -> explicit PRESERVE section + auburn value.
    expect(result.prompt).toContain('PRESERVE (do not change):');
    expect(result.prompt).toContain('auburn');

    // The locked field is returned in `preserve`.
    expect(result.preserve).toContain('hair_color=auburn');

    // forbiddenChanges fold into the negative prompt alongside defaults.
    expect(result.negativePrompt).toContain('hair_color');
    expect(result.negativePrompt).toContain('watermark');
  });

  it('uses the project start story when storyId is omitted', () => {
    const withId = compilePanelPrompt(sampleProject, {
      storyId: 'story_main',
      sceneId: 'scene_arrival',
      beatId: 'b_arr_4',
    });
    const withoutId = compilePanelPrompt(sampleProject, {
      sceneId: 'scene_arrival',
      beatId: 'b_arr_4',
    });
    expect(withoutId).toEqual(withId);
  });

  it('throws a typed error when the scene is missing', () => {
    expect(() =>
      compilePanelPrompt(sampleProject, { sceneId: 'scene_nope', beatId: 'b_arr_4' }),
    ).toThrow(PromptCompileError);
  });

  it('throws a typed error when the beat is missing', () => {
    expect(() =>
      compilePanelPrompt(sampleProject, { sceneId: 'scene_arrival', beatId: 'b_nope' }),
    ).toThrow(PromptCompileError);
  });

  it('compiles a character-bearing dialogue beat when targeted directly', () => {
    const result = compilePanelPrompt(sampleProject, {
      sceneId: 'scene_arrival',
      beatId: 'b_arr_3',
    });
    expect(result.prompt).toContain('Mara');
    expect(result.prompt).toContain('Quite a view.');
    expect(result.preserve).toContain('hair_color=auburn');
  });

  it('throws when targeting a beat with no character/panel context', () => {
    expect(() =>
      compilePanelPrompt(sampleProject, { sceneId: 'scene_arrival', beatId: 'b_arr_1' }),
    ).toThrow(PromptCompileError);
  });
});

describe('compileCharacterPrompt', () => {
  it('compiles Mara with locked appearance preserved', () => {
    const result = compileCharacterPrompt(sampleProject, 'mara');
    expect(result.prompt).toContain('Mara');
    expect(result.prompt).toContain('Auburn hair');
    expect(result.prompt).toContain('PRESERVE (do not change):');
    expect(result.preserve).toEqual(['hair_color=auburn']);
  });

  it('compiles Devin (eye_color lock, no forbiddenChanges) with default negatives only', () => {
    const result = compileCharacterPrompt(sampleProject, 'devin');
    expect(result.preserve).toEqual(['eye_color=green']);
    expect(result.negativePrompt).toBe(DEFAULT_NEGATIVE_PROMPT);
  });

  it('throws a typed error for an unknown character', () => {
    expect(() => compileCharacterPrompt(sampleProject, 'nobody')).toThrow(PromptCompileError);
  });
});
