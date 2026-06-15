/**
 * @ch5me/storygen-player — reusable web-reader primitives.
 *
 * Two layers behind one entrypoint:
 * - A headless, DOM-free deterministic runtime ({@link createPlayer}) that walks
 *   a compiled {@link WebManifest}.
 * - Minimal React bindings ({@link usePlayer}, {@link StoryPlayer}) plus the
 *   {@link RenderAdapter} seam for alternative renderers (PixiVN adapter is v2).
 */

export { createPlayer } from './runtime';
export type { Player, PlayerPosition, PresentationBeat } from './runtime';

export { usePlayer, StoryPlayer } from './react';
export type { UsePlayer, StoryPlayerProps, RenderAdapter } from './react';
