import { useMemo } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Badge } from '@ch5me/ch5-ui-web';
import { checkContinuity } from '@ch5me/storygen-continuity';
import type { Project } from '@ch5me/storygen-schema';
import {
  beatTargets,
  missingAssetIds,
  primaryStory,
  scenesOf,
} from '../project-selectors';

interface StoryMapProps {
  project: Project;
}

interface SceneNodeData extends Record<string, unknown> {
  label: string;
  sceneId: string;
  continuityCount: number;
  missingAssetCount: number;
}

const COLUMN_WIDTH = 260;
const ROW_HEIGHT = 130;

/**
 * Story Map: one node per scene, edges for choice/jump/branch targets and
 * scene.next fall-through. Scenes with continuity issues or missing referenced
 * assets are badged so authors see drift at a glance.
 */
export function StoryMap({ project }: StoryMapProps): React.ReactElement {
  const story = primaryStory(project);

  const { nodes, edges } = useMemo(() => {
    const scenes = scenesOf(story);
    const issues = checkContinuity(project, { storyId: story.id });

    const issuesBySceneId = new Map<string, number>();
    for (const issue of issues) {
      if (!issue.sceneId) continue;
      issuesBySceneId.set(issue.sceneId, (issuesBySceneId.get(issue.sceneId) ?? 0) + 1);
    }

    const nodes: Node<SceneNodeData>[] = scenes.map((scene, index) => {
      const missing = missingAssetIds(scene, project.world.assets);
      return {
        id: scene.id,
        position: { x: (index % 3) * COLUMN_WIDTH, y: Math.floor(index / 3) * ROW_HEIGHT },
        data: {
          label: scene.title,
          sceneId: scene.id,
          continuityCount: issuesBySceneId.get(scene.id) ?? 0,
          missingAssetCount: missing.length,
        },
        type: 'sceneNode',
      };
    });

    const sceneIds = new Set(scenes.map((scene) => scene.id));
    const edges: Edge[] = [];
    const pushEdge = (source: string, target: string, label?: string): void => {
      if (!sceneIds.has(target)) return;
      edges.push({
        id: `${source}->${target}:${label ?? 'next'}`,
        source,
        target,
        label,
        animated: label === 'choice',
      });
    };

    for (const scene of scenes) {
      for (const beat of scene.beats) {
        const kind = beat.kind === 'choice' ? 'choice' : beat.kind === 'jump' ? 'jump' : 'branch';
        for (const target of beatTargets(beat)) {
          pushEdge(scene.id, target, kind);
        }
      }
      if (scene.next) {
        pushEdge(scene.id, scene.next, 'next');
      }
    }

    return { nodes, edges };
  }, [project, story]);

  return (
    <div className="h-full w-full" data-view="story-map" data-testid="story-map">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={{ sceneNode: SceneNode }}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
      {/*
        Accessible scene index. ReactFlow only paints nodes once it has measured a
        non-zero canvas size, which never happens in jsdom — so this list is the
        reliable, test-and-screen-reader-friendly mirror of the graph nodes.
      */}
      <ul className="sr-only" aria-label="Scenes" data-region="scene-index">
        {nodes.map((node) => (
          <li key={node.id} data-scene-id={node.id}>
            <span>{node.data.label}</span> <span>{node.id}</span>
            {node.data.continuityCount > 0 ? (
              <span data-badge="continuity">{node.data.continuityCount} continuity</span>
            ) : null}
            {node.data.missingAssetCount > 0 ? (
              <span data-badge="missing-assets">{node.data.missingAssetCount} missing asset</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SceneNode({ data }: { data: SceneNodeData }): React.ReactElement {
  const hasContinuity = data.continuityCount > 0;
  const hasMissingAssets = data.missingAssetCount > 0;
  return (
    <div
      className="bg-card text-card-foreground min-w-[180px] rounded-md border px-3 py-2 text-sm shadow-sm"
      data-scene-id={data.sceneId}
    >
      <div className="font-semibold">{data.label}</div>
      <div className="text-muted-foreground mt-0.5 text-[11px]">{data.sceneId}</div>
      <div className="mt-1 flex gap-1">
        {hasContinuity ? (
          <Badge variant="secondary" className="text-[10px]" data-badge="continuity">
            {data.continuityCount} continuity
          </Badge>
        ) : null}
        {hasMissingAssets ? (
          <Badge variant="destructive" className="text-[10px]" data-badge="missing-assets">
            {data.missingAssetCount} missing asset
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
