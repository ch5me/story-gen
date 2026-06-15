import type {
  CompiledNode,
  RuntimeBeat,
  VariableValue,
  WebManifest,
} from '@ch5me/storygen-schema';

/**
 * Headless story runtime. No DOM, no React — a pure deterministic walker over a
 * compiled {@link WebManifest}. Given identical input and identical choices it
 * produces identical output. It fails fast (typed Error naming the missing
 * precondition) rather than silently papering over bad data.
 */

/** A presentation beat the player has stopped on. */
export type PresentationBeat = Extract<RuntimeBeat, { kind: 'narration' | 'dialogue' | 'choice' }>;

/** The player's externally observable position. */
export interface PlayerPosition {
  node: CompiledNode;
  /** The beat the player is stopped on, or null when the story has ended. */
  beat: PresentationBeat | null;
}

export interface Player {
  /** The current node and the presentation beat we are stopped on (null if ended). */
  current(): PlayerPosition;
  /** A snapshot copy of the current flag map. */
  flags(): Record<string, VariableValue>;
  /** Advance to the next presentation stop, following set/jump and node.next. */
  advance(): void;
  /** Apply a choice option's flags and jump to its target. */
  choose(optionId: string): void;
  /** True once the walk has run off the end with no further presentation stop. */
  isEnded(): boolean;
}

function isPresentationBeat(beat: RuntimeBeat): beat is PresentationBeat {
  return beat.kind === 'narration' || beat.kind === 'dialogue' || beat.kind === 'choice';
}

/**
 * Build a deterministic headless player for a compiled manifest.
 *
 * Walk semantics:
 * - Start at `manifest.startNodeId`, beat index 0, flags = `manifest.variables`.
 * - `set` beats apply their flags and auto-advance.
 * - `jump` beats move to their target node at index 0 (throws if target missing).
 * - `narration` / `dialogue` are presentation stops.
 * - `choice` is a presentation stop; `choose(optionId)` applies the option's
 *   `setFlags` then jumps to its target.
 * - `advance()` moves to the next presentation stop, following set/jump and
 *   falling through `node.next` when the last beat of a node is reached. When
 *   there is no next, `isEnded()` becomes true.
 */
export function createPlayer(manifest: WebManifest): Player {
  const flags: Record<string, VariableValue> = { ...manifest.variables };

  let currentNodeId = manifest.startNodeId;
  let beatIndex = 0;
  let ended = false;

  function nodeById(id: string): CompiledNode {
    const node = manifest.nodes[id];
    if (!node) {
      throw new Error(`createPlayer: unknown node id "${id}" — not present in manifest.nodes`);
    }
    return node;
  }

  function currentNode(): CompiledNode {
    return nodeById(currentNodeId);
  }

  function jumpTo(target: string): void {
    // Validate the target exists before moving so we fail fast at the jump site.
    nodeById(target);
    currentNodeId = target;
    beatIndex = 0;
  }

  /**
   * Move the cursor forward until it lands on a presentation stop or runs off the
   * end of the graph. Resolves `set` (apply + continue) and `jump` (relocate)
   * inline; falls through `node.next` when a node's beats are exhausted.
   */
  function settle(): void {
    while (!ended) {
      const node = currentNode();
      if (beatIndex >= node.beats.length) {
        const next = node.next;
        if (next === null || next === undefined) {
          ended = true;
          return;
        }
        jumpTo(next);
        continue;
      }

      const beat = node.beats[beatIndex];
      if (beat === undefined) {
        // noUncheckedIndexedAccess guard — unreachable given the bound check above.
        throw new Error(
          `Player.settle: missing beat at index ${beatIndex} of node "${currentNodeId}"`,
        );
      }

      if (isPresentationBeat(beat)) {
        return;
      }

      switch (beat.kind) {
        case 'set':
          for (const [key, value] of Object.entries(beat.set)) {
            flags[key] = value;
          }
          beatIndex += 1;
          continue;
        case 'jump':
          jumpTo(beat.target);
          continue;
        default: {
          const exhaustive: never = beat;
          throw new Error(`Player.settle: unhandled beat kind ${JSON.stringify(exhaustive)}`);
        }
      }
    }
  }

  function currentPresentationBeat(): PresentationBeat | null {
    if (ended) {
      return null;
    }
    const node = currentNode();
    const beat = node.beats[beatIndex];
    if (beat === undefined || !isPresentationBeat(beat)) {
      throw new Error(
        `Player.current: cursor is not resting on a presentation beat at node "${currentNodeId}" index ${beatIndex}`,
      );
    }
    return beat;
  }

  // Settle onto the first presentation stop (or end) before handing control back.
  settle();

  return {
    current(): PlayerPosition {
      return { node: currentNode(), beat: currentPresentationBeat() };
    },
    flags(): Record<string, VariableValue> {
      return { ...flags };
    },
    advance(): void {
      if (ended) {
        return;
      }
      // Step off the current presentation beat, then resolve to the next stop.
      beatIndex += 1;
      settle();
    },
    choose(optionId: string): void {
      const beat = currentPresentationBeat();
      if (beat === null || beat.kind !== 'choice') {
        throw new Error(
          `Player.choose: no choice is active (current beat is ${
            beat === null ? 'end-of-story' : beat.kind
          })`,
        );
      }
      const option = beat.options.find((opt) => opt.id === optionId);
      if (!option) {
        throw new Error(
          `Player.choose: option "${optionId}" not found on choice "${beat.id}" — available: ${beat.options
            .map((opt) => opt.id)
            .join(', ')}`,
        );
      }
      if (option.setFlags) {
        for (const [key, value] of Object.entries(option.setFlags)) {
          flags[key] = value;
        }
      }
      jumpTo(option.target);
      settle();
    },
    isEnded(): boolean {
      return ended;
    },
  };
}
