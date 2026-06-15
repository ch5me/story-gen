import { describe, expect, it } from 'vitest';
import { WebManifestSchema } from '@ch5me/storygen-schema';
import type { WebManifest } from '@ch5me/storygen-schema';
import { createPlayer } from './runtime';

/**
 * Headless runtime tests — no DOM required. We hand-build a small WebManifest,
 * validate it through the schema (proving our fixture is a real compiled story),
 * then drive the player and assert the deterministic walk.
 */

function buildManifest(): WebManifest {
  return WebManifestSchema.parse({
    version: 1,
    projectId: 'proj_test',
    title: 'Runtime Fixture',
    startNodeId: 'node_start',
    variables: { met_devin: false },
    nodes: {
      node_start: {
        id: 'node_start',
        title: 'Arrival',
        beats: [
          { id: 'b_narr', kind: 'narration', text: 'The rooftop is quiet.' },
          {
            id: 'b_dial',
            kind: 'dialogue',
            speaker: 'Mara',
            characterId: 'mara',
            text: 'Anyone up here?',
          },
          {
            id: 'b_choice',
            kind: 'choice',
            prompt: 'How does Mara respond?',
            options: [
              {
                id: 'opt_greet',
                label: 'Say hello',
                target: 'node_end',
                setFlags: { met_devin: true },
              },
              {
                id: 'opt_leave',
                label: 'Slip away',
                target: 'node_end',
              },
            ],
          },
        ],
      },
      node_end: {
        id: 'node_end',
        title: 'Linger',
        beats: [{ id: 'b_end', kind: 'narration', text: 'A breeze answers instead.' }],
        next: null,
      },
    },
  });
}

describe('createPlayer headless walk', () => {
  it('stops on narration first, then walks dialogue -> choice -> chosen target -> end', () => {
    const manifest = buildManifest();
    const player = createPlayer(manifest);

    // Stops on the first narration beat.
    const start = player.current();
    expect(start.node.id).toBe('node_start');
    expect(start.beat?.kind).toBe('narration');
    expect(player.isEnded()).toBe(false);
    expect(player.flags()).toEqual({ met_devin: false });

    // Advance to the dialogue beat.
    player.advance();
    const dialogue = player.current();
    expect(dialogue.beat?.kind).toBe('dialogue');
    if (dialogue.beat?.kind === 'dialogue') {
      expect(dialogue.beat.speaker).toBe('Mara');
    }

    // Advance to the choice beat.
    player.advance();
    const choice = player.current();
    expect(choice.beat?.kind).toBe('choice');

    // Choose the flag-setting option.
    player.choose('opt_greet');
    expect(player.flags()).toEqual({ met_devin: true });

    // The choice jumped to its target node and settled on its narration.
    const afterChoice = player.current();
    expect(afterChoice.node.id).toBe('node_end');
    expect(afterChoice.beat?.kind).toBe('narration');
    expect(player.isEnded()).toBe(false);

    // Advance past the terminal node's last beat -> ended.
    player.advance();
    expect(player.isEnded()).toBe(true);
    expect(player.current().beat).toBeNull();
  });

  it('is deterministic: identical input + identical choices yields identical flags', () => {
    const a = createPlayer(buildManifest());
    const b = createPlayer(buildManifest());
    for (const player of [a, b]) {
      player.advance();
      player.advance();
      player.choose('opt_greet');
    }
    expect(a.flags()).toEqual(b.flags());
    expect(a.current().node.id).toBe(b.current().node.id);
  });

  it('fails fast when choosing an unknown option', () => {
    const player = createPlayer(buildManifest());
    player.advance();
    player.advance();
    expect(() => player.choose('opt_missing')).toThrow(/option "opt_missing" not found/);
  });

  it('fails fast when choosing while not on a choice beat', () => {
    const player = createPlayer(buildManifest());
    expect(() => player.choose('opt_greet')).toThrow(/no choice is active/);
  });

  it('does not set the flag when the non-setting option is chosen', () => {
    const player = createPlayer(buildManifest());
    player.advance();
    player.advance();
    player.choose('opt_leave');
    expect(player.flags()).toEqual({ met_devin: false });
    expect(player.current().node.id).toBe('node_end');
  });
});
