import { z } from 'zod';
import { ConditionSchema, VariableValueSchema, zId } from './primitives';

/** A single selectable choice option. */
export const ChoiceOptionSchema = z.object({
  id: zId,
  label: z.string().min(1),
  /** Scene/node id to jump to when this option is taken. */
  target: zId,
  /** Optional gate; option only offered when the condition holds. */
  condition: ConditionSchema.optional(),
  /** Flags written when this option is taken. */
  setFlags: z.record(z.string(), VariableValueSchema).optional(),
});
export type ChoiceOption = z.infer<typeof ChoiceOptionSchema>;

export const NarrationBeatSchema = z.object({
  id: zId,
  kind: z.literal('narration'),
  text: z.string(),
  assetId: zId.optional(),
});
export type NarrationBeat = z.infer<typeof NarrationBeatSchema>;

export const DialogueBeatSchema = z.object({
  id: zId,
  kind: z.literal('dialogue'),
  characterId: zId,
  text: z.string(),
  expression: z.string().optional(),
  outfitId: zId.optional(),
  assetId: zId.optional(),
});
export type DialogueBeat = z.infer<typeof DialogueBeatSchema>;

export const ChoiceBeatSchema = z.object({
  id: zId,
  kind: z.literal('choice'),
  prompt: z.string().optional(),
  options: z.array(ChoiceOptionSchema).min(1),
});
export type ChoiceBeat = z.infer<typeof ChoiceBeatSchema>;

export const StateChangeBeatSchema = z.object({
  id: zId,
  kind: z.literal('state_change'),
  /** Absolute flag assignments applied at runtime. */
  set: z.record(z.string(), VariableValueSchema),
});
export type StateChangeBeat = z.infer<typeof StateChangeBeatSchema>;

export const StageBeatSchema = z.object({
  id: zId,
  kind: z.literal('stage'),
  locationId: zId.optional(),
  present: z.array(zId).optional(),
  note: z.string().optional(),
});
export type StageBeat = z.infer<typeof StageBeatSchema>;

export const PanelCueBeatSchema = z.object({
  id: zId,
  kind: z.literal('panel_cue'),
  description: z.string(),
  characterIds: z.array(zId).optional(),
  locationId: zId.optional(),
  recipeId: zId.optional(),
  assetId: zId.optional(),
});
export type PanelCueBeat = z.infer<typeof PanelCueBeatSchema>;

export const AssetEventBeatSchema = z.object({
  id: zId,
  kind: z.literal('asset_event'),
  assetId: zId,
  event: z.enum(['show', 'hide', 'play', 'stop']),
  channel: z.string().optional(),
});
export type AssetEventBeat = z.infer<typeof AssetEventBeatSchema>;

export const JumpBeatSchema = z.object({
  id: zId,
  kind: z.literal('jump'),
  target: zId,
});
export type JumpBeat = z.infer<typeof JumpBeatSchema>;

export const BranchBeatSchema = z.object({
  id: zId,
  kind: z.literal('branch'),
  branches: z
    .array(z.object({ condition: ConditionSchema, target: zId }))
    .min(1),
  fallback: zId.optional(),
});
export type BranchBeat = z.infer<typeof BranchBeatSchema>;

/** The canonical beat discriminated union — the spine of the data model. */
export const BeatSchema = z.discriminatedUnion('kind', [
  NarrationBeatSchema,
  DialogueBeatSchema,
  ChoiceBeatSchema,
  StateChangeBeatSchema,
  StageBeatSchema,
  PanelCueBeatSchema,
  AssetEventBeatSchema,
  JumpBeatSchema,
  BranchBeatSchema,
]);
export type Beat = z.infer<typeof BeatSchema>;
export type BeatKind = Beat['kind'];
