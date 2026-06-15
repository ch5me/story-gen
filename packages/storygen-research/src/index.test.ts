import { describe, expect, it } from 'vitest';

import {
  externalTools,
  toolsByCategory,
  toolsByPosture,
  type ExternalTool,
  type ToolPosture,
} from './index.js';

function find(name: string): ExternalTool {
  const tool = externalTools.find((entry) => entry.name === name);
  if (!tool) {
    throw new Error(`fixture tool "${name}" missing from catalog`);
  }
  return tool;
}

describe('externalTools catalog', () => {
  it('is non-empty', () => {
    expect(externalTools.length).toBeGreaterThan(0);
  });

  it('covers every tool named in the research docs', () => {
    const expected = [
      'inkjs',
      'tracery-grammar',
      'Twine',
      'Inky',
      'YarnClassic',
      'Arrow',
      'Manuskript',
      'bibisco',
      'novelibre',
      'novelWriter',
      'oStorybook',
      'Kanka',
      'Fantasia Archive',
      'Chronicler',
      'autonovel',
      'StoryCraftr',
      'RecurrentGPT',
      'Ensemble',
      'Yarn Spinner',
    ];
    const names = externalTools.map((tool) => tool.name);
    for (const name of expected) {
      expect(names).toContain(name);
    }
  });

  it('has unique tool names', () => {
    const names = externalTools.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('only marks embed-posture tools as copyable code', () => {
    for (const tool of externalTools) {
      if (tool.canCopyCode) {
        expect(tool.posture).toBe('embed');
      }
    }
  });
});

describe('embed posture (inkjs, tracery-grammar)', () => {
  it('marks inkjs as embed with copyable code', () => {
    const inkjs = find('inkjs');
    expect(inkjs.posture).toBe('embed');
    expect(inkjs.canCopyCode).toBe(true);
  });

  it('marks tracery-grammar as embed with copyable code', () => {
    const tracery = find('tracery-grammar');
    expect(tracery.posture).toBe('embed');
    expect(tracery.canCopyCode).toBe(true);
  });
});

describe('study posture (GPL tools)', () => {
  it('has at least one GPL tool as study with non-copyable code', () => {
    const gplStudy = externalTools.filter(
      (tool) =>
        tool.posture === 'study' &&
        tool.canCopyCode === false &&
        tool.license.includes('GPL'),
    );
    expect(gplStudy.length).toBeGreaterThanOrEqual(1);
  });
});

describe('fork posture (YarnClassic)', () => {
  it('marks YarnClassic as fork', () => {
    expect(find('YarnClassic').posture).toBe('fork');
  });
});

describe('schema mappings encode StoryGen concepts', () => {
  it('maps novelibre to plot_threads / scene_plot_links concepts', () => {
    expect(find('novelibre').schemaMappings).toEqual(
      expect.arrayContaining(['PlotThread', 'ScenePlotLink']),
    );
  });

  it('maps Kanka to entity links', () => {
    expect(find('Kanka').schemaMappings).toEqual(expect.arrayContaining(['EntityLink']));
  });

  it('maps autonovel and RecurrentGPT to WorldStateSnapshot', () => {
    expect(find('autonovel').schemaMappings).toEqual(
      expect.arrayContaining(['WorldStateSnapshot']),
    );
    expect(find('RecurrentGPT').schemaMappings).toEqual(
      expect.arrayContaining(['WorldStateSnapshot']),
    );
  });

  it('maps bibisco to the Character deep profile', () => {
    expect(find('bibisco').schemaMappings).toEqual(expect.arrayContaining(['Character']));
  });
});

describe('toolsByPosture', () => {
  it('returns at least two embed tools', () => {
    expect(toolsByPosture('embed').length).toBeGreaterThanOrEqual(2);
  });

  it('returns only tools of the requested posture', () => {
    const postures: ToolPosture[] = ['embed', 'fork', 'study'];
    for (const posture of postures) {
      for (const tool of toolsByPosture(posture)) {
        expect(tool.posture).toBe(posture);
      }
    }
  });

  it('returns fresh copies that do not mutate the catalog', () => {
    const result = toolsByPosture('fork');
    const before = find('YarnClassic').posture;
    const first = result[0];
    expect(first).toBeDefined();
    if (first) {
      first.posture = 'study';
    }
    expect(find('YarnClassic').posture).toBe(before);
  });
});

describe('toolsByCategory', () => {
  it('returns tools in the Narrative Runtime category', () => {
    const runtime = toolsByCategory('Narrative Runtime');
    const names = runtime.map((tool) => tool.name);
    expect(names).toContain('inkjs');
    expect(names).toContain('Yarn Spinner');
  });

  it('returns an empty array for an unknown category', () => {
    expect(toolsByCategory('Nonexistent Category')).toEqual([]);
  });

  it('throws on an empty category', () => {
    expect(() => toolsByCategory('')).toThrow();
    expect(() => toolsByCategory('   ')).toThrow();
  });
});
