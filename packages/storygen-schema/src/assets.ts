import { z } from 'zod';
import { zId } from './primitives';

export const StylePresetSchema = z.object({
  id: zId,
  name: z.string(),
  positive: z.string().optional(),
  negative: z.string().optional(),
  model: z.string().optional(),
});
export type StylePreset = z.infer<typeof StylePresetSchema>;

export const GenRecipeKindSchema = z.enum(['character', 'location', 'panel', 'cg', 'voice']);
export type GenRecipeKind = z.infer<typeof GenRecipeKindSchema>;

/** A reusable recipe for generating an asset (prompt + model settings). */
export const GenRecipeSchema = z.object({
  id: zId,
  name: z.string(),
  kind: GenRecipeKindSchema,
  basePrompt: z.string().optional(),
  negativePrompt: z.string().optional(),
  stylePresetId: zId.optional(),
  model: z.string().optional(),
  seed: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});
export type GenRecipe = z.infer<typeof GenRecipeSchema>;

/** Full provenance for a generated asset. */
export const AssetProvenanceSchema = z.object({
  model: z.string(),
  checkpoint: z.string().optional(),
  prompt: z.string(),
  negativePrompt: z.string().optional(),
  seed: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
  referenceAssetIds: z.array(zId).default([]),
  controlInputs: z.array(z.string()).default([]),
  adapters: z.array(z.string()).default([]),
  workflowId: z.string().optional(),
  parentRecipeId: zId.optional(),
});
export type AssetProvenance = z.infer<typeof AssetProvenanceSchema>;

export const AssetKindSchema = z.enum(['image', 'sprite', 'cg', 'audio', 'voice', 'background']);
export type AssetKind = z.infer<typeof AssetKindSchema>;

export const AssetStatusSchema = z.enum([
  'placeholder',
  'candidate',
  'approved',
  'locked',
  'uploaded_manual',
]);
export type AssetStatus = z.infer<typeof AssetStatusSchema>;

/**
 * An asset. Canon assets (approved/locked) require provenance; an explicitly
 * `uploaded_manual` asset is canon without generation provenance. Fail loud
 * otherwise — no silent acceptance of unsourced canon art.
 */
export const AssetSchema = z
  .object({
    id: zId,
    kind: AssetKindSchema,
    url: z.string().optional(),
    status: AssetStatusSchema.default('placeholder'),
    provenance: AssetProvenanceSchema.optional(),
    caption: z.string().optional(),
    recipeId: zId.optional(),
  })
  .superRefine((asset, ctx) => {
    const canonNeedsProvenance = asset.status === 'approved' || asset.status === 'locked';
    if (canonNeedsProvenance && !asset.provenance) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Canon asset (approved/locked) requires provenance, or use status "uploaded_manual".',
        path: ['provenance'],
      });
    }
  });
export type Asset = z.infer<typeof AssetSchema>;

export const GenerationJobStatusSchema = z.enum(['queued', 'running', 'succeeded', 'failed']);
export type GenerationJobStatus = z.infer<typeof GenerationJobStatusSchema>;

export const GenerationJobSchema = z.object({
  id: zId,
  recipeId: zId.optional(),
  kind: GenRecipeKindSchema,
  status: GenerationJobStatusSchema.default('queued'),
  prompt: z.string().optional(),
  negativePrompt: z.string().optional(),
  resultAssetId: zId.optional(),
  error: z.string().optional(),
  createdAt: z.string().optional(),
});
export type GenerationJob = z.infer<typeof GenerationJobSchema>;

export const ExportFormatSchema = z.enum(['web', 'renpy', 'ink']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const ExportRecordSchema = z.object({
  id: zId,
  format: ExportFormatSchema,
  createdAt: z.string().optional(),
  note: z.string().optional(),
});
export type ExportRecord = z.infer<typeof ExportRecordSchema>;
