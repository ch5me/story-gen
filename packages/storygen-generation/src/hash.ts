/**
 * Tiny deterministic string hash (FNV-1a, 32-bit) rendered as fixed-width hex.
 *
 * No external dependency. Same input string always yields the same output, so
 * generation job ids are stable and reproducible across processes and runs.
 */
export function deterministicHash(input: string): string {
  // FNV-1a 32-bit constants.
  const offsetBasis = 0x811c9dc5;
  const prime = 0x01000193;

  let hash = offsetBasis;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // Multiply by the FNV prime in 32-bit space. Math.imul keeps it exact and
    // deterministic without overflowing into floating point.
    hash = Math.imul(hash, prime);
  }

  // Coerce to an unsigned 32-bit integer and render as 8-char zero-padded hex.
  return (hash >>> 0).toString(16).padStart(8, '0');
}
