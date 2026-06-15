# StoryGen Bootstrap — Implementation Checklist

Canonical, checkbox-driven plan for bootstrapping the StoryGen monorepo as a
CH5-style pnpm/turbo workspace. Designed to be executed by a parallel agent
swarm. Each `[ ]` is a discrete, verifiable unit of work. Agents check items off
as they land them.

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

- [ ] `package.json` — name `storygen-monorepo`, `private: true`,
      `packageManager: "pnpm@10.11.0"`, workspaces via pnpm.
- [ ] Scripts: `dev` (`devmux ensure studio`), `dev:studio`, `dev:api`,
      `dev:reader`, `build` (`turbo run build`), `typecheck`, `test`, `lint`,
      `svc:status`, `svc:attach`, `svc:stop`, `hush`, `hush:status`.
- [ ] `pnpm-workspace.yaml` — `apps/*`, `packages/*`.
- [ ] `turbo.json` — pipelines for `build`, `typecheck`, `test`, `lint`, `dev`
      with correct `dependsOn`/`outputs` per CH5 reference (folio-db/boybowls).
- [ ] `tsconfig.base.json` — strict, `paths` for `@ch5me/storygen-*`, NodeNext/
      bundler resolution as appropriate.
- [ ] `.nvmrc` — match CH5 (Node 22).
- [ ] `.gitignore` — CH5 standard (node_modules, dist, .turbo, .wrangler, .dev.vars,
      .env*, coverage). **Add narrow unignore so the goal doc commits:**
      `!.sisyphus/goals/` and `!.sisyphus/goals/current-goal.md`.
- [ ] `.hush.template` — placeholders only (no live values); stage-split
      `dev`/`staging`/`prod` target convention documented.
- [ ] `README.md` — what StoryGen is, quickstart, app map, script reference.
- [ ] `AGENTS.md` — tight CH5-style: repo map, canonical-DB/adapters doctrine,
      fail-fast/no-fallback rule, scripted/idempotent setup, hush usage, devmux
      usage, embed-vs-study licensing rule, beat-union reference. *(Draft early;
      finalize in Wave D once structure is real.)*
- [ ] `pnpm install` resolves the empty workspace with zero errors.

---

## 3. Apps (Wave C)

### 3.1 `apps/studio` — Vite + React 19 authoring app
- [ ] Vite + React 19 + TS scaffold; dense editor shell (sidebars + main canvas).
- [ ] **Story Map**: React Flow scene graph — routes, choices, missing-asset
      badges, continuity-error badges.
- [ ] **Scene Editor**: beat-list editor; screenplay/VN blocks; inline
      character / expression / outfit selectors; plot-grid strip showing threads
      touched by the current scene.
- [ ] **Character Bible**: canon fields, reference assets, appearance locks,
      relationship variables, speech style, generation settings.
- [ ] **World Bible**: Kanka/Fantasia-style entity browser (characters,
      locations, props, lore, events, organizations) with editable cross-links.
- [ ] **Asset Lab**: manual upload + mock generation; candidate gallery;
      approve/lock asset; regenerate-from-recipe placeholders.
- [ ] **Preview**: embedded `@ch5me/storygen-player` plays the compiled current
      story; Inky-style instant playtest loop.
- [ ] Talks to `apps/api` for CRUD + compile; renders the seeded project on load.

### 3.2 `apps/api` — Hono + Cloudflare Workers
- [ ] Hono app on Workers; `wrangler.toml` with D1 + R2 bindings declared.
- [ ] In-memory storage adapter first (typed `StorageAdapter` boundary; D1
      adapter stubbed behind same interface — fail-fast, no silent fallback).
- [ ] D1 schema + migration files present (Drizzle), not required for local proof.
- [ ] R2 asset binding declared; not required for first local proof.
- [ ] Endpoints:
  - [ ] `GET /health`
  - [ ] `GET /projects`
  - [ ] `POST /projects`
  - [ ] `GET /projects/:projectId`
  - [ ] `PUT /projects/:projectId`
  - [ ] `POST /projects/:projectId/compile` → web manifest (+ optional renpy/ink)
  - [ ] `POST /projects/:projectId/seed` → installs seeded sample project
  - [ ] `POST /projects/:projectId/generation-jobs` → enqueue mock job
  - [ ] `GET /generation-jobs/:jobId`
- [ ] All request/response bodies validated against `@ch5me/storygen-schema`.

### 3.3 `apps/reader` — Vite + React runtime
- [ ] Vite + React 19 + TS runtime that loads a compiled story manifest.
- [ ] Renders v1 beats: `narration`, `dialogue`, `choice`, `jump`.
- [ ] Advances dialogue; selects a route at the choice; applies state changes.
- [ ] Static/pre-generated assets only (no live explicit generation in reader).

---

## 4. Packages (Wave A/B)

### 4.1 `@ch5me/storygen-schema` (Wave A — universal dependency)
- [ ] Zod schemas + inferred TS types + Drizzle table defs (D1-first, portable
      to Postgres later).
- [ ] Core hierarchy: `Project → StoryWorld → Stories → Chapters/Episodes →
      Scenes → Beats`.
- [ ] StoryWorld owns: Characters, Relationships, Locations, Props, Outfits,
      LoreFacts, Assets, GenerationJobs, Exports.
- [ ] **Beat discriminated union**: `narration | dialogue | choice | state_change
      | stage | panel_cue | asset_event | jump | branch`. All types validate and
      round-trip; renderer only needs the v1 subset.
- [ ] Supporting types: `ChoiceOption`, variables, conditions, `GenRecipe`,
      `StylePreset`.
- [ ] `WorldStateSnapshot`: route flags, relationship values, wardrobe, location,
      known facts, present characters, approved assets.
- [ ] Character canon: appearance locks, forbidden changes, outfits, poses,
      expressions, speech style, route role, references, model settings.
- [ ] Optional deep bibisco/Manuskript-style character metadata (non-blocking).
- [ ] Plot grid: `plot_threads` + `scene_plot_links` (novelibre-style).
- [ ] Generic `entity_links` table (Kanka-style relationships across entities).
- [ ] Asset provenance: model/checkpoint, prompt, negative prompt, seed,
      resolution, references, control inputs, adapters, workflow id, parent
      recipe, approval status. Canon asset requires provenance OR explicit
      `uploaded_manual`.
- [ ] Publishable-project policy fields: age-gate flag, all-characters-18+
      assertion, no real-person likeness/voice without consent, provenance
      required.

### 4.2 `@ch5me/storygen-compiler` (Wave B)
- [ ] Canonical story → **web manifest** (player-ready JSON + asset manifest).
- [ ] Canonical story → **Ren'Py `.rpy`** (deterministic output).
- [ ] Canonical story → **Ink-compatible** output (knots/choices/variables).
- [ ] Deterministic choices/state-changes; no engine lock-in beyond adapters.

### 4.3 `@ch5me/storygen-continuity` (Wave B)
- [ ] Canon/state/branch linter driven by `WorldStateSnapshot`s.
- [ ] Detects: wardrobe/outfit drift (warning), appearance-lock mismatch (error),
      missing branch/route target (error), known-fact contradiction (error),
      plot-thread orphan (warning).

### 4.4 `@ch5me/storygen-prompt-compiler` (Wave B)
- [ ] Compiles character/location/stage metadata → image prompt + negative prompt.
- [ ] Locked appearance fields land in explicit preserve / do-not-change sections.
- [ ] `tracery-grammar` seeded grammar → repeatable, deterministic text variants.

### 4.5 `@ch5me/storygen-generation` (Wave B)
- [ ] Recipe/job types + provider job contract (ComfyUI / Diffusers / Scenario /
      TTS) behind one typed interface.
- [ ] Mock runner implemented; real adapters deferred behind the same interface.

### 4.6 `@ch5me/storygen-player` (Wave B)
- [ ] Reusable React web-reader primitives; renders v1 beats (narration,
      dialogue, choice, jump).
- [ ] Explicit PixiVN adapter boundary stubbed for v2 (no lock-in).

### 4.7 `@ch5me/storygen-research` (Wave B)
- [ ] Normalized notes/adapters for external tools: license posture, schema
      ideas, UX patterns (machine-readable + linked from docs in §7).

---

## 5. Embedded External Libraries
- [ ] `inkjs` wired into compiler tests / player for flow validation.
- [ ] `tracery-grammar` wired into prompt-compiler for seeded text.
- [ ] No GPL/source-available code copied into the repo; references are
      idea/schema/UX only (enforced by §7 license notes).

---

## 6. Seeded Sample Project (Wave B)
- [ ] Programmatic seed (consumed by `apps/api` `/seed` route + tests).
- [ ] Two adult (18+) characters; one location; one plot thread; three scenes.
- [ ] Beats include dialogue, narration, image/panel cues, **one choice**, and
      **one state change**; valid against schema + policy fields.

---

## 7. Docs (Wave B — independent, start at T0)
- [ ] `docs/research/story-tools.md` — Embed / Fork / Study matrix covering ALL
      supplied research (Twine, Inky, YarnClassic, Arrow, Manuskript, bibisco,
      novelibre, novelWriter, oStorybook, Kanka, Fantasia Archive, Chronicler,
      autonovel, StoryCraftr, RecurrentGPT, Ensemble/social-physics, Yarn Spinner,
      inkjs, Tracery).
- [ ] `docs/research/license-notes.md` — "ideas only unless compatible-license
      decision is explicit and documented" rule, per-tool license posture.
- [ ] `docs/architecture/story-production-system.md` — canonical DB + adapters
      doctrine; how one beat maps to web event / Ren'Py line/menu / Ink knot /
      comic panel / image prompt / TTS line.
- [ ] `docs/adult-content-policy.md` (or section) — age-gate, all-18+, no
      real-person likeness/voice cloning, provenance required, static-assets-only
      reader.

---

## 8. First-Slice Acceptance Gate (Wave D)
- [ ] `pnpm install` succeeds.
- [ ] `pnpm run typecheck` succeeds.
- [ ] `pnpm run test` succeeds.
- [ ] `pnpm run dev` starts API + studio + reader (or documented separate
      commands if devmux not fully wired).
- [ ] Studio renders the seeded project: Story Map graph draws; Scene Editor
      edits beats; Character/World Bible show canon + entity links.
- [ ] Preview plays the compiled story; Reader advances dialogue and chooses a
      route.
- [ ] Ren'Py exporter writes deterministic `.rpy`.
- [ ] Ink-compatible compiler output validates through `inkjs` where feasible.
- [ ] Prompt compiler creates a deterministic panel prompt + negative prompt.
- [ ] Continuity checker catches: outfit drift, appearance-lock mismatch, missing
      branch target, fact contradiction.

---

## 9. Tests (Wave D, authored alongside each package)
- **Schema**
  - [ ] Sample project parses.
  - [ ] Invalid beat rejected.
  - [ ] Asset approval without provenance rejected.
  - [ ] Publishable adult project requires policy fields.
- **Compiler**
  - [ ] Sample → web manifest snapshot.
  - [ ] Sample → Ren'Py snapshot.
  - [ ] Sample → Ink-compatible output.
  - [ ] Choices/state changes deterministic.
- **Continuity**
  - [ ] Wardrobe continuity warning.
  - [ ] Appearance lock error.
  - [ ] Missing route target error.
  - [ ] Known-fact contradiction error.
  - [ ] Plot-thread orphan warning.
- **Prompt**
  - [ ] Character/location/stage metadata compiles into prompt.
  - [ ] Locked appearance fields appear in preserve/do-not-change sections.
  - [ ] Tracery seeded grammar produces repeatable output.
- **App smoke**
  - [ ] Studio renders seeded project.
  - [ ] Reader advances and selects route.
  - [ ] Preview receives compiled manifest.

---

## 10. Land It (Wave D)
- [ ] `git status --short` clean except intended tracked files.
- [ ] Coherent initial commit on `main` (conventional message).
- [ ] Goal doc + this checklist committed with the work.
- [ ] Push (per CH5 default) unless a concrete blocker is reported.
