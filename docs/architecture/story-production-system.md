# Story Production System — Architecture

## 1. Source of Truth

The canonical story database is the single source of truth. Everything else —
engines, models, editors, exporters — is an **adapter** behind a typed boundary.
Never bake engine specifics into the schema.

### The `Project` aggregate

```
Project
  policy: ProjectPolicy           ← publishable/age-gate/18+ assertions
  world: StoryWorld               ← canon entities shared across all stories
    characters[]                  ← Character (age min 18, appearanceLocks, outfits)
    relationships[]
    locations[]
    props[]
    loreFacts[]
    plotThreads[]
    entityLinks[]                 ← Kanka-style cross-entity relationships
    assets[]                      ← Asset (provenance required for approved/locked)
  stories[]                       ← Story (min 1)
    chapters[]                    ← Chapter / Episode (alias)
      scenes[]
        beats[]                   ← Beat discriminated union (the spine)
    scenePlotLinks[]              ← novelibre plot-grid: scene ↔ plotThread
  variables[]
  generationJobs[]
  exports[]                       ← ExportRecord (web | renpy | ink)
```

**Key domain types** (all Zod schemas in `packages/storygen-schema/src/`):
`ProjectSchema`, `StoryWorldSchema`, `StorySchema`, `ChapterSchema`,
`SceneSchema`, `BeatSchema`, `CharacterSchema`, `RelationshipSchema`,
`LocationSchema`, `PropSchema`, `LoreFactSchema`, `PlotThreadSchema`,
`ScenePlotLinkSchema`, `EntityLinkSchema`, `AssetSchema`, `GenerationJobSchema`,
`ExportRecordSchema`, `WorldStateSnapshotSchema`, `ProjectPolicySchema`.

---

## 2. The Beat Union — Spine of the Data Model

`Beat` is a Zod discriminated union on `kind`:

| `kind`         | Description                                        |
| -------------- | -------------------------------------------------- |
| `narration`    | Narrator text block, optional asset                |
| `dialogue`     | Character speech line with expression / outfit     |
| `choice`       | Player choice; each option carries `target` + optional `setFlags` |
| `state_change` | Absolute flag writes (`set: Record<string, VariableValue>`) |
| `stage`        | Location/character staging directive               |
| `panel_cue`    | Comic/illustration panel description + recipe ref  |
| `asset_event`  | Show/hide/play/stop a named asset on a channel     |
| `jump`         | Unconditional scene/node transfer                  |
| `branch`       | Condition-gated routing with optional `fallback`   |

### Export mapping (one beat → each target)

| Beat kind      | Web `RuntimeBeat`          | Ren'Py                         | Ink                         | Comic panel          | Image prompt              | TTS line                |
| -------------- | -------------------------- | ------------------------------ | --------------------------- | -------------------- | ------------------------- | ----------------------- |
| `narration`    | `{kind:"narration",text}`  | `narrator "…"`                 | `=== narration ===` / text  | Caption box          | Scene description         | Read as narrator voice  |
| `dialogue`     | `{kind:"dialogue",speaker,text}` | `Character "…"` / `show expression` | `Speaker: text`      | Speech bubble        | Character close-up prompt | Character TTS voice     |
| `choice`       | `{kind:"choice",options[]}` | `menu:` block                 | `* [Option text] -> target` | —                    | —                         | —                       |
| `state_change` | `{kind:"set",set}`         | `$ var = value`                | `VAR flag = value`          | —                    | —                         | —                       |
| `stage`        | *(filtered out)*           | `scene bg` / `show character`  | *(comment/directive)*       | Panel staging note   | Background/character cue  | —                       |
| `panel_cue`    | *(filtered out)*           | *(comment)*                    | *(comment)*                 | Rendered panel       | Full panel image prompt   | —                       |
| `asset_event`  | *(filtered out)*           | `play music` / `show sprite`   | *(comment)*                 | —                    | —                         | Audio/sfx event         |
| `jump`         | `{kind:"jump",target}`     | `jump label`                   | `-> knot`                   | Page turn arrow      | —                         | —                       |
| `branch`       | *(pre-evaluated to `jump`)* | `if/elif` block               | `{ flag: -> knot }`         | —                    | —                         | —                       |

**v1 reader subset**: the `storygen-player` web reader renders
`narration | dialogue | choice | jump` (plus the compiled `set` variant of
`state_change`). All other beat kinds are handled by the compiler before the
manifest reaches the player.

The compiled contract is `RuntimeBeat` (in `compiled.ts`), which includes a
`set` kind (flattened from `state_change`) to keep the runtime schema minimal.

---

## 3. Adapter Boundaries and Package Map

### Packages

| Package | Role |
| ------- | ---- |
| `@ch5me/storygen-schema` | Zod schemas, inferred TS types, Drizzle table defs — the universal dependency. Exports `ProjectSchema`, `BeatSchema`, `WebManifestSchema`, `RuntimeBeatSchema`, `WorldStateSnapshotSchema`, `ProjectPolicySchema`, etc. |
| `@ch5me/storygen-compiler` | Canonical `Project` → `WebManifest` (player JSON), Ren'Py `.rpy`, Ink-compatible output. Deterministic; no runtime state. |
| `@ch5me/storygen-continuity` | Canon/state/branch linter driven by `WorldStateSnapshot`. Detects wardrobe drift, appearance-lock mismatch, missing route targets, fact contradictions, plot-thread orphans. |
| `@ch5me/storygen-prompt-compiler` | Character/location/stage metadata → image prompt + negative prompt recipes. Locked appearance fields land in explicit preserve/do-not-change sections. Tracery seeded text. |
| `@ch5me/storygen-generation` | Provider job contract (`GenerationJob`, `GenRecipe`) + mock runner. Real adapters (ComfyUI/Diffusers/Scenario/TTS) deferred behind the same typed interface. |
| `@ch5me/storygen-player` | Reusable React web-reader primitives. Renders v1 beats. PixiVN adapter boundary stubbed for v2. |
| `@ch5me/storygen-research` | Normalized notes on external tools; machine-readable research linked from `docs/research/`. |

### Apps

| App | Role |
| --- | ---- |
| `apps/api` | Hono + Cloudflare Workers. `StorageAdapter` boundary: in-memory first, D1/R2 wired later. Validates all request/response bodies against `storygen-schema`. |
| `apps/studio` | Vite + React 19 authoring surface (Story Map, Scene Editor, Bibles, Asset Lab, Preview). Talks to `apps/api`. |
| `apps/reader` | Vite + React 19 runtime. Loads a compiled `WebManifest`; renders v1 beat subset with static/pre-generated assets only. |

### Data-flow diagram

```
Author (studio)
      |
      v CRUD beats / entities
  apps/api  <-- canonical Project DB (in-memory now, D1 later)
      |
      +---> storygen-continuity  (lint WorldStateSnapshot, emit errors/warnings)
      |
      +---> storygen-compiler  ──┬──> WebManifest ──> storygen-player / apps/reader
      |                          ├──> .rpy           (Ren'Py)
      |                          └──> .ink           (Ink / inkjs)
      |
      +---> storygen-prompt-compiler  ──> image prompt + negative prompt
      |
      +---> storygen-generation  ──> GenerationJob ──> mock runner
                                                        (real adapters deferred)
```

Build order is enforced by Turbo: all packages `dependsOn: ^build`, so
`storygen-schema` dist exists before any consumer typechecks.

---

## 4. CH5 Doctrine Applied

### Canonical DB is the only source of truth

`Project` in `apps/api` is the authoritative state. The compiler, continuity
checker, prompt compiler, and generation runner are read-only consumers that
never mutate canonical data. Editors write back through `apps/api` endpoints;
export artifacts are derived, never authoritative.

### Fail fast — no reflexive fallbacks

Selecting the D1 storage adapter without a D1 binding **throws a typed error
naming the missing precondition**. It never silently falls back to in-memory.
This is enforced at adapter-construction time in `apps/api`. The rule applies
everywhere: missing `WorldStateSnapshot` → throw; missing provenance on a canon
asset → `AssetSchema` refinement throws at parse time (not at export time).

### Everything scripted, idempotent, self-healing

`pnpm install` + `pnpm typecheck` + `pnpm test` must be reproducible from a
clean checkout. `apps/api` boots locally without real D1/R2 bindings. Seed data
is programmatic (not hand-crafted SQL). Setup scripts detect and fix
prerequisites; no manual box-patching.

### Storage adapter boundary

`StorageAdapter` is a typed interface in `apps/api`. The in-memory implementation
is complete and correct for local development. The D1 adapter is stubbed and will
be wired when a D1 binding is present. Code that calls the adapter never knows
which implementation it has — adapters are injected at startup.

---

## 5. Deferred / v2

All deferred features sit behind their typed adapter or stub boundary. Adding a
real adapter requires only an implementation — no schema or contract changes.

| Feature | Boundary today |
| ------- | -------------- |
| PixiVN renderer | Stub in `storygen-player` (explicit adapter seam) |
| Real generation (ComfyUI / Diffusers / Scenario / TTS) | Mock runner in `storygen-generation` |
| Twine / Yarn import-export | `storygen-compiler` import adapter (not wired) |
| Godot / Dialogic export | `storygen-compiler` export adapter (not wired) |
| EPUB / PDF / comic export | `storygen-compiler` export adapter (not wired) |
| D1 / R2 storage | `StorageAdapter` stub in `apps/api` |
