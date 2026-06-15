import type { Project, CompiledOutputs } from '@ch5me/storygen-schema';
import type { CompileOptions } from './internal/story-selection';
import { compileWebManifest } from './web-manifest';
import { compileRenpy } from './renpy';
import { compileInk } from './ink';

export type { CompileOptions };
export { compileWebManifest } from './web-manifest';
export { compileRenpy } from './renpy';
export { compileInk } from './ink';

/**
 * Compile every supported output for a project in one pass: the player web
 * manifest, a Ren'Py script, and Ink source. Deterministic for a given input.
 */
export function compileAll(project: Project, opts?: CompileOptions): CompiledOutputs {
  return {
    web: compileWebManifest(project, opts),
    renpy: compileRenpy(project, opts),
    ink: compileInk(project, opts),
  };
}
