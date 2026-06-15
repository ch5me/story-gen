import { useEffect, useState } from 'react';
import { sampleProject, type Project } from '@ch5me/storygen-schema';
import { Badge, Button, ScrollArea, cn } from '@ch5me/ch5-ui-web';
import {
  Boxes,
  Film,
  Globe2,
  Map,
  PlayCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { createApi, type StudioApi } from './api';
import { StoryMap } from './views/StoryMap';
import { SceneEditor } from './views/SceneEditor';
import { CharacterBible } from './views/CharacterBible';
import { WorldBible } from './views/WorldBible';
import { AssetLab } from './views/AssetLab';
import { Preview } from './views/Preview';

type ViewId = 'story-map' | 'scene-editor' | 'character-bible' | 'world-bible' | 'asset-lab' | 'preview';

const NAV: { id: ViewId; label: string; icon: LucideIcon }[] = [
  { id: 'story-map', label: 'Story Map', icon: Map },
  { id: 'scene-editor', label: 'Scene Editor', icon: Film },
  { id: 'character-bible', label: 'Character Bible', icon: Users },
  { id: 'world-bible', label: 'World Bible', icon: Globe2 },
  { id: 'asset-lab', label: 'Asset Lab', icon: Boxes },
  { id: 'preview', label: 'Preview', icon: PlayCircle },
];

export interface AppProps {
  /**
   * When provided, the app uses this project as initial state directly and does
   * NO network access. This is how tests inject data. In production the project
   * is fetched (and seeded if empty) on mount.
   */
  initialProject?: Project;
}

type LoadState =
  | { status: 'ready'; project: Project }
  | { status: 'loading' }
  | { status: 'error'; message: string };

export function App({ initialProject }: AppProps): React.ReactElement {
  const [view, setView] = useState<ViewId>('story-map');
  const [load, setLoad] = useState<LoadState>(
    initialProject ? { status: 'ready', project: initialProject } : { status: 'loading' },
  );

  useEffect(() => {
    // Injected project path: never touch the network (keeps tests offline).
    if (initialProject) return;

    let cancelled = false;
    const api: StudioApi = createApi();

    void (async () => {
      try {
        const project = await loadOrSeedProject(api);
        if (!cancelled) setLoad({ status: 'ready', project });
      } catch (error) {
        if (!cancelled) {
          setLoad({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialProject]);

  if (load.status === 'loading') {
    return (
      <Shell view={view} onSelect={setView}>
        <Centered>Loading project…</Centered>
      </Shell>
    );
  }
  if (load.status === 'error') {
    return (
      <Shell view={view} onSelect={setView}>
        <Centered>
          <p className="text-destructive">Failed to load project.</p>
          <p className="text-muted-foreground mt-1 text-xs">{load.message}</p>
        </Centered>
      </Shell>
    );
  }

  const { project } = load;
  const setProject = (next: Project): void => setLoad({ status: 'ready', project: next });

  return (
    <Shell view={view} onSelect={setView}>
      {view === 'story-map' ? <StoryMap project={project} /> : null}
      {view === 'scene-editor' ? <SceneEditor project={project} onChange={setProject} /> : null}
      {view === 'character-bible' ? <CharacterBible project={project} /> : null}
      {view === 'world-bible' ? <WorldBible project={project} /> : null}
      {view === 'asset-lab' ? <AssetLab project={project} /> : null}
      {view === 'preview' ? <Preview project={project} /> : null}
    </Shell>
  );
}

/**
 * Fetch the project list; seed the canonical sample when the workspace is empty
 * so a fresh API yields a usable editor. Fails fast on transport/validation
 * errors rather than silently showing an empty editor.
 */
async function loadOrSeedProject(api: StudioApi): Promise<Project> {
  const projects = await api.listProjects();
  const first = projects[0];
  if (first) return first;
  return api.seedProject(sampleProject);
}

function Shell({
  view,
  onSelect,
  children,
}: {
  view: ViewId;
  onSelect: (view: ViewId) => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="bg-background text-foreground grid h-full w-full grid-cols-[200px_1fr] grid-rows-[48px_1fr]">
      <header className="col-span-2 flex items-center gap-2 border-b px-4">
        <span className="text-sm font-semibold">StoryGen Studio</span>
        <Badge variant="secondary">authoring</Badge>
      </header>

      <nav className="row-start-2 min-h-0 border-r" aria-label="Views">
        <ScrollArea className="h-full">
          <ul className="flex flex-col gap-0.5 p-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = item.id === view;
              return (
                <li key={item.id}>
                  <Button
                    type="button"
                    variant={active ? 'secondary' : 'ghost'}
                    size="sm"
                    aria-pressed={active}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => onSelect(item.id)}
                    className={cn('w-full justify-start gap-2', active && 'font-medium')}
                  >
                    <Icon aria-hidden className="size-4" />
                    <span>{item.label}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </nav>

      <main className="row-start-2 min-h-0 overflow-hidden">{children}</main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="text-muted-foreground flex h-full flex-col items-center justify-center text-center">
      {children}
    </div>
  );
}
