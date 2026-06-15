# Story Tools — Embed / Fork / Study Matrix

## What This Document Is

StoryGen's canonical story database is the source of truth. Every external tool
is an **adapter** — a runtime, an editor, a schema reference, or a UX pattern.
This matrix records the deliberate posture toward each tool so future engineers
know exactly what we took, what we might take, and what is off-limits to copy.

**Three postures:**

- **Embed** — shipped as an `npm` dependency in the monorepo. License is
  permissive (MIT/Apache/ISC) and the runtime value is clear. Code runs in our
  packages today.
- **Fork** — a candidate to fork *after* an explicit license + code audit is
  documented in `docs/research/license-notes.md`. No code has been copied yet.
  Appears here only because a fork could deliver more value than embedding alone.
- **Study** — idea, schema, or UX reference only. Zero code copied. Used solely
  to inform our own schema design, data-model decisions, and UI patterns. Many of
  these are GPL or source-available; even permissive ones are Study until a Fork
  decision is documented.

---

## Matrix

| Tool | Posture | What we take | License (best-known) | Notes |
|---|---|---|---|---|
| **inkjs** | Embed | Narrative runtime: branching logic, choices, variables, knots/diverts. Compiler emits Ink-compatible output; `inkjs` validates it in tests and player. | MIT | `inkjs@^2`. Maps directly to `Beat` union — `choice` → Ink choice, `jump`/`branch` → divert, `state_change` → variable set. |
| **tracery-grammar** | Embed | Seeded procedural text: names, flavor lines, prompt variants. Deterministic with explicit seed. | MIT | `tracery-grammar@^2`. Powers `storygen-prompt-compiler`; seeded grammars produce repeatable outputs across builds and tests. |
| **Twine** | Study | Passage/link graph model: passages as nodes, links as directed edges. Inspires the Story Map (React Flow) scene-graph shape. | GPL 3 | No code copied. The passage model maps 1-to-1 with our `Scene` nodes and `jump`/`branch` beat targets. |
| **Inky** | Study | Script + live-playtest loop UX. Informs the Studio Preview tab's "instant playtest" pattern. | MIT | Source on GitHub (inkle/inky). UX reference only; runtime is covered by `inkjs`. The split edit/play loop is the pattern to replicate. |
| **YarnClassic** | Fork candidate | Web editor that reads/writes Yarn and Ink formats; could be a fast path to a script-mode scene editor. | verify (likely MIT) | Do not copy until license audit lands in `license-notes.md`. If MIT confirmed, worth forking for the script-editor panel in `apps/studio`. |
| **Arrow** | Study | Node taxonomy: differentiates node *types* (dialogue, decision, chance, end). Reference for how to type Scene nodes in the Story Map beyond a flat graph. | verify | Small tool; license unclear. UX/taxonomy reference only. |
| **Manuskript** | Study | Characters, plots, outline/index cards, worldbuilding, item tracking, Snowflake method schema. Informs `StoryWorld` character canon fields and the optional deep-character metadata block in schema. | GPL 3 | No code copied. The Snowflake / outline-card model is an editorial UX pattern for the Character and World Bible panels in Studio. |
| **bibisco** | Study | Deep character interview schema (psychological, social, behavioural interview questions), narrative strands, scene/chapter metadata. Informs the optional extended character interview block in `storygen-schema`. | GPL 3 | No code copied. The interview-question taxonomy maps to the optional `characterProfile` metadata in schema (non-blocking per checklist §4.1). |
| **novelibre** | Study | Plot grid pattern (scenes × plot threads matrix), section metadata, snapshots/progress tracking. Direct inspiration for `plot_threads` + `scene_plot_links` schema tables. | GPL 3 | No code copied. The plot-grid UI — rows = scenes, columns = threads — is the intended design for the Scene Editor's thread strip. |
| **novelWriter** | Study | Markdown tree + cross-reference model: documents link to characters/locations/tags inline. Informs `entity_links` table design and the cross-reference browser in World Bible. | GPL 3 | No code copied. The `@tag` cross-reference notation is a UX reference for how Studio should surface entity links inside beat text. |
| **oStorybook** | Study | Multi-strand / timeline view: scenes arranged on a timeline per character strand. Reference for a future timeline mode in Story Map. | verify (likely MIT) | No code copied. The per-character strand view is a v2 Story Map feature, not needed for v1. |
| **Kanka** | Study | Entity model: characters, locations, organizations, events, items, families, notes, relationships with typed links. Direct schema inspiration for `entity_links` and the World Bible entity browser. | SaaS / source-available | No code copied. The relationship link model (entity A → relation type → entity B) maps to `entity_links` in `storygen-schema`. |
| **Fantasia Archive** | Study | Templated entity categories, tagging, full-text search, document linking. Informs World Bible filter/search UX and the tagging surface on entities. | MIT (verify) | No code copied. The template-category + tag model is the World Bible's default entity-browser shape. |
| **Chronicler** | Study | Local-first Markdown lore store. Reference for how prose-first teams author world-bible content before it is structured. | verify | No code copied. Informs the "paste raw lore → structure into entities" import flow, a future Studio feature. |
| **autonovel** | Study | Canon DB, hard facts table, state tracker, revision gates that block generation if canon is violated. Direct intellectual model for `storygen-continuity` and `WorldStateSnapshot`. | verify (likely MIT) | No code copied. The "hard facts vs. soft style" split and the revision-gate pattern are the core ideas behind the continuity linter. |
| **StoryCraftr** | Study | Command-driven outline / world / chapter scaffolding workflow. Reference for the `storygen-compiler` pipeline shape and the `POST /projects/:id/seed` bootstrap flow. | verify | No code copied. The structured CLI workflow (outline → world → chapters) maps to the compiler pipeline stages. |
| **RecurrentGPT + novel-writing engines** | Study | Long-context coherence patterns: rolling summary buffer, explicit memory store, paragraph-level re-ranking. Informs `WorldStateSnapshot` design and the continuity linter's state-diffing approach. | research papers / various | No code copied. The rolling-buffer + explicit-memory pattern is the architectural reference for how `WorldStateSnapshot` accumulates and diffs state across scenes. |
| **Ensemble / social-physics engines** | Study | Dating-sim relationship dynamics: numeric relationship axes, event-triggered state deltas, social graph simulation. Future reference for relationship variable design. | research / varies | Study *after* the Ink path is stable (v2+). Maps to `Relationship` variables in `WorldStateSnapshot` and `state_change` beats. |
| **Yarn Spinner** | Study | Twine-compatible import/export format, localisation tables, command syntax. Reference for a future Yarn import adapter in `storygen-compiler`. | MIT | Study *after* the Ink path is stable. The command/`<<set>>` syntax maps to `state_change` beats; localisation tables are a future export target. |

---

## Per-Category Takeaways

### Narrative Runtime (Embed)

`inkjs` is the only narrative runtime we ship in v1. It earns its place because
the StoryGen compiler targets Ink-compatible output as one of its three formats
(web manifest, Ren'Py, Ink), and having `inkjs` in the repo lets us validate
that output in CI without a separate toolchain. The `Beat` discriminated union
maps cleanly: `dialogue`/`narration` → Ink text, `choice` → Ink `*`/`+` option,
`jump`/`branch` → divert, `state_change` → variable set, `stage` → tag. Yarn
Spinner is an MIT alternative to revisit once the Ink path is proven stable.

### Procedural Text (Embed)

`tracery-grammar` is embedded for deterministic, seeded procedural text in
`storygen-prompt-compiler`. Seeding is non-negotiable: snapshot tests and
repeatable asset recipes both require that the same grammar + seed always
produces the same output. No other text-generation tool in this list is
embeddable without a license review.

### Graph/Editor UX (Study / Fork candidate)

Twine's passage-link graph is the conceptual ancestor of the Story Map. We
implement it with React Flow (`@xyflow/react@^12`) over our own `Scene`/`Beat`
schema rather than adopting Twine's data format. Inky's split edit/play loop is
the UX pattern for the Studio Preview tab — instant recompile and playthrough
without leaving the editor. YarnClassic is the one **Fork candidate** in this
list: if its license confirms MIT, its web-based script editor could accelerate
the script-mode panel in `apps/studio`. Arrow's node taxonomy (dialogue /
decision / chance / end) informs how we type and color-code Scene nodes in the
Story Map beyond a flat undifferentiated graph.

### Story-Bible Schema (Study)

Manuskript, bibisco, novelibre, novelWriter, and oStorybook collectively cover
every story-bible dimension we need. From them we took: the Snowflake/outline
card model (editorial UX for Character Bible), bibisco's character interview
taxonomy (the optional extended `characterProfile` block in schema), novelibre's
**plot grid** (the direct inspiration for `plot_threads` + `scene_plot_links`),
novelWriter's `@tag` cross-reference inline notation (World Bible entity links),
and oStorybook's per-character timeline strand (a v2 Story Map mode). All five
are GPL 3; nothing is copied. They are the existence proof that our schema
decisions are grounded in prior art.

### Entity Graph (Study)

Kanka is the richest prior art for a world-bible entity model: typed entities,
typed relationship links, and a browser that navigates the graph. It is the
direct intellectual ancestor of `entity_links` in `storygen-schema` and the
World Bible entity browser in Studio. Fantasia Archive adds the
template-category + tag model that makes entity browsing fast for a new author.
Chronicler is a reference for a future "import raw Markdown lore" flow. All
three are Study only.

### AI-Native Consistency (Study)

autonovel's "hard facts vs. soft style" split — where a canon DB gates
generation and blocks revisions that contradict known facts — is the core
intellectual model behind `storygen-continuity` and `WorldStateSnapshot`.
StoryCraftr's command-driven scaffold pipeline maps to the compiler's stage
order. RecurrentGPT and related research papers provide the rolling-buffer +
explicit-memory pattern that justifies our `WorldStateSnapshot` accumulating
state diffs scene-by-scene rather than recomputing from scratch. None of these
are code we embed; they are the architectural rationale for the continuity
linter's design.

### Study Later

Ensemble / social-physics engines and Yarn Spinner are explicitly deferred until
the Ink path is stable. Ensemble's relationship-dynamic model will matter when
we need numeric multi-axis relationship variables and event-triggered social
state. Yarn Spinner's MIT license and import/export format make it the cleanest
path to a Yarn adapter in `storygen-compiler` once the primary Ink adapter is
green and snapshot-tested.

---

*See also: `docs/research/license-notes.md` for the per-tool license decision
log and the rule that no GPL/source-available code may be copied without an
explicit documented decision there.*
