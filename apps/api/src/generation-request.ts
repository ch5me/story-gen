import { GenRecipeKindSchema, GenRecipeSchema } from '@ch5me/storygen-schema';
import type { GenerationRequest } from '@ch5me/storygen-generation';

export interface ParseSuccess {
  ok: true;
  value: GenerationRequest;
}

export interface ParseFailure {
  ok: false;
  issues: string[];
}

export type ParseResult = ParseSuccess | ParseFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate the `POST /generation-jobs` body into a typed `GenerationRequest`.
 *
 * Built from the canonical exported schemas (`GenRecipeKindSchema`,
 * `GenRecipeSchema`) plus narrow runtime checks for the optional scalar fields,
 * so the app does not depend on `zod` directly or reach into package internals.
 * Fails loud: a malformed body returns a list of human-readable issues rather
 * than a silently coerced request.
 */
export function parseGenerationJobRequest(body: unknown): ParseResult {
  if (!isRecord(body)) {
    return { ok: false, issues: ['Body must be a JSON object'] };
  }

  const issues: string[] = [];

  const kindResult = GenRecipeKindSchema.safeParse(body.kind);
  if (!kindResult.success) {
    issues.push('Field "kind" must be one of character | location | panel | cg | voice');
  }

  let recipe: GenerationRequest['recipe'];
  if (body.recipe !== undefined) {
    const recipeResult = GenRecipeSchema.safeParse(body.recipe);
    if (recipeResult.success) {
      recipe = recipeResult.data;
    } else {
      issues.push('Field "recipe" is not a valid GenRecipe');
    }
  }

  const prompt = body.prompt;
  if (prompt !== undefined && typeof prompt !== 'string') {
    issues.push('Field "prompt" must be a string');
  }

  const negativePrompt = body.negativePrompt;
  if (negativePrompt !== undefined && typeof negativePrompt !== 'string') {
    issues.push('Field "negativePrompt" must be a string');
  }

  const seed = body.seed;
  if (seed !== undefined && (typeof seed !== 'number' || !Number.isFinite(seed))) {
    issues.push('Field "seed" must be a finite number');
  }

  if (!kindResult.success || issues.length > 0) {
    return { ok: false, issues };
  }

  const value: GenerationRequest = { kind: kindResult.data };
  if (recipe !== undefined) value.recipe = recipe;
  if (typeof prompt === 'string') value.prompt = prompt;
  if (typeof negativePrompt === 'string') value.negativePrompt = negativePrompt;
  if (typeof seed === 'number') value.seed = seed;

  return { ok: true, value };
}
