import { z } from 'zod';

/**
 * Project-level content policy. Publishable projects must satisfy the adult
 * content rules (enforced by ProjectSchema's refinement).
 */
export const ProjectPolicySchema = z.object({
  ageGate: z.boolean().default(false),
  allCharacters18Plus: z.boolean().default(false),
  allowsRealPersonLikeness: z.boolean().default(false),
  publishable: z.boolean().default(false),
});
export type ProjectPolicy = z.infer<typeof ProjectPolicySchema>;
