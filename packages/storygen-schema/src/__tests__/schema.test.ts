import { describe, expect, it } from 'vitest';
import { AssetSchema, BeatSchema, ProjectSchema, sampleProject } from '../index';

describe('storygen-schema', () => {
  it('parses the seeded sample project', () => {
    expect(ProjectSchema.safeParse(sampleProject).success).toBe(true);
  });

  it('rejects an invalid (incomplete) beat', () => {
    expect(BeatSchema.safeParse({ id: 'x', kind: 'dialogue' }).success).toBe(false);
  });

  it('rejects an approved asset without provenance', () => {
    const result = AssetSchema.safeParse({ id: 'a1', kind: 'image', status: 'approved' });
    expect(result.success).toBe(false);
  });

  it('accepts an uploaded_manual asset without provenance', () => {
    const result = AssetSchema.safeParse({ id: 'a2', kind: 'image', status: 'uploaded_manual' });
    expect(result.success).toBe(true);
  });

  it('requires policy fields for a publishable project', () => {
    const bad = { ...sampleProject, policy: { ...sampleProject.policy, ageGate: false } };
    expect(ProjectSchema.safeParse(bad).success).toBe(false);
  });
});
