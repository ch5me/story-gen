/**
 * @ch5me/storygen-research
 *
 * Normalized, typed catalog of external story tools. Encodes the embed/fork/study
 * posture, license, and schema/UX takeaways recorded in
 * `docs/research/story-tools.md` and `docs/research/license-notes.md` as queryable
 * data so future engineers know exactly what was taken, what might be taken, and
 * what is off-limits to copy.
 *
 * Doctrine (CH5 / StoryGen `AGENTS.md`):
 * - GPL/source-available tools are idea/schema/UX references ONLY — `canCopyCode`
 *   is `false` for them.
 * - Only `inkjs` + `tracery-grammar` are embedded in v1 (`posture: 'embed'`).
 */

/**
 * Posture toward an external tool.
 *
 * - `embed` — shipped as an npm dependency; permissive license, runs in our code today.
 * - `fork`  — fork candidate pending an explicit, documented license + code audit.
 * - `study` — idea/schema/UX reference only; zero code copied.
 */
export type ToolPosture = 'embed' | 'fork' | 'study';

/** A single external tool and StoryGen's deliberate posture toward it. */
export interface ExternalTool {
  /** Tool name as referenced in the research docs. */
  name: string;
  /** Embed / fork / study posture. */
  posture: ToolPosture;
  /** Functional category (e.g. "Narrative Runtime", "Story-Bible Schema"). */
  category: string;
  /** Best-known license string from `license-notes.md`. */
  license: string;
  /**
   * Whether code may be copied from this tool. Only true for permissive,
   * embed-eligible tools. GPL/AGPL/source-available tools are always false.
   */
  canCopyCode: boolean;
  /** What we take and the key lessons recorded in the docs. */
  takeaways: string[];
  /** StoryGen schema/concept names this tool's data model maps to, where the docs say so. */
  schemaMappings?: string[];
  /** Canonical source/repo URL where the docs name one. */
  url?: string;
}

/**
 * The catalog. One entry per tool covered in `docs/research/story-tools.md` and
 * `docs/research/license-notes.md`. Frozen so the catalog is read-only and
 * deterministic for callers.
 */
export const externalTools: readonly ExternalTool[] = Object.freeze([
  {
    name: 'inkjs',
    posture: 'embed',
    category: 'Narrative Runtime',
    license: 'MIT',
    canCopyCode: true,
    takeaways: [
      'Narrative runtime: branching logic, choices, variables, knots/diverts.',
      'Compiler emits Ink-compatible output; inkjs validates it in tests and the player.',
      'Beat union maps directly: dialogue/narration -> Ink text, choice -> Ink */+ option, jump/branch -> divert, state_change -> variable set, stage -> tag.',
      'Only narrative runtime shipped in v1 (inkjs@^2).',
    ],
    schemaMappings: ['Beat', 'ChoiceBeat', 'JumpBeat', 'BranchBeat', 'StateChangeBeat', 'StageBeat'],
    url: 'https://github.com/y-lohse/inkjs',
  },
  {
    name: 'tracery-grammar',
    posture: 'embed',
    category: 'Procedural Text',
    license: 'Apache-2.0 (verify fork)',
    canCopyCode: true,
    takeaways: [
      'Seeded procedural text: names, flavor lines, prompt variants.',
      'Deterministic with an explicit seed — non-negotiable for snapshot tests and repeatable asset recipes.',
      'Powers storygen-prompt-compiler (tracery-grammar@^2).',
    ],
    schemaMappings: ['GenRecipe', 'StylePreset'],
    url: 'https://github.com/v21/tracery',
  },
  {
    name: 'Twine',
    posture: 'study',
    category: 'Graph/Editor UX',
    license: 'GPL-3.0',
    canCopyCode: false,
    takeaways: [
      'Passage/link graph model: passages as nodes, links as directed edges.',
      'Conceptual ancestor of the Story Map (React Flow); implemented over our own Scene/Beat schema, not Twine data.',
      'No code copied. Passage model maps 1-to-1 with Scene nodes and jump/branch beat targets.',
    ],
    schemaMappings: ['Scene', 'JumpBeat', 'BranchBeat'],
  },
  {
    name: 'Inky',
    posture: 'study',
    category: 'Graph/Editor UX',
    license: 'MIT',
    canCopyCode: false,
    takeaways: [
      'Script + live-playtest loop UX informs the Studio Preview tab "instant playtest" pattern.',
      'MIT (may embed) but no current embed need; runtime is covered by inkjs.',
      'UX reference only: the split edit/play loop is the pattern to replicate.',
    ],
    url: 'https://github.com/inkle/inky',
  },
  {
    name: 'YarnClassic',
    posture: 'fork',
    category: 'Graph/Editor UX',
    license: 'MIT (verify)',
    canCopyCode: false,
    takeaways: [
      'Web editor that reads/writes Yarn and Ink formats; potential fast path to a script-mode scene editor.',
      'Sole fork candidate in the catalog.',
      'Do not copy until a license audit lands in license-notes.md; if MIT confirmed, worth forking for the script-editor panel in apps/studio.',
    ],
  },
  {
    name: 'Arrow',
    posture: 'study',
    category: 'Graph/Editor UX',
    license: 'MIT (verify)',
    canCopyCode: false,
    takeaways: [
      'Node taxonomy differentiates node types (dialogue, decision, chance, end).',
      'Reference for typing and color-coding Scene nodes in the Story Map beyond a flat graph.',
      'License unclear/verify; UX/taxonomy reference only.',
    ],
    schemaMappings: ['Scene', 'BeatKind'],
  },
  {
    name: 'Manuskript',
    posture: 'study',
    category: 'Story-Bible Schema',
    license: 'GPL-3.0',
    canCopyCode: false,
    takeaways: [
      'Characters, plots, outline/index cards, worldbuilding, item tracking, Snowflake-method schema.',
      'Snowflake/outline-card model is an editorial UX pattern for the Character and World Bible panels.',
      'No code copied (GPL-3.0).',
    ],
    schemaMappings: ['Character', 'StoryWorld'],
  },
  {
    name: 'bibisco',
    posture: 'study',
    category: 'Story-Bible Schema',
    license: 'GPL-3.0',
    canCopyCode: false,
    takeaways: [
      'Deep character interview schema (psychological, social, behavioural questions), narrative strands, scene/chapter metadata.',
      'Interview-question taxonomy maps to the optional extended Character deep profile (characterProfile) block in schema (non-blocking).',
      'No code copied (GPL-3.0).',
    ],
    schemaMappings: ['Character'],
  },
  {
    name: 'novelibre',
    posture: 'study',
    category: 'Story-Bible Schema',
    license: 'GPL-3.0',
    canCopyCode: false,
    takeaways: [
      'Plot grid pattern (scenes x plot threads matrix), section metadata, snapshots/progress tracking.',
      'Direct inspiration for plot_threads + scene_plot_links schema tables.',
      'Plot-grid UI (rows = scenes, columns = threads) is the intended Scene Editor thread-strip design. No code copied (GPL-3.0).',
    ],
    schemaMappings: ['PlotThread', 'ScenePlotLink'],
  },
  {
    name: 'novelWriter',
    posture: 'study',
    category: 'Story-Bible Schema',
    license: 'GPL-3.0',
    canCopyCode: false,
    takeaways: [
      'Markdown tree + cross-reference model: documents link to characters/locations/tags inline.',
      'Informs entity_links table design and the cross-reference browser in World Bible.',
      '@tag cross-reference notation is the UX reference for surfacing entity links inside beat text. No code copied (GPL-3.0).',
    ],
    schemaMappings: ['EntityLink'],
  },
  {
    name: 'oStorybook',
    posture: 'study',
    category: 'Story-Bible Schema',
    license: 'GPL-3.0 (verify)',
    canCopyCode: false,
    takeaways: [
      'Multi-strand / timeline view: scenes arranged on a timeline per character strand.',
      'Reference for a future per-character timeline mode in Story Map (v2, not needed for v1).',
      'No code copied.',
    ],
    schemaMappings: ['Scene', 'Character'],
  },
  {
    name: 'Kanka',
    posture: 'study',
    category: 'Entity Graph',
    license: 'Proprietary SaaS / source-available (verify)',
    canCopyCode: false,
    takeaways: [
      'Entity model: characters, locations, organizations, events, items, families, notes, relationships with typed links.',
      'Direct intellectual ancestor of entity_links and the World Bible entity browser.',
      'Relationship link model (entity A -> relation type -> entity B) maps to entity_links. No code or schema copied.',
    ],
    schemaMappings: ['EntityLink', 'EntityKind', 'Relationship'],
  },
  {
    name: 'Fantasia Archive',
    posture: 'study',
    category: 'Entity Graph',
    license: 'MIT (verify)',
    canCopyCode: false,
    takeaways: [
      'Templated entity categories, tagging, full-text search, document linking.',
      'Informs World Bible filter/search UX and the entity tagging surface.',
      'Template-category + tag model is the World Bible default entity-browser shape. No current embed need; no code copied.',
    ],
    schemaMappings: ['EntityKind', 'EntityLink'],
  },
  {
    name: 'Chronicler',
    posture: 'study',
    category: 'Entity Graph',
    license: 'verify',
    canCopyCode: false,
    takeaways: [
      'Local-first Markdown lore store: how prose-first teams author world-bible content before it is structured.',
      'Informs the future "paste raw lore -> structure into entities" import flow.',
      'Exact repo/license unconfirmed; no code copied.',
    ],
    schemaMappings: ['LoreFact'],
  },
  {
    name: 'autonovel',
    posture: 'study',
    category: 'AI-Native Consistency',
    license: 'verify (likely MIT)',
    canCopyCode: false,
    takeaways: [
      'Canon DB, hard-facts table, state tracker, revision gates that block generation if canon is violated.',
      'Direct intellectual model for storygen-continuity and WorldStateSnapshot.',
      '"Hard facts vs. soft style" split + revision-gate pattern are the core continuity-linter ideas. No code copied until confirmed permissive.',
    ],
    schemaMappings: ['WorldStateSnapshot', 'LoreFact'],
  },
  {
    name: 'StoryCraftr',
    posture: 'study',
    category: 'AI-Native Consistency',
    license: 'verify',
    canCopyCode: false,
    takeaways: [
      'Command-driven outline / world / chapter scaffolding workflow.',
      'Reference for the storygen-compiler pipeline shape and the POST /projects/:id/seed bootstrap flow.',
      'Structured CLI workflow (outline -> world -> chapters) maps to the compiler pipeline stages. No code copied until confirmed permissive.',
    ],
    schemaMappings: ['Project', 'StoryWorld', 'Chapter'],
  },
  {
    name: 'RecurrentGPT',
    posture: 'study',
    category: 'AI-Native Consistency',
    license: 'MIT (verify)',
    canCopyCode: false,
    takeaways: [
      'Long-context coherence patterns: rolling summary buffer, explicit memory store, paragraph-level re-ranking.',
      'Architectural reference for how WorldStateSnapshot accumulates and diffs state across scenes rather than recomputing from scratch.',
      'Use only as an algorithmic reference — no copy-paste of prompt pipelines without a documented decision.',
    ],
    schemaMappings: ['WorldStateSnapshot'],
  },
  {
    name: 'Ensemble',
    posture: 'study',
    category: 'AI-Native Consistency',
    license: 'research / varies',
    canCopyCode: false,
    takeaways: [
      'Dating-sim relationship dynamics: numeric relationship axes, event-triggered state deltas, social graph simulation.',
      'Future reference for relationship variable design — study after the Ink path is stable (v2+).',
      'Maps to Relationship variables in WorldStateSnapshot and state_change beats.',
    ],
    schemaMappings: ['Relationship', 'WorldStateSnapshot', 'StateChangeBeat'],
  },
  {
    name: 'Yarn Spinner',
    posture: 'study',
    category: 'Narrative Runtime',
    license: 'MIT',
    canCopyCode: false,
    takeaways: [
      'Twine-compatible import/export format, localisation tables, command syntax.',
      'Cleanest path to a Yarn import adapter in storygen-compiler once the primary Ink adapter is green and snapshot-tested.',
      'Command/<<set>> syntax maps to state_change beats; localisation tables are a future export target. Study after the Ink path is stable.',
    ],
    schemaMappings: ['StateChangeBeat'],
    url: 'https://github.com/YarnSpinnerTool/YarnSpinner',
  },
]);

/**
 * All tools with the given posture, in catalog order.
 *
 * @param posture - The posture to filter by.
 * @returns A fresh array (safe to mutate) of matching tools.
 */
export function toolsByPosture(posture: ToolPosture): ExternalTool[] {
  return externalTools.filter((tool) => tool.posture === posture).map((tool) => ({ ...tool }));
}

/**
 * All tools in the given category, in catalog order.
 *
 * Fails fast: an empty or whitespace-only category is a caller bug, not a query
 * that should silently return nothing.
 *
 * @param category - The category to filter by.
 * @returns A fresh array (safe to mutate) of matching tools.
 * @throws {Error} If `category` is empty or whitespace-only.
 */
export function toolsByCategory(category: string): ExternalTool[] {
  if (category.trim().length === 0) {
    throw new Error('toolsByCategory: category must be a non-empty string');
  }
  return externalTools.filter((tool) => tool.category === category).map((tool) => ({ ...tool }));
}
