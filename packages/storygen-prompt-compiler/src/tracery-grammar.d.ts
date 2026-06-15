/**
 * Minimal ambient types for `tracery-grammar` (v2.x) covering ONLY the surface
 * this package uses. The published package ships no bundled types; the real
 * runtime shape (inspected from node_modules/tracery-grammar/tracery.js) is a
 * single default export object with `createGrammar(raw)` returning a `Grammar`
 * that exposes `addModifiers(mods)` and `flatten(origin)`, plus an exported
 * `baseEngModifiers` modifier map and a `setRng(fn)` hook that swaps the RNG
 * Tracery uses for rule selection (the module captures `Math.random` once at
 * load time into a private closure variable, so swapping the global afterwards
 * has no effect — `setRng` is the only deterministic seam).
 */
declare module 'tracery-grammar' {
  /** A Tracery modifier transforms an expanded string (e.g. capitalize). */
  export type TraceryModifier = (
    text: string,
    ...params: string[]
  ) => string;

  /** Map of modifier name -> modifier function. */
  export type TraceryModifiers = Record<string, TraceryModifier>;

  /** A compiled Tracery grammar. */
  export interface Grammar {
    /** Merge additional modifiers (e.g. `baseEngModifiers`) into the grammar. */
    addModifiers(mods: TraceryModifiers): void;
    /** Expand `origin` (a Tracery rule like `#origin#`) to a finished string. */
    flatten(origin: string): string;
  }

  export interface Tracery {
    /** Build a grammar from a raw symbol -> rule-list object. */
    createGrammar(raw: Record<string, string[]>): Grammar;
    /** Default English modifiers (capitalize, a/an, pluralize, ...). */
    baseEngModifiers: TraceryModifiers;
    /** Swap the RNG used for rule selection. Pass a seeded PRNG for determinism. */
    setRng(rng: () => number): void;
  }

  const tracery: Tracery;
  export default tracery;
}
