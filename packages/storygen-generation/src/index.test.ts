import { describe, expect, it } from 'vitest';
import { AssetSchema } from '@ch5me/storygen-schema';

import {
  ComfyUIProvider,
  type GenerationRequest,
  KokoroTtsProvider,
  MockGenerationProvider,
  assetKindForRecipeKind,
} from './index';

const sampleRequest: GenerationRequest = {
  kind: 'character',
  prompt: 'a determined courier on a rooftop at dusk',
  negativePrompt: 'blurry, extra limbs',
  seed: 42,
};

describe('MockGenerationProvider', () => {
  it('is deterministic: same request -> same jobId + asset, twice', async () => {
    const provider = new MockGenerationProvider();

    const first = await provider.submit(sampleRequest);
    const second = await provider.submit({ ...sampleRequest });

    expect(first.jobId).toBe(second.jobId);
    expect(first.asset).toEqual(second.asset);
  });

  it('submit resolves status "succeeded" with a placeholder Asset', async () => {
    const provider = new MockGenerationProvider();

    const result = await provider.submit(sampleRequest);

    expect(result.status).toBe('succeeded');
    expect(result.error).toBeUndefined();
    expect(result.asset).toBeDefined();

    const asset = result.asset!;
    expect(asset.kind).toBe('image');
    expect(asset.status).toBe('candidate');
    expect(asset.url).toBe(`mock://asset/${result.jobId}`);
    expect(asset.provenance).toMatchObject({
      model: 'mock',
      prompt: sampleRequest.prompt,
      seed: sampleRequest.seed,
    });

    // The produced asset must be a structurally valid schema Asset.
    expect(() => AssetSchema.parse(asset)).not.toThrow();
  });

  it('submit then get returns the same succeeded result with the asset', async () => {
    const provider = new MockGenerationProvider();

    const submitted = await provider.submit(sampleRequest);
    const fetched = await provider.get(submitted.jobId);

    expect(fetched.status).toBe('succeeded');
    expect(fetched).toEqual(submitted);
    expect(fetched.asset).toEqual(submitted.asset);
  });

  it('get on an unknown jobId fails fast', async () => {
    const provider = new MockGenerationProvider();
    await expect(provider.get('does-not-exist')).rejects.toThrow(/unknown jobId/);
  });

  it('maps recipe kinds onto asset kinds', () => {
    expect(assetKindForRecipeKind('character')).toBe('image');
    expect(assetKindForRecipeKind('location')).toBe('image');
    expect(assetKindForRecipeKind('panel')).toBe('image');
    expect(assetKindForRecipeKind('cg')).toBe('cg');
    expect(assetKindForRecipeKind('voice')).toBe('voice');
  });

  it('produces a voice asset for a voice request', async () => {
    const provider = new MockGenerationProvider();
    const result = await provider.submit({ kind: 'voice', prompt: 'warm narrator', seed: 7 });
    expect(result.asset?.kind).toBe('voice');
  });
});

describe('real adapter stubs (deferred to v2)', () => {
  it('ComfyUIProvider.submit throws fail-fast', async () => {
    const provider = new ComfyUIProvider();
    await expect(provider.submit(sampleRequest)).rejects.toThrow(
      'comfyui adapter not implemented (v2)',
    );
  });

  it('KokoroTtsProvider.submit throws fail-fast', async () => {
    const provider = new KokoroTtsProvider();
    await expect(provider.submit({ kind: 'voice', prompt: 'x', seed: 1 })).rejects.toThrow(
      'kokoro-tts adapter not implemented (v2)',
    );
  });
});
