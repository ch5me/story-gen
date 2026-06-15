# Integrating a Character-Generation System with StoryGen

This guide is for a team that already builds **consistent character generation**
(characters, descriptions, reference images, a generation pipeline) and wants to
plug it into StoryGen. It explains exactly where your work connects, using the
real schema field names, and ends with the **questions we need answered** to
wire it up.

> TL;DR — StoryGen already has the *seams* for this: a `Character` canon model, an
> `Asset` + `AssetProvenance` model, a `GenRecipe`/`StylePreset` model, a typed
> `GenerationProvider` boundary (currently a mock), and a `prompt-compiler` that
> turns character canon into image prompts with a locked-appearance "preserve"
> block. Your system becomes (a) a real `GenerationProvider` adapter and (b) a
> source of `Character` + reference `Asset` records.

---

## The relevant data model (canonical, in `@ch5me/storygen-schema`)

Source: `packages/storygen-schema/src/{entities,assets}.ts`.

### `Character` — the canon record your character data maps onto
```
Character {
  id, name, age (>= 18 enforced),
  role?, speechStyle?, appearance?,            // free-text identity
  appearanceLocks: { field, value, locked }[], // attributes that must NEVER drift
  forbiddenChanges: string[],                  // e.g. ["hair_color","scar"]
  outfits:    { id, name, description?, assetId? }[],
  poses:      string[],
  expressions:string[],
  referenceAssetIds: string[],                 // reference images (see Asset)
  relationshipVars:  Record<string, number>,
  modelSettings?: { model?, recipeId?, seed? }, // YOUR consistency knobs live here
  deepProfile?: Record<string, unknown>,        // open bag for your richer fields
}
```
`appearanceLocks` + `forbiddenChanges` are the heart of *consistency*: they declare
what the renderer/generator must hold fixed. `modelSettings` is the per-character
hook for a checkpoint / LoRA / seed.

### `Asset` + `AssetProvenance` — generated images and how they were made
```
Asset { id, kind: 'image'|'sprite'|'cg'|'audio'|'voice'|'background',
        url?, status: 'placeholder'|'candidate'|'approved'|'locked'|'uploaded_manual',
        provenance?: AssetProvenance, caption?, recipeId? }

AssetProvenance { model, checkpoint?, prompt, negativePrompt?, seed, width, height,
                  referenceAssetIds: string[], controlInputs: string[],
                  adapters: string[], workflowId?, parentRecipeId? }
```
Policy: a **canon** asset (`approved`/`locked`) MUST carry `provenance` (or be
explicitly `uploaded_manual`). `adapters`/`controlInputs` are where LoRA / IP-Adapter
/ ControlNet usage gets recorded.

### `GenRecipe` / `StylePreset` — reusable generation settings
```
GenRecipe   { id, name, kind:'character'|'location'|'panel'|'cg'|'voice',
              basePrompt?, negativePrompt?, stylePresetId?, model?, seed?, width?, height? }
StylePreset { id, name, positive?, negative?, model? }
```

---

## The generation boundary (`@ch5me/storygen-generation`)

This is the seam your pipeline implements. Today it ships `MockGenerationProvider`;
`ComfyUIProvider` / `KokoroTtsProvider` are fail-fast stubs.

```ts
interface GenerationProvider {
  readonly name: string;
  submit(req: GenerationRequest): Promise<GenerationResult>;
  get(jobId: string): Promise<GenerationResult>;
}
interface GenerationRequest { kind: GenRecipeKind; recipe?: GenRecipe; prompt?: string; negativePrompt?: string; seed?: number; }
interface GenerationResult  { jobId: string; status: 'queued'|'running'|'succeeded'|'failed'; asset?: Asset; error?: string; }
```
**Your integration = a class implementing `GenerationProvider`** that calls your
pipeline in `submit()` and returns an `Asset` (with full `AssetProvenance`) in
`get()`/`submit()`. The api wires whichever provider it's given
(`apps/api/src/storage.ts` + `app.ts`), so swapping the mock for yours is a
one-line change once the adapter exists.

## The prompt compiler (`@ch5me/storygen-prompt-compiler`)

```
compileCharacterPrompt(project, characterId) -> { prompt, negativePrompt, preserve }
compilePanelPrompt(project, { sceneId, beatId }) -> { prompt, negativePrompt, preserve }
```
It assembles character canon + location + stage into a prompt and puts every
`appearanceLock` into an explicit **"PRESERVE (do not change): …"** block, returned
as `preserve[]`. If your pipeline takes a positive/negative prompt, this is the
text it should receive; if it uses structured conditioning instead, `preserve[]`
tells you which attributes are non-negotiable.

---

## How your system plugs in (pick what fits)

1. **In-repo adapter (preferred):** implement `GenerationProvider` inside
   `@ch5me/storygen-generation` (e.g. `class YourProvider`) calling your engine
   (ComfyUI graph / Diffusers / hosted API). It receives the compiled prompt +
   `modelSettings`/recipe and returns an `Asset` + `AssetProvenance`.
2. **HTTP service we call:** you expose an HTTP API; we write a thin
   `GenerationProvider` that POSTs to it. Good if your stack is Python/GPU and
   stays out-of-process.
3. **One-time data import:** if you mostly have *finished* characters + approved
   images, we import them as `Character` records + `uploaded_manual`/`approved`
   `Asset`s (with whatever provenance you have). No live generation needed.

Most likely it's (1)+(3): import existing characters, then generate new
panels/expressions/outfits on demand through the adapter.

---

## Questions we need answered to integrate

Please have your team (or your agent) answer these — concretely, with samples:

**A. Character data**
1. What is your character record's shape? Share the schema/TypeScript types or a
   couple of real (sanitized) JSON examples.
2. How do you represent *canon / locked* appearance (the things that must never
   change vs. things that can)? → maps to `appearanceLocks` + `forbiddenChanges`.
3. Do you track outfits, expressions, poses as discrete variants? → `outfits` /
   `expressions` / `poses`.
4. Reference images per character — how many, where stored, what format/size?
   → `referenceAssetIds` + `Asset.url`.
5. Any voice/TTS identity per character? → `Asset.kind = 'voice'`.

**B. Generation pipeline**
6. What engine(s)? (ComfyUI / Diffusers / Fooocus / SDXL / Flux / a hosted API …)
7. What's the call surface — inputs and outputs? Is it sync or job/async (so we
   model `submit`/`get`)?
8. What image sizes/formats do you produce, and where do outputs live (local
   files / a URL / S3 / R2)?

**C. Consistency method (the important one)**
9. How do you keep a character consistent across images? Per-character LoRA /
   DreamBooth? IP-Adapter / reference-image conditioning? Textual-inversion
   embeddings? Fixed seed? ControlNet (pose/face)? Face-restore/swap?
10. What inputs does that method need *per generation* (trigger words, LoRA
    name/weight, reference image ids, control maps, seed)? → these map to
    `modelSettings`, `AssetProvenance.adapters`/`controlInputs`/`referenceAssetIds`.
11. What provenance do you already capture (model, checkpoint, prompt, negative,
    seed, refs, controls, workflow id)? → `AssetProvenance`.

**D. Prompts & integration mode**
12. Do you take positive + negative text prompts? Any weighting/syntax,
    style presets, or required trigger tokens? → `prompt-compiler` + `StylePreset`.
13. Which integration mode (1 / 2 / 3 above) do you want first?
14. Any real-person likeness or voice cloning involved? StoryGen policy forbids
    this without explicit consent and requires all characters be 18+ — confirm
    your data complies (`docs/adult-content-policy.md`).

Answers to A–C let us define the `Character` + `Asset`/`AssetProvenance` mapping
and the `GenerationProvider` contract; D decides the first integration path.
