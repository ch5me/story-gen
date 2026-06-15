import tracery from 'tracery-grammar';

/**
 * Deterministic 32-bit PRNG (mulberry32). Given the same seed it always yields
 * the same sequence of floats in [0, 1) — the property Tracery needs to flatten
 * a grammar reproducibly.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TraceryExpandOptions {
  /** Integer seed; same seed -> identical output. */
  seed: number;
  /** Tracery origin rule. Defaults to '#origin#'. */
  origin?: string;
}

/**
 * Expand a Tracery grammar deterministically.
 *
 * Tracery selects rules via a private `rng` it captures from `Math.random`
 * once at module-load time, so swapping the global `Math.random` afterwards
 * does NOT affect it — the only deterministic seam is the exported `setRng`
 * hook. We install a seeded mulberry32 PRNG for the duration of the `flatten`
 * call, then restore Tracery's default RNG (`Math.random`) afterwards — even if
 * `flatten` throws. Identical `seed` (and grammar/origin) yields byte-identical
 * output; different seeds may diverge.
 */
export function traceryExpand(
  grammar: Record<string, string[]>,
  opts: TraceryExpandOptions,
): string {
  const origin = opts.origin ?? '#origin#';
  const compiled = tracery.createGrammar(grammar);
  compiled.addModifiers(tracery.baseEngModifiers);

  const seeded = mulberry32(opts.seed);
  tracery.setRng(seeded);
  try {
    return compiled.flatten(origin);
  } finally {
    // Restore Tracery's default RNG (the module defaults `rng` to Math.random).
    tracery.setRng(Math.random);
  }
}
