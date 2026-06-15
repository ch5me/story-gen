import { useEffect, useState } from 'react';
import { sampleProject, type Project } from '@ch5me/storygen-schema';
import { createApi, type StudioApi } from './api';
import { StoryMap } from './views/StoryMap';
import { SceneEditor } from './views/SceneEditor';
import { CharacterBible } from './views/CharacterBible';
import { WorldBible } from './views/WorldBible';
import { AssetLab } from './views/AssetLab';
import { Preview } from './views/Preview';

type ViewId = 'story-map' | 'scene-editor' | 'character-bible' | 'world-bible' | 'asset-lab' | 'preview';

const NAV: { id: ViewId; label: string }[] = [
  { id: 'story-map', label: 'Story Map' },
  { id: 'scene-editor', label: 'Scene Editor' },
  { id: 'character-bible', label: 'Character Bible' },
  { id: 'world-bible', label: 'World Bible' },
  { id: 'asset-lab', label: 'Asset Lab' },
  { id: 'preview', label: 'Preview' },
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
    return <Shell view={view} onSelect={setView}><Centered>Loading project…</Centered></Shell>;
  }
  if (load.status === 'error') {
    return (
      <Shell view={view} onSelect={setView}>
        <Centered>
          <p className="text-rose-300">Failed to load project.</p>
          <p className="mt-1 text-xs text-slate-500">{load.message}</p>
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
    <div className="grid h-full grid-cols-[180px_1fr] grid-rows-[44px_1fr] bg-slate-950">
      <header className="col-span-2 flex items-center gap-2 border-b border-slate-800 px-4">
        <span className="text-sm font-semibold text-slate-100">StoryGen Studio</span>
        <span className="text-xs text-slate-500">authoring</span>
      </header>

      <nav className="row-start-2 border-r border-slate-800 p-2" aria-label="Views">
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-pressed={item.id === view}
                aria-current={item.id === view ? 'page' : undefined}
                className={`w-full rounded px-2 py-1.5 text-left text-sm ${
                  item.id === view
                    ? 'bg-sky-600/30 font-medium text-sky-200'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="row-start-2 min-h-0 overflow-hidden">{children}</main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="flex h-full items-center justify-center text-center text-slate-400">{children}</div>;
}
