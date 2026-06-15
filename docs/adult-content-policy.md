# Adult Content Policy

## Overview

StoryGen supports publishable adult-content projects. Policy rules are enforced
in the schema at parse time — not as advisory warnings, but as hard validation
failures. A project that violates these rules cannot be marked publishable.

---

## Publishable Project Requirements

When `ProjectPolicy.publishable` is `true`, `ProjectSchema`'s `superRefine`
refinement enforces all of the following. Violation throws a Zod validation error
with a typed path.

### 1. Age gate (`policy.ageGate`)

`ProjectPolicy.ageGate` must be `true`. The publishing surface is responsible for
presenting and enforcing the age gate before any project content is accessible.

### 2. All-characters-18+ assertion (`policy.allCharacters18Plus`)

`ProjectPolicy.allCharacters18Plus` must be `true`. This is an explicit
author-level assertion. It is reinforced structurally: `CharacterSchema` sets a
`z.number().int().min(18)` constraint on `Character.age` — schema parsing rejects
any character with `age < 18` regardless of policy flags.

### 3. No real-person likeness or voice cloning (`policy.allowsRealPersonLikeness`)

`ProjectPolicy.allowsRealPersonLikeness` must be `false` for publishable
projects. Likeness or voice cloning of real persons requires explicit, documented
consent. Projects claiming such consent must not set `publishable: true` until
consent documentation is reviewed.

### 4. Asset provenance (`AssetSchema` refinement)

Canon assets (`AssetStatus` of `"approved"` or `"locked"`) must carry a full
`AssetProvenance` record (model, checkpoint, prompt, negativePrompt, seed, width,
height, referenceAssetIds, controlInputs, adapters, workflowId, parentRecipeId)
**or** carry `status: "uploaded_manual"`. `AssetSchema`'s `superRefine`
refinement throws if an approved/locked asset has no provenance and is not
`uploaded_manual`. There is no silent acceptance of unsourced canon art.

---

## Reader: Static Assets Only

`apps/reader` renders **pre-generated, static assets only**. There is no live
image or audio generation inside the reader. The compiled `WebManifest` references
asset IDs; the reader resolves them from the `AssetManifestEntry` list embedded in
the manifest. Real generation happens in `apps/api` via `GenerationJob` + the
`storygen-generation` mock runner (real adapters deferred) — well before the story
is compiled and published.

---

## Where Enforcement Lives

| Rule | Enforcement surface |
| ---- | ------------------- |
| `ageGate` required for publishable | `ProjectSchema` `superRefine` in `entities.ts` |
| `allCharacters18Plus` required for publishable | `ProjectSchema` `superRefine` in `entities.ts` |
| `allowsRealPersonLikeness` must be false for publishable | `ProjectSchema` `superRefine` in `entities.ts` |
| `Character.age >= 18` | `CharacterSchema.age` min constraint in `entities.ts` |
| Canon asset requires provenance or `uploaded_manual` | `AssetSchema` `superRefine` in `assets.ts` |
| Static assets only in reader | `apps/reader` architecture — no generation calls |

All enforcement is in `packages/storygen-schema/src/` (`entities.ts`,
`assets.ts`, `policy.ts`). Policy fields are defined in `ProjectPolicySchema`
(exported from `policy.ts`). Tests that verify these constraints live in
`packages/storygen-schema/src/__tests__/`.
