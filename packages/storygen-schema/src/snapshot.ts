import { z } from 'zod';
import { VariableValueSchema, zId } from './primitives';

/**
 * A point-in-time view of the world used by continuity checks and prompt
 * compilation. Built by walking beats from the start node.
 */
export const WorldStateSnapshotSchema = z.object({
  sceneId: zId.optional(),
  beatId: zId.optional(),
  flags: z.record(z.string(), VariableValueSchema).default({}),
  relationshipValues: z.record(z.string(), z.number()).default({}),
  /** characterId -> outfitId currently worn. */
  wardrobe: z.record(z.string(), zId).default({}),
  location: zId.optional(),
  knownFacts: z.array(z.string()).default([]),
  presentCharacters: z.array(zId).default([]),
  approvedAssets: z.array(zId).default([]),
});
export type WorldStateSnapshot = z.infer<typeof WorldStateSnapshotSchema>;
