import { describe, expect, it } from 'vitest';
import { traceryExpand } from '../index';

const grammar: Record<string, string[]> = {
  origin: ['#mood# #place#'],
  mood: ['quiet', 'electric', 'restless', 'warm', 'cold'],
  place: ['rooftop', 'alley', 'harbor', 'station', 'plaza'],
};

describe('traceryExpand', () => {
  it('is deterministic: the same seed yields identical output across calls', () => {
    const a = traceryExpand(grammar, { seed: 1234 });
    const b = traceryExpand(grammar, { seed: 1234 });
    expect(a).toBe(b);
  });

  it('does not leak the seeded RNG between calls (each call reinstalls its own seed)', () => {
    // Two interleaved deterministic calls must not influence each other: a fresh
    // seed is installed per call and Tracery's default RNG is restored after.
    const first = traceryExpand(grammar, { seed: 7 });
    traceryExpand(grammar, { seed: 12345 });
    const firstAgain = traceryExpand(grammar, { seed: 7 });
    expect(firstAgain).toBe(first);
  });

  it('defaults origin to #origin#', () => {
    const explicit = traceryExpand(grammar, { seed: 55, origin: '#origin#' });
    const defaulted = traceryExpand(grammar, { seed: 55 });
    expect(defaulted).toBe(explicit);
  });

  it('different seeds may differ (documented behavior) while each stays stable', () => {
    // Scan a span of seeds; with this grammar at least one differs from seed 0.
    // (Different seeds MAY differ — this asserts the RNG actually drives selection.)
    const base = traceryExpand(grammar, { seed: 0 });
    const someDiffer = Array.from({ length: 25 }, (_unused, index) =>
      traceryExpand(grammar, { seed: index + 1 }),
    ).some((value) => value !== base);
    expect(someDiffer).toBe(true);

    // Each individual seed remains reproducible.
    for (let seed = 0; seed < 5; seed += 1) {
      expect(traceryExpand(grammar, { seed })).toBe(traceryExpand(grammar, { seed }));
    }
  });
});
