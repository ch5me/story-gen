import { ProjectSchema, type Project } from '../entities';

/**
 * The canonical seeded sample project: two adult characters, one location, one
 * plot thread, three (+1 terminal) scenes with narration / dialogue / panel cue
 * / one choice / one state change. Parsed at module load so it is guaranteed
 * valid against the schema — fail loud if it ever drifts.
 */
export const sampleProject: Project = ProjectSchema.parse({
  id: 'proj_rooftop',
  name: 'Rooftop',
  createdAt: '2026-01-01T00:00:00.000Z',
  startStoryId: 'story_main',
  variables: [
    { key: 'met_devin', type: 'boolean', initial: false, label: 'Met Devin' },
    { key: 'affection', type: 'number', initial: 0, label: 'Affection' },
  ],
  policy: {
    ageGate: true,
    allCharacters18Plus: true,
    allowsRealPersonLikeness: false,
    publishable: true,
  },
  world: {
    id: 'world_main',
    name: 'Rooftop World',
    characters: [
      {
        id: 'mara',
        name: 'Mara',
        age: 28,
        role: 'protagonist',
        speechStyle: 'wry, warm, economical',
        appearance: 'Auburn hair, green jacket, easy posture.',
        appearanceLocks: [{ field: 'hair_color', value: 'auburn' }],
        forbiddenChanges: ['hair_color'],
        outfits: [{ id: 'outfit_mara_casual', name: 'Casual jacket' }],
        expressions: ['neutral', 'smile', 'surprised'],
        referenceAssetIds: ['asset_mara_ref'],
        relationshipVars: { affection: 0 },
      },
      {
        id: 'devin',
        name: 'Devin',
        age: 31,
        role: 'love-interest',
        speechStyle: 'measured, dry humor',
        appearance: 'Charcoal suit, green eyes, unhurried.',
        appearanceLocks: [{ field: 'eye_color', value: 'green' }],
        outfits: [{ id: 'outfit_devin_suit', name: 'Charcoal suit' }],
        expressions: ['neutral', 'smile'],
      },
    ],
    relationships: [
      { id: 'rel_1', fromCharacterId: 'mara', toCharacterId: 'devin', kind: 'acquaintance', value: 1 },
    ],
    locations: [
      { id: 'loc_rooftop', name: 'Rooftop Bar', description: 'A glass-railed bar above the city.' },
    ],
    props: [{ id: 'prop_drink', name: 'Old Fashioned' }],
    loreFacts: [{ id: 'fact_1', statement: 'Mara moved to the city last spring.' }],
    plotThreads: [
      { id: 'thread_first_meeting', name: 'First Meeting', color: '#e26d5c' },
    ],
    entityLinks: [
      {
        id: 'el_1',
        fromType: 'character',
        fromId: 'mara',
        toType: 'location',
        toId: 'loc_rooftop',
        relation: 'frequents',
      },
    ],
    assets: [
      {
        id: 'asset_mara_ref',
        kind: 'image',
        status: 'approved',
        caption: 'Mara reference',
        provenance: {
          model: 'mock-sdxl',
          prompt: 'auburn-haired woman in a green jacket, rooftop bar at night',
          negativePrompt: 'extra fingers, watermark',
          seed: 42,
          width: 768,
          height: 1024,
        },
      },
    ],
  },
  stories: [
    {
      id: 'story_main',
      title: 'One Good Rooftop',
      startSceneId: 'scene_arrival',
      scenePlotLinks: [
        { id: 'spl_1', sceneId: 'scene_arrival', plotThreadId: 'thread_first_meeting' },
        { id: 'spl_2', sceneId: 'scene_meet', plotThreadId: 'thread_first_meeting' },
      ],
      chapters: [
        {
          id: 'chapter_1',
          title: 'Chapter 1',
          scenes: [
            {
              id: 'scene_arrival',
              title: 'Arrival',
              locationId: 'loc_rooftop',
              beats: [
                { id: 'b_arr_1', kind: 'narration', text: 'The rooftop bar glows against a bruise-blue sky.' },
                { id: 'b_arr_2', kind: 'stage', locationId: 'loc_rooftop', present: ['mara'] },
                {
                  id: 'b_arr_3',
                  kind: 'dialogue',
                  characterId: 'mara',
                  text: 'Quite a view.',
                  expression: 'smile',
                  outfitId: 'outfit_mara_casual',
                },
                {
                  id: 'b_arr_4',
                  kind: 'panel_cue',
                  description: 'Mara leans on the rooftop railing, city lights behind her.',
                  characterIds: ['mara'],
                  locationId: 'loc_rooftop',
                },
                {
                  id: 'b_arr_5',
                  kind: 'choice',
                  prompt: 'Approach the stranger by the bar?',
                  options: [
                    { id: 'opt_approach', label: 'Walk over', target: 'scene_meet', setFlags: { met_devin: true } },
                    { id: 'opt_linger', label: 'Stay and watch the skyline', target: 'scene_linger' },
                  ],
                },
              ],
            },
            {
              id: 'scene_meet',
              title: 'The Meeting',
              locationId: 'loc_rooftop',
              beats: [
                { id: 'b_meet_1', kind: 'stage', locationId: 'loc_rooftop', present: ['mara', 'devin'] },
                {
                  id: 'b_meet_2',
                  kind: 'dialogue',
                  characterId: 'devin',
                  text: 'You have good taste in rooftops.',
                  expression: 'neutral',
                  outfitId: 'outfit_devin_suit',
                },
                { id: 'b_meet_3', kind: 'state_change', set: { affection: 1 } },
                {
                  id: 'b_meet_4',
                  kind: 'dialogue',
                  characterId: 'mara',
                  text: 'And you have good taste in opening lines.',
                  expression: 'smile',
                },
                { id: 'b_meet_5', kind: 'jump', target: 'scene_close' },
              ],
            },
            {
              id: 'scene_linger',
              title: 'Linger',
              locationId: 'loc_rooftop',
              beats: [
                { id: 'b_ling_1', kind: 'narration', text: 'You let the moment pass, content with the quiet.' },
                { id: 'b_ling_2', kind: 'jump', target: 'scene_close' },
              ],
            },
            {
              id: 'scene_close',
              title: 'Close',
              beats: [
                { id: 'b_close_1', kind: 'narration', text: 'The night folds on, full of roads not yet taken.' },
              ],
            },
          ],
        },
      ],
    },
  ],
});
