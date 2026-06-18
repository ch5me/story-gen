# Onboarding — read this first (humans and agents)

You're looking at **StoryGen**: a monorepo for AI illustrated-fiction production.
You author branching, illustrated stories against one **canonical story database**;
everything else (renderers, exporters, model/generation backends, editors) is an
**adapter** behind a typed boundary. The story DB is the single source of truth.

If you're an agent: read the files below **in order**, then you'll understand the
whole system. They're short and current.

## Read order

1. **`README.md`** — what's here, how to run it, the script map.
2. **`AGENTS.md`** — conventions, version pins, doctrine (canonical DB + adapters,
   fail-fast/no fallbacks, the CH5 design system, the Beat union). The operating
   contract for working in this repo.
3. **`docs/architecture/story-production-system.md`** — the canonical data model
   (`Project → StoryWorld → Stories → Chapters → Scenes → Beats`), how one Beat
   maps to every export target (web runtime, Ren'Py, Ink, comic panel, image
   prompt, TTS), and the package/adapter map.
4. **`docs/integration/character-generation.md`** — ⭐ **start here if you do
   character/image generation.** How a character-generation system plugs in
   (the `Character` canon, `Asset`/`AssetProvenance`, the `GenerationProvider`
   boundary, the prompt-compiler) and the exact questions we need answered.
5. **`docs/research/story-tools.md`** + **`docs/research/license-notes.md`** —
   the external tools we studied/embed and the licensing posture.
6. **`docs/adult-content-policy.md`** — age-gate / 18+ / provenance / consent rules.

## The shape in 60 seconds

- **Packages** (`@ch5me/storygen-*`): `schema` (Zod + Drizzle domain model — the
  contract everything binds to, incl. the compiled `WebManifest`), `compiler`
  (story → web manifest / Ren'Py / Ink), `continuity` (canon/state linting),
  `prompt-compiler` (image prompts + Tracery), `generation` (provider boundary +
  mock runner), `player` (web-reader runtime), `research` (typed tool catalog).
- **Apps**: `studio` (Vite/React authoring UI — Story Map, Scene Editor,
  Character/World Bible, Asset Lab, Preview), `api` (Hono + Cloudflare Workers,
  in-memory adapter first), `reader` (standalone runtime that plays a compiled
  story), `storybook` (component + player showcase).
- **Run it**: `pnpm install && pnpm dev:all` (api :48787, studio :45180,
  reader :45181; storybook via `devmux ensure storybook` on :45200). Verify the
  whole thing green with `bash scripts/smoke-acceptance.sh`.
  - **External collaborators:** `pnpm install` fetches the shared CH5 design
    packages (`@ch5me/ch5-ui-web`, `@ch5me/firefly-design`, `@ch5me/ch5-design-web`)
    from the private CH5 Verdaccio registry at `https://npm.ch5.me/` — you need
    a valid user npm config token for the `@ch5me` scope (ask the StoryGen owner). **Reading
    and understanding the code + docs needs none of this** — only running the apps
    locally does. The non-UI packages (`schema`, `compiler`, `continuity`,
    `prompt-compiler`, `generation`, `player`) and the api have no such dependency.
- **Seeded sample**: a small "Rooftop" project (two 18+ characters, one location,
  three scenes, a choice, a state change) loads by default so every surface has
  real data immediately.

## Where to plug in character generation

The seams already exist (see doc #4): implement a `GenerationProvider`
(`@ch5me/storygen-generation`) backed by your pipeline, and map your character
records onto the `Character` + `Asset`/`AssetProvenance` schema. The
`prompt-compiler` already emits prompts with a locked-appearance "preserve" block
for consistency.
