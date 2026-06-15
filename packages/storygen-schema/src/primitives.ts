import { z } from 'zod';

/** All ids are non-empty strings. */
export const zId = z.string().min(1);
export type Id = z.infer<typeof zId>;

/** A value that can be stored in world state / flags. */
export const VariableValueSchema = z.union([z.string(), z.number(), z.boolean()]);
export type VariableValue = z.infer<typeof VariableValueSchema>;

export const VariableTypeSchema = z.enum(['string', 'number', 'boolean']);
export type VariableType = z.infer<typeof VariableTypeSchema>;

/** A declared story variable with an initial value. */
export const VariableSchema = z.object({
  key: z.string().min(1),
  type: VariableTypeSchema,
  initial: VariableValueSchema,
  label: z.string().optional(),
});
export type Variable = z.infer<typeof VariableSchema>;

export const ConditionOpSchema = z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte']);
export type ConditionOp = z.infer<typeof ConditionOpSchema>;

/** A boolean test against a single variable, used by branch/choice gating. */
export const ConditionSchema = z.object({
  variable: z.string().min(1),
  op: ConditionOpSchema,
  value: VariableValueSchema,
});
export type Condition = z.infer<typeof ConditionSchema>;

/** Evaluate a condition against a flat flag map. Deterministic, no fallbacks. */
export function evaluateCondition(
  condition: Condition,
  flags: Record<string, VariableValue>,
): boolean {
  const actual = flags[condition.variable];
  const expected = condition.value;
  switch (condition.op) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'gt':
      return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
    case 'gte':
      return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
    case 'lt':
      return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
    case 'lte':
      return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
    default: {
      const exhaustive: never = condition.op;
      throw new Error(`Unknown condition op: ${String(exhaustive)}`);
    }
  }
}
