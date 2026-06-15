import { z } from 'zod';
import { VariableValueSchema, zId } from './primitives';
import { AssetKindSchema } from './assets';

/**
 * Compiled (runtime) shapes. The compiler produces these; the player and reader
 * consume them. This is the stable contract between authoring and runtime — the
 * v1 reader renders the `narration | dialogue | choice | set | jump` subset.
 */

export const RuntimeChoiceOptionSchema = z.object({
  id: zId,
  label: z.string(),
  target: zId,
  setFlags: z.record(z.string(), VariableValueSchema).optional(),
});
export type RuntimeChoiceOption = z.infer<typeof RuntimeChoiceOptionSchema>;

export const RuntimeBeatSchema = z.discriminatedUnion('kind', [
  z.object({ id: zId, kind: z.literal('narration'), text: z.string(), assetId: zId.optional() }),
  z.object({
    id: zId,
    kind: z.literal('dialogue'),
    speaker: z.string(),
    characterId: zId.optional(),
    text: z.string(),
    expression: z.string().optional(),
    assetId: zId.optional(),
  }),
  z.object({
    id: zId,
    kind: z.literal('choice'),
    prompt: z.string().optional(),
    options: z.array(RuntimeChoiceOptionSchema).min(1),
  }),
  z.object({ id: zId, kind: z.literal('set'), set: z.record(z.string(), VariableValueSchema) }),
  z.object({ id: zId, kind: z.literal('jump'), target: zId }),
]);
export type RuntimeBeat = z.infer<typeof RuntimeBeatSchema>;
export type RuntimeBeatKind = RuntimeBeat['kind'];

export const CompiledNodeSchema = z.object({
  id: zId,
  title: z.string().optional(),
  beats: z.array(RuntimeBeatSchema),
  /** Default fallthrough node when the last beat is not a jump/choice. */
  next: zId.nullable().optional(),
});
export type CompiledNode = z.infer<typeof CompiledNodeSchema>;

export const AssetManifestEntrySchema = z.object({
  id: zId,
  kind: AssetKindSchema,
  url: z.string().optional(),
  status: z.string(),
});
export type AssetManifestEntry = z.infer<typeof AssetManifestEntrySchema>;

/** The player-ready compiled story. */
export const WebManifestSchema = z.object({
  version: z.literal(1),
  projectId: zId,
  title: z.string(),
  startNodeId: zId,
  variables: z.record(z.string(), VariableValueSchema).default({}),
  nodes: z.record(z.string(), CompiledNodeSchema),
  assets: z.array(AssetManifestEntrySchema).default([]),
});
export type WebManifest = z.infer<typeof WebManifestSchema>;

/** Everything the compiler can emit for a project. */
export interface CompiledOutputs {
  web: WebManifest;
  renpy: string;
  ink: string;
}
