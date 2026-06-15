# StoryGen

A CH5-style monorepo for **AI illustrated-fiction production**. Author branching,
illustrated stories against one canonical story database, then compile/preview/
play/export them. Engines, models, editors, and exporters are adapters — the
story DB is the single source of truth.

## What's here

- **`apps/studio`** — authoring app: Story Map, Scene Editor, Character Bible,
  World Bible, Asset Lab, live Preview.
- **`apps/api`** — Hono + Cloudflare Workers API (in-memory adapter first; D1/R2
  bindings declared for later).
- **`apps/reader`** — runtime that plays compiled story manifests.
- **`packages/storygen-*`** — schema, compiler, continuity linter, prompt
  compiler, generation boundary, web-reader primitives, and research notes.

## Quickstart

```bash
nvm use            # Node 24
pnpm install
pnpm typecheck
pnpm test
pnpm dev:all       # api (48787) + studio (45180) + reader (45181) via devmux
# or run individually: pnpm dev:api / pnpm dev:studio / pnpm dev:reader
```

The studio loads a seeded sample project (two characters, one location, three
scenes, a choice, a state change). Edit beats, watch the Story Map update,
Preview the compiled story, and open the reader to play it.

## Scripts

| Script | Does |
| --- | --- |
| `pnpm dev` | studio (devmux pulls api) |
| `pnpm dev:all` | api + studio + reader |
| `pnpm build` / `typecheck` / `test` | turbo across the graph |
| `pnpm svc:status` / `svc:attach` / `svc:stop` | devmux service control |

## For collaborators / external agents

New here (or pointing an agent at this repo)? Start with **`ONBOARDING.md`** — it
gives the read-order and a 60-second map. If you build **character/image
generation** and want to integrate, go straight to
**`docs/integration/character-generation.md`**.

## Docs

- `ONBOARDING.md` — read-this-first entrypoint (humans + agents).
- `docs/integration/character-generation.md` — integrate a character-generation system.
- `docs/plan/storygen-bootstrap-checklist.md` — implementation checklist.
- `docs/architecture/story-production-system.md` — canonical-DB/adapters doctrine.
- `docs/research/story-tools.md` — Embed/Fork/Study matrix of external tools.
- `docs/research/license-notes.md` — "ideas only unless compatible" licensing rule.
- `AGENTS.md` — conventions, version pins, package template.

## Status

First slice (playable scaffold). Real generation adapters (ComfyUI/Diffusers/
TTS), deep PixiVN/Godot/Twine/Yarn integration, and live D1/R2 are deferred
behind typed boundaries. See the goal doc at `.sisyphus/goals/current-goal.md`.
