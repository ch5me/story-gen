import { z } from 'zod';
import { VariableSchema, zId } from './primitives';
import { BeatSchema } from './beats';
import { AssetSchema, ExportRecordSchema, GenerationJobSchema } from './assets';
import { ProjectPolicySchema } from './policy';

export const ModelSettingsSchema = z.object({
  model: z.string().optional(),
  recipeId: zId.optional(),
  seed: z.number().int().optional(),
});
export type ModelSettings = z.infer<typeof ModelSettingsSchema>;

export const OutfitSchema = z.object({
  id: zId,
  name: z.string(),
  description: z.string().optional(),
  assetId: zId.optional(),
});
export type Outfit = z.infer<typeof OutfitSchema>;

/** A locked appearance attribute that must not drift across the story. */
export const AppearanceLockSchema = z.object({
  field: z.string(),
  value: z.string(),
  locked: z.boolean().default(true),
});
export type AppearanceLock = z.infer<typeof AppearanceLockSchema>;

export const CharacterSchema = z.object({
  id: zId,
  name: z.string(),
  /** All characters are 18+ (enforced). */
  age: z.number().int().min(18),
  role: z.string().optional(),
  speechStyle: z.string().optional(),
  appearance: z.string().optional(),
  appearanceLocks: z.array(AppearanceLockSchema).default([]),
  forbiddenChanges: z.array(z.string()).default([]),
  outfits: z.array(OutfitSchema).default([]),
  poses: z.array(z.string()).default([]),
  expressions: z.array(z.string()).default([]),
  referenceAssetIds: z.array(zId).default([]),
  relationshipVars: z.record(z.string(), z.number()).default({}),
  modelSettings: ModelSettingsSchema.optional(),
  /** Optional bibisco/Manuskript-style deep metadata; non-blocking. */
  deepProfile: z.record(z.string(), z.unknown()).optional(),
});
export type Character = z.infer<typeof CharacterSchema>;

export const RelationshipSchema = z.object({
  id: zId,
  fromCharacterId: zId,
  toCharacterId: zId,
  kind: z.string(),
  value: z.number().optional(),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

export const LocationSchema = z.object({
  id: zId,
  name: z.string(),
  description: z.string().optional(),
  assetId: zId.optional(),
});
export type Location = z.infer<typeof LocationSchema>;

export const PropSchema = z.object({
  id: zId,
  name: z.string(),
  description: z.string().optional(),
  assetId: zId.optional(),
});
export type Prop = z.infer<typeof PropSchema>;

export const LoreFactSchema = z.object({
  id: zId,
  statement: z.string(),
  tags: z.array(z.string()).default([]),
  canon: z.boolean().default(true),
});
export type LoreFact = z.infer<typeof LoreFactSchema>;

export const PlotThreadSchema = z.object({
  id: zId,
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
});
export type PlotThread = z.infer<typeof PlotThreadSchema>;

/** novelibre-style plot-grid link: which plot thread a scene touches. */
export const ScenePlotLinkSchema = z.object({
  id: zId,
  sceneId: zId,
  plotThreadId: zId,
  note: z.string().optional(),
});
export type ScenePlotLink = z.infer<typeof ScenePlotLinkSchema>;

export const EntityKindSchema = z.enum([
  'character',
  'location',
  'prop',
  'lore',
  'event',
  'organization',
  'outfit',
  'asset',
]);
export type EntityKind = z.infer<typeof EntityKindSchema>;

/** Generic Kanka-style relationship between any two world entities. */
export const EntityLinkSchema = z.object({
  id: zId,
  fromType: EntityKindSchema,
  fromId: zId,
  toType: EntityKindSchema,
  toId: zId,
  relation: z.string(),
  note: z.string().optional(),
});
export type EntityLink = z.infer<typeof EntityLinkSchema>;

/** The world owns canon entities shared across all stories. */
export const StoryWorldSchema = z.object({
  id: zId,
  name: z.string(),
  characters: z.array(CharacterSchema).default([]),
  relationships: z.array(RelationshipSchema).default([]),
  locations: z.array(LocationSchema).default([]),
  props: z.array(PropSchema).default([]),
  loreFacts: z.array(LoreFactSchema).default([]),
  plotThreads: z.array(PlotThreadSchema).default([]),
  entityLinks: z.array(EntityLinkSchema).default([]),
  assets: z.array(AssetSchema).default([]),
});
export type StoryWorld = z.infer<typeof StoryWorldSchema>;

export const SceneSchema = z.object({
  id: zId,
  title: z.string(),
  summary: z.string().optional(),
  locationId: zId.optional(),
  beats: z.array(BeatSchema).default([]),
  /** Default next scene when control falls through the last beat. */
  next: zId.optional(),
});
export type Scene = z.infer<typeof SceneSchema>;

export const ChapterSchema = z.object({
  id: zId,
  title: z.string(),
  scenes: z.array(SceneSchema).default([]),
});
export type Chapter = z.infer<typeof ChapterSchema>;

/** Episode is an alias of Chapter for episodic stories. */
export const EpisodeSchema = ChapterSchema;
export type Episode = Chapter;

export const StorySchema = z.object({
  id: zId,
  title: z.string(),
  chapters: z.array(ChapterSchema).default([]),
  scenePlotLinks: z.array(ScenePlotLinkSchema).default([]),
  startSceneId: zId,
});
export type Story = z.infer<typeof StorySchema>;

/** The top-level canonical project. */
export const ProjectSchema = z
  .object({
    id: zId,
    name: z.string(),
    createdAt: z.string().optional(),
    world: StoryWorldSchema,
    stories: z.array(StorySchema).min(1),
    startStoryId: zId,
    variables: z.array(VariableSchema).default([]),
    generationJobs: z.array(GenerationJobSchema).default([]),
    exports: z.array(ExportRecordSchema).default([]),
    policy: ProjectPolicySchema.default({}),
  })
  .superRefine((project, ctx) => {
    if (!project.policy.publishable) return;
    if (!project.policy.ageGate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Publishable project requires ageGate.',
        path: ['policy', 'ageGate'],
      });
    }
    if (!project.policy.allCharacters18Plus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Publishable project requires the all-characters-18+ assertion.',
        path: ['policy', 'allCharacters18Plus'],
      });
    }
    if (project.policy.allowsRealPersonLikeness) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Publishable project may not allow real-person likeness/voice without consent.',
        path: ['policy', 'allowsRealPersonLikeness'],
      });
    }
  });
export type Project = z.infer<typeof ProjectSchema>;
