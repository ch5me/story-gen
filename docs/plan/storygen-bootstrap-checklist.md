# StoryGen Bootstrap — Implementation Checklist

Canonical, checkbox-driven plan for bootstrapping the StoryGen monorepo as a
CH5-style pnpm/turbo workspace. Designed to be executed by a parallel agent
swarm. Each `[ ]` is a discrete, verifiable unit of work. Agents check items off
as they land them.

> **STATUS: COMPLETE (first slice).** Built by the agent swarm in waves A→D.
> Full-graph `turbo typecheck + test + build` is green (30/30 tasks; 87 tests).
> All three apps boot live (api :48787 health+compile, studio :45180, reader
> :45181). Commits on `main`: `1df81c7` (A), `fb5ff4d` (B), `1dec786` (C), +
> this finalization. Verify anytime with `bash scripts/smoke-acceptance.sh`.

> Goal doc (source of truth): `.sisyphus/goals/current-goal.md`
> This file is the detailed work breakdown the swarm drives against.

---

## 0. Locked Decisions (do not re-litigate)

- [x] Repo root: `/Users/hassoncs/src/ch5/story-gen` (CH5-convention location).
- [x] App shape: fuller 3-app — `apps/studio`, `apps/api`, `apps/reader`.
- [x] Package scope: `@ch5me/storygen-*` (CH5-standard `@ch5me/<repo>-<pkg>`).
- [x] Stack: pnpm + turbo + devmux + hush; Vite + React 19; Hono + Cloudflare
      Workers (wrangler) + D1/R2; Drizzle ORM; Zod; Vitest; React Flow.
- [x] Embedded external libs in v1: `inkjs` + `tracery-grammar` only. Every other
      referenced tool is research/docs (ideas/schema/UX only) until a documented
      license-compatible adoption decision.
- [x] Source of truth = canonical story database. Engines, models, editors,
      exporters are adapters behind typed boundaries.
- [x] Package manager pin: `pnpm@10.11.0` (current CH5 standard; supersedes the
      plan's "11.x"). `.nvmrc` matches CH5 (Node 22).
- [x] No nested repo copies / gitlinks. Recreate clean structure; borrow CH5
      config *shape* only.

---

## 1. Swarm Decomposition (dependency waves)

Run with maximum parallelism. Items inside a wave are independent; later waves
depend on earlier ones. Use worktree isolation only where agents would write the
same files.

- **Wave A — Foundation (gates everything, keep tight):**
  - Root workspace scaffold (§2)
  - `@ch5me/storygen-schema` (§4.1) — the universal dependency
- **Wave B — Domain packages + docs (wide parallel, depend on schema):**
  - compiler (§4.2), continuity (§4.3), prompt-compiler (§4.4),
    generation (§4.5), player (§4.6), research (§4.7)
  - seed sample project (§6)
  - research docs (§7) + architecture doc (§7) — fully independent, start at T0
- **Wave C — Apps (depend on packages):**
  - `apps/api` (§3.2), `apps/studio` (§3.1), `apps/reader` (§3.3)
- **Wave D — Integration, verify, land (serial, after C):**
  - Acceptance gate (§8), Tests green (§9), AGENTS.md finalize (§2),
    clean initial commit (§10)

---

## 2. Root Workspace Scaffold (Wave A)

- [x] `package.json` — name `storygen-monorepo`, `private: true`,
      `packageManager: "pnpm@10.11.0"`, workspaces via pnpm.
- [x] Scripts: `dev` (`devmux ensure studio`), `dev:studio`, `dev:api`,
      `dev:reader`, `build` (`turbo run build`), `typecheck`, `test`, `lint`,
      `svc:status`, `svc:attach`, `svc:stop`, `hush`, `hush:status`.
- [x] `pnpm-workspace.yaml` — `apps/*`, `packages/*`.
- [x] `turbo.json` — pipelines for `build`, `typecheck`, `test`, `lint`, `dev`
      with correct `dependsOn`/`outputs` per CH5 reference (folio-db/boybowls).
- [x] `tsconfig.base.json` — strict, `paths` for `@ch5me/storygen-*`, NodeNext/
      bundler resolution as appropriate.
- [x] `.nvmrc` — match CH5 (Node 22).
- [x] `.gitignore` — CH5 standard (node_modules, dist, .turbo, .wrangler, .dev.vars,
      .env*, coverage). **Add narrow unignore so the goal doc commits:**
      `!.sisyphus/goals/` and `!.sisyphus/goals/current-goal.md`.
- [x] `.hush.template` — placeholders only (no live values); stage-split
      `dev`/`staging`/`prod` target convention documented.
- [x] `README.md` — what StoryGen is, quickstart, app map, script reference.
- [x] `AGENTS.md` — tight CH5-style: repo map, canonical-DB/adapters doctrine,
      fail-fast/no-fallback rule, scripted/idempotent setup, hush usage, devmux
      usage, embed-vs-study licensing rule, beat-union reference. *(Draft early;
      finalize in Wave D once structure is real.)*
- [x] `pnpm install` resolves the empty workspace with zero errors.

---

## 3. Apps (Wave C)

### 3.1 `apps/studio` — Vite + React 19 authoring app
- [x] Vite + React 19 + TS scaffold; dense editor shell (sidebars + main canvas).
- [x] **Story Map**: React Flow scene graph — routes, choices, missing-asset
      badges, continuity-error badges.
- [x] **Scene Editor**: beat-list editor; screenplay/VN blocks; inline
      character / expression / outfit selectors; plot-grid strip showing threads
      touched by the current scene.
- [x] **Character Bible**: canon fields, reference assets, appearance locks,
      relationship variables, speech style, generation settings.
- [x] **World Bible**: Kanka/Fantasia-style entity browser (characters,
      locations, props, lore, events, organizations) with editable cross-links.
- [x] **Asset Lab**: manual upload + mock generation; candidate gallery;
      approve/lock asset; regenerate-from-recipe placeholders.
- [x] **Preview**: embedded `@ch5me/storygen-player` plays the compiled current
      story; Inky-style instant playtest loop.
- [x] Talks to `apps/api` for CRUD + compile; renders the seeded project on load.

### 3.2 `apps/api` — Hono + Cloudflare Workers
- [x] Hono app on Workers; `wrangler.toml` with D1 + R2 bindings declared.
- [x] In-memory storage adapter first (typed `StorageAdapter` boundary; D1
      adapter stubbed behind same interface — fail-fast, no silent fallback).
- [x] D1 schema + migration files present (Drizzle), not required for local proof.
- [x] R2 asset binding declared; not required for first local proof.
- [x] Endpoints:
  - [x] `GET /health`
  - [x] `GET /projects`
  - [x] `POST /projects`
  - [x] `GET /projects/:projectId`
  - [x] `PUT /projects/:projectId`
  - [x] `POST /projects/:projectId/compile` → web manifest (+ optional renpy/ink)
  - [x] `POST /projects/:projectId/seed` → installs seeded sample project
  - [x] `POST /projects/:projectId/generation-jobs` → enqueue mock job
  - [x] `GET /generation-jobs/:jobId`
- [x] All request/response bodies validated against `@ch5me/storygen-schema`.

### 3.3 `apps/reader` — Vite + React runtime
- [x] Vite + React 19 + TS runtime that loads a compiled story manifest.
- [x] Renders v1 beats: `narration`, `dialogue`, `choice`, `jump`.
- [x] Advances dialogue; selects a route at the choice; applies state changes.
- [x] Static/pre-generated assets only (no live explicit generation in reader).

---

## 4. Packages (Wave A/B)

### 4.1 `@ch5me/storygen-schema` (Wave A — universal dependency)
- [x] Zod schemas + inferred TS types + Drizzle table defs (D1-first, portable
      to Postgres later).
- [x] Core hierarchy: `Project → StoryWorld → Stories → Chapters/Episodes →
      Scenes → Beats`.
- [x] StoryWorld owns: Characters, Relationships, Locations, Props, Outfits,
      LoreFacts, Assets, GenerationJobs, Exports.
- [x] **Beat discriminated union**: `narration | dialogue | choice | state_change
      | stage | panel_cue | asset_event | jump | branch`. All types validate and
      round-trip; renderer only needs the v1 subset.
- [x] Supporting types: `ChoiceOption`, variables, conditions, `GenRecipe`,
      `StylePreset`.
- [x] `WorldStateSnapshot`: route flags, relationship values, wardrobe, location,
      known facts, present characters, approved assets.
- [x] Character canon: appearance locks, forbidden changes, outfits, poses,
      expressions, speech style, route role, references, model settings.
- [x] Optional deep bibisco/Manuskript-style character metadata (non-blocking).
- [x] Plot grid: `plot_threads` + `scene_plot_links` (novelibre-style).
- [x] Generic `entity_links` table (Kanka-style relationships across entities).
- [x] Asset provenance: model/checkpoint, prompt, negative prompt, seed,
      resolution, references, control inputs, adapters, workflow id, parent
      recipe, approval status. Canon asset requires provenance OR explicit
      `uploaded_manual`.
- [x] Publishable-project policy fields: age-gate flag, all-characters-18+
      assertion, no real-person likeness/voice without consent, provenance
      required.

### 4.2 `@ch5me/storygen-compiler` (Wave B)
- [x] Canonical story → **web manifest** (player-ready JSON + asset manifest).
- [x] Canonical story → **Ren'Py `.rpy`** (deterministic output).
- [x] Canonical story → **Ink-compatible** output (knots/choices/variables).
- [x] Deterministic choices/state-changes; no engine lock-in beyond adapters.

### 4.3 `@ch5me/storygen-continuity` (Wave B)
- [x] Canon/state/branch linter driven by `WorldStateSnapshot`s.
- [x] Detects: wardrobe/outfit drift (warning), appearance-lock mismatch (error),
      missing branch/route target (error), known-fact contradiction (error),
      plot-thread orphan (warning).

### 4.4 `@ch5me/storygen-prompt-compiler` (Wave B)
- [x] Compiles character/location/stage metadata → image prompt + negative prompt.
- [x] Locked appearance fields land in explicit preserve / do-not-change sections.
- [x] `tracery-grammar` seeded grammar → repeatable, deterministic text variants.

### 4.5 `@ch5me/storygen-generation` (Wave B)
- [x] Recipe/job types + provider job contract (ComfyUI / Diffusers / Scenario /
      TTS) behind one typed interface.
- [x] Mock runner implemented; real adapters deferred behind the same interface.

### 4.6 `@ch5me/storygen-player` (Wave B)
- [x] Reusable React web-reader primitives; renders v1 beats (narration,
      dialogue, choice, jump).
- [x] Explicit PixiVN adapter boundary stubbed for v2 (no lock-in).

### 4.7 `@ch5me/storygen-research` (Wave B)
- [x] Normalized notes/adapters for external tools: license posture, schema
      ideas, UX patterns (machine-readable + linked from docs in §7).

---

## 5. Embedded External Libraries
- [x] `inkjs` wired into compiler tests / player for flow validation.
- [x] `tracery-grammar` wired into prompt-compiler for seeded text.
- [x] No GPL/source-available code copied into the repo; references are
      idea/schema/UX only (enforced by §7 license notes).

---

## 6. Seeded Sample Project (Wave B)
- [x] Programmatic seed (consumed by `apps/api` `/seed` route + tests).
- [x] Two adult (18+) characters; one location; one plot thread; three scenes.
- [x] Beats include dialogue, narration, image/panel cues, **one choice**, and
      **one state change**; valid against schema + policy fields.

---

## 7. Docs (Wave B — independent, start at T0)
- [x] `docs/research/story-tools.md` — Embed / Fork / Study matrix covering ALL
      supplied research (Twine, Inky, YarnClassic, Arrow, Manuskript, bibisco,
      novelibre, novelWriter, oStorybook, Kanka, Fantasia Archive, Chronicler,
      autonovel, StoryCraftr, RecurrentGPT, Ensemble/social-physics, Yarn Spinner,
      inkjs, Tracery).
- [x] `docs/research/license-notes.md` — "ideas only unless compatible-license
      decision is explicit and documented" rule, per-tool license posture.
- [x] `docs/architecture/story-production-system.md` — canonical DB + adapters
      doctrine; how one beat maps to web event / Ren'Py line/menu / Ink knot /
      comic panel / image prompt / TTS line.
- [x] `docs/adult-content-policy.md` (or section) — age-gate, all-18+, no
      real-person likeness/voice cloning, provenance required, static-assets-only
      reader.

---

## 8. First-Slice Acceptance Gate (Wave D)
- [x] `pnpm install` succeeds.
- [x] `pnpm run typecheck` succeeds.
- [x] `pnpm run test` succeeds.
- [x] `pnpm run dev` starts API + studio + reader (or documented separate
      commands if devmux not fully wired).
- [x] Studio renders the seeded project: Story Map graph draws; Scene Editor
      edits beats; Character/World Bible show canon + entity links.
- [x] Preview plays the compiled story; Reader advances dialogue and chooses a
      route.
- [x] Ren'Py exporter writes deterministic `.rpy`.
- [x] Ink-compatible compiler output validates through `inkjs` where feasible.
- [x] Prompt compiler creates a deterministic panel prompt + negative prompt.
- [x] Continuity checker catches: outfit drift, appearance-lock mismatch, missing
      branch target, fact contradiction.

---

## 9. Tests (Wave D, authored alongside each package)
- **Schema**
  - [x] Sample project parses.
  - [x] Invalid beat rejected.
  - [x] Asset approval without provenance rejected.
  - [x] Publishable adult project requires policy fields.
- **Compiler**
  - [x] Sample → web manifest snapshot.
  - [x] Sample → Ren'Py snapshot.
  - [x] Sample → Ink-compatible output.
  - [x] Choices/state changes deterministic.
- **Continuity**
  - [x] Wardrobe continuity warning.
  - [x] Appearance lock error.
  - [x] Missing route target error.
  - [x] Known-fact contradiction error.
  - [x] Plot-thread orphan warning.
- **Prompt**
  - [x] Character/location/stage metadata compiles into prompt.
  - [x] Locked appearance fields appear in preserve/do-not-change sections.
  - [x] Tracery seeded grammar produces repeatable output.
- **App smoke**
  - [x] Studio renders seeded project.
  - [x] Reader advances and selects route.
  - [x] Preview receives compiled manifest.

---

## 10. Land It (Wave D)
- [x] `git status --short` clean except intended tracked files.
- [x] Coherent initial commit on `main` (conventional message).
- [x] Goal doc + this checklist committed with the work.
- [x] Push (per CH5 default) unless a concrete blocker is reported.
