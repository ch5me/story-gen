# Current Goal

## Goal As Stated

Use an agent swarm, with as much parallelism as possible, to implement the entire
StoryGen monorepo bootstrap plan end-to-end and verify it end-to-end. Follow all
standard CH5 patterns, skills, and structures.

## Interpreted Goal

Bootstrap `/Users/hassoncs/src/ch5/story-gen` as a CH5-style pnpm/turbo monorepo
for AI illustrated-fiction production, delivered as a **playable first slice**
(not an empty skeleton). The canonical story database is the source of truth;
engines, models, editors, and exporters are adapters behind typed boundaries. A
parallel agent swarm builds it wave-by-wave per
`docs/plan/storygen-bootstrap-checklist.md`, then proves the user-facing path:
studio edits the seeded story, compiles it, previews it, reader plays it, Ren'Py
exports it, continuity checks catch drift.

## Success Criteria

- `pnpm install`, `pnpm run typecheck`, `pnpm run test` all succeed.
- `pnpm run dev` starts api + studio + reader (or documented separate commands).
- Studio renders the seeded project (Story Map graph, Scene Editor, Character +
  World Bible); Preview plays the compiled story; Reader advances dialogue and
  picks a route.
- Compiler emits deterministic web manifest, Ren'Py `.rpy`, and Ink-compatible
  output; Ink validates via `inkjs` where feasible.
- Prompt compiler emits deterministic prompt + negative prompt with locked
  appearance preserved; Tracery output repeatable.
- Continuity checker catches outfit drift, appearance-lock mismatch, missing
  branch target, fact contradiction (+ plot-thread orphan).
- All §9 tests green. Research + architecture + license + adult-policy docs land.
- Git ends clean with a coherent initial commit on `main` (pushed).

## Constraints

- Repo root: `/Users/hassoncs/src/ch5/story-gen` (CH5-convention; NOT
  ~/Documents/StoryGen).
- App shape: `apps/studio` + `apps/api` + `apps/reader`. Package scope
  `@ch5me/storygen-*`.
- Stack: pnpm@11.5.3 + turbo + devmux + hush; Vite + React 19; Hono + Cloudflare
  Workers + D1/R2; Drizzle; Zod; Vitest; React Flow.
- Embed only `inkjs` + `tracery-grammar` in v1. No GPL/source-available code
  copied in — references are ideas/schema/UX only unless a documented
  license-compatible decision is made.
- CH5 doctrine: fail fast / no reflexive fallbacks; everything scripted /
  idempotent / self-healing; secrets via Hush (stage-split); fix root cause +
  codify. No `as any` / `@ts-ignore` / `@ts-expect-error`.
- No nested repo copies or gitlinks; recreate clean structure, borrow CH5 config
  shape only.

## Non-Goals

- Real generation adapters (ComfyUI/Diffusers/Scenario/TTS) — mock runner only.
- Live explicit content generation in the reader — static/pre-generated assets.
- Deep PixiVN / Godot / Twine / Yarn import-export — adapter stubs / v2.
- D1/R2 as a hard local dependency — in-memory adapter is the first proof.
- Forking YarnClassic or copying any GPL/source-available tool this slice.

## Current State

**COMPLETE (first slice).** Built end-to-end by the agent swarm, waves A→D.

- **Wave A** (`1df81c7`): scaffold + `@ch5me/storygen-schema` (green).
- **Wave B** (`fb5ff4d`): 6 domain packages (compiler, continuity,
  prompt-compiler, generation, player, research) — swarm-built, all green.
- **Wave C** (`1dec786`): apps studio + api + reader — swarm-built, all green.
- **Wave D**: full-graph `turbo typecheck + test + build` GREEN (30/30 tasks,
  87 tests). Live boot proven: api :48787 (`/health` ok, seeded project served,
  `/compile` → v1 web manifest + Ren'Py + Ink), studio :45180 and reader :45181
  both serve. Re-verify with `bash scripts/smoke-acceptance.sh`.

Acceptance criteria all met: install/typecheck/test/build green; dev starts all
three apps; studio renders the seeded project; reader advances + chooses a route;
Preview plays the compiled story; Ren'Py deterministic; Ink validates via inkjs;
prompt compiler deterministic (seeded Tracery); continuity catches drift.

**Landed:** pushed to `https://git.ch5.me/ch5/story-gen.git` (private), `main`
tracks `hq/main`. Goal achieved end-to-end.

## Plan

1. **Wave A** — root workspace scaffold + `@ch5me/storygen-schema` (gates all).
2. **Wave B** — parallel: compiler, continuity, prompt-compiler, generation,
   player, research packages; seeded sample project; research + architecture +
   license + adult-policy docs.
3. **Wave C** — parallel: `apps/api`, `apps/studio`, `apps/reader`.
4. **Wave D** — integration verify, acceptance gate (§8), tests green (§9),
   finalize AGENTS.md, clean initial commit on `main`, push.

(Full detail: `docs/plan/storygen-bootstrap-checklist.md`.)

## Next Update Triggers

- goal changes
- constraints change
- acceptance criteria change
- plan or blocker state changes materially
- each wave completes (mark progress, record blockers)
