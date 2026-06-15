# AGENTS.md — StoryGen

CH5-style pnpm/turbo monorepo for AI illustrated-fiction production. Read this
before touching anything. Detailed work breakdown lives in
`docs/plan/storygen-bootstrap-checklist.md`; the active goal is
`.sisyphus/goals/current-goal.md`.

## Doctrine (load-bearing, CH5 company-wide)

- **Canonical story DB is the source of truth.** Engines, models, editors, and
  exporters are adapters behind typed boundaries. Never bake engine specifics
  into the schema.
- **Fail fast, fail loud — no reflexive fallbacks.** A fallback that silently
  masks a broken primary is an anti-pattern. Default to NO fallback: throw a
  typed error naming the missing precondition. If a fallback is truly justified,
  make it observable (log/metric), never silent. (e.g. selecting the D1 storage
  adapter without a D1 binding must throw, not silently use in-memory.)
- **Everything scripted, idempotent, self-healing.** No manual hand-patching.
  Setup/dev/test must be reproducible from scripts.
- **Fix root cause + codify.** Spot a smell, fix at the source, write the rule
  into the narrowest durable surface (this file / a package README / a helper).
- **No `as any`, `@ts-ignore`, or `@ts-expect-error`.** Strict TS only. Prefer
  self-documenting code and small targeted edits.
- **Licensing:** GPL/source-available tools are idea/schema/UX references ONLY.
  No code copied in unless an explicit compatible-license decision is documented
  in `docs/research/license-notes.md`. Only `inkjs` + `tracery-grammar` are
  embedded in v1.

## Repo Map

```
apps/
  studio/   Vite + React 19 authoring app (Story Map, Scene Editor, Bibles, Asset Lab, Preview)
  api/      Hono + Cloudflare Workers API (in-memory adapter first; D1/R2 bindings declared)
  reader/   Vite + React runtime that plays compiled story manifests
packages/
  storygen-schema/           Zod + Drizzle + shared domain types  (THE universal dependency)
  storygen-compiler/         canonical story -> web manifest / Ren'Py / Ink-compatible output
  storygen-continuity/       canon/state/branch linter
  storygen-prompt-compiler/  image prompt + negative prompt recipes; Tracery seeded text
  storygen-generation/       provider job contract + mock runner (real adapters deferred)
  storygen-player/           reusable React web-reader primitives
  storygen-research/         normalized notes/adapters for external tools
docs/
  plan/         the bootstrap checklist (work breakdown)
  research/     story-tools matrix + license notes
  architecture/ canonical-DB/adapters doctrine
```

## Stack & Version Pins (use these EXACTLY for consistency)

- pnpm `11.5.3`, Node `>=24 <25` (`.nvmrc` 24.14.1), turbo `^2.7.2`, TypeScript `^5.8.3`.
- Packages: `zod@^3.24.2`, `drizzle-orm@^0.39.3`, `drizzle-kit@^0.30.5`.
- API: `hono@^4.7.5`, `wrangler@^4.x`, `@cloudflare/workers-types@^4.x`.
- Apps: `react@^19`, `react-dom@^19`, `@types/react@^19`, `vite@^6`,
  `@vitejs/plugin-react@^4`, `tailwindcss@^4` + `@tailwindcss/vite@^4`.
- Story Map graph: `@xyflow/react@^12` (React Flow 12).
- Embedded: `inkjs@^2`, `tracery-grammar@^2`.
- Tests: `vitest@^3.2.4` everywhere. Snapshot tests welcome for compiler output.

## Package Authoring Template (every `packages/*` follows this)

`package.json` (dist-based, CH5-standard — consumers import the built `dist/`):

```jsonc
{
  "name": "@ch5me/storygen-<name>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "default": "./dist/index.js" }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": { "@ch5me/storygen-schema": "workspace:*" },
  "devDependencies": { "typescript": "^5.8.3", "vitest": "^3.2.4" }
}
```

`tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- Every package has `src/index.ts` as its single public entrypoint. Export only
  intended public surface.
- Cross-package imports use the package name (`@ch5me/storygen-schema`), never
  relative paths across package boundaries.
- Turbo enforces build order: `typecheck` and `build` both `dependsOn: ^build`,
  so upstream `dist/` exists before a consumer typechecks. **All shared type
  contracts live in `storygen-schema`** so domain packages depend only on it (no
  package-to-package races during the parallel build).
- Tests colocate under `src/**/*.test.ts` or `src/__tests__/`. Use deterministic
  fixtures; seed any randomness (Tracery grammars take an explicit seed).

## Apps

- `apps/studio` / `apps/reader`: Vite. `dev` = `vite`, `build` = `tsc && vite build`,
  `typecheck` = `tsc --noEmit`, `test` = `vitest run`. tsconfig adds
  `"lib": ["ES2022","DOM","DOM.Iterable"]`, `"jsx": "react-jsx"`.
- `apps/api`: Hono on Workers. `dev` must boot locally WITHOUT real D1/R2 (use
  the in-memory storage adapter by default). `wrangler.toml` declares D1 + R2
  bindings (real IDs come later). Validate every request/response with
  `@ch5me/storygen-schema`.

## Dev Workflow

- `pnpm install` once at root. `pnpm dev` brings up studio (devmux pulls api as a
  dependency); `pnpm dev:all` brings up api + studio + reader. Ports: api 48787,
  studio 45180, reader 45181 (see `devmux.config.json`).
- `pnpm build` / `pnpm typecheck` / `pnpm test` run through turbo across the graph.
- Secrets via Hush only (never `.env`/plaintext). First slice needs none.

## Beat Union (the spine of the data model)

`Beat = narration | dialogue | choice | state_change | stage | panel_cue | asset_event | jump | branch`

All beat types validate and round-trip through schema + compiler. The v1 reader/
player renders the subset: `narration`, `dialogue`, `choice`, `jump`. One beat
must be able to export to: web runtime event, Ren'Py line/menu, Ink knot/choice,
comic panel, image prompt, TTS line.

## Adult-Content Policy (enforced in schema + reader)

Publishable projects require: age-gate flag, all-characters-18+ assertion, no
real-person likeness/voice cloning without consent, provenance on canon assets.
The reader uses pre-generated/static assets only — no live explicit generation.

## Acceptance Gate

`pnpm install` + `pnpm typecheck` + `pnpm test` green; `pnpm dev` (or documented
commands) starts api+studio+reader; studio renders the seeded project; reader
plays the compiled story; Ren'Py exports deterministically; `inkjs` validates the
Ink-compatible output; continuity catches drift. See checklist §8–§9.
