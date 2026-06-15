import { useState } from 'react';
import type { EntityKind, Project } from '@ch5me/storygen-schema';

interface WorldBibleProps {
  project: Project;
}

interface EntityRow {
  id: string;
  kind: EntityKind;
  label: string;
  detail?: string;
}

const TABS: { kind: EntityKind; label: string }[] = [
  { kind: 'character', label: 'Characters' },
  { kind: 'location', label: 'Locations' },
  { kind: 'prop', label: 'Props' },
  { kind: 'lore', label: 'Lore facts' },
  { kind: 'event', label: 'Plot threads' },
];

/**
 * World Bible: an entity browser over characters/locations/props/loreFacts/
 * plotThreads, with the world's entityLinks rendered as editable-looking
 * cross-links.
 */
export function WorldBible({ project }: WorldBibleProps): React.ReactElement {
  const [activeKind, setActiveKind] = useState<EntityKind>('character');
  const rows = entityRows(project, activeKind);
  const labelById = entityLabelIndex(project);

  return (
    <div className="flex h-full" data-view="world-bible">
      <nav className="w-44 shrink-0 border-r border-slate-800 p-2">
        <h2 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Entities
        </h2>
        <ul className="space-y-0.5">
          {TABS.map((tab) => (
            <li key={tab.kind}>
              <button
                type="button"
                onClick={() => setActiveKind(tab.kind)}
                aria-pressed={tab.kind === activeKind}
                className={`w-full rounded px-2 py-1 text-left text-sm ${
                  tab.kind === activeKind
                    ? 'bg-sky-600/30 text-sky-200'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        <h1 className="mb-3 text-lg font-semibold text-slate-100">
          {TABS.find((tab) => tab.kind === activeKind)?.label ?? 'Entities'}
        </h1>
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded border border-slate-800 bg-slate-900/50 p-2"
              data-entity-id={row.id}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-slate-100">{row.label}</span>
                <span className="text-[11px] text-slate-500">{row.id}</span>
              </div>
              {row.detail ? <p className="mt-0.5 text-xs text-slate-400">{row.detail}</p> : null}
              <CrossLinks project={project} entityId={row.id} labelById={labelById} />
            </li>
          ))}
          {rows.length === 0 ? <li className="text-sm text-slate-500">No entities.</li> : null}
        </ul>
      </div>
    </div>
  );
}

function CrossLinks({
  project,
  entityId,
  labelById,
}: {
  project: Project;
  entityId: string;
  labelById: Map<string, string>;
}): React.ReactElement | null {
  const links = project.world.entityLinks.filter(
    (link) => link.fromId === entityId || link.toId === entityId,
  );
  if (links.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1" data-region="cross-links">
      {links.map((link) => {
        const otherId = link.fromId === entityId ? link.toId : link.fromId;
        const direction = link.fromId === entityId ? '→' : '←';
        return (
          <button
            key={link.id}
            type="button"
            className="rounded border border-dashed border-slate-600 bg-slate-800/60 px-1.5 py-0.5 text-xs text-slate-300 hover:border-sky-500"
            title="Edit cross-link"
          >
            {link.relation} {direction} {labelById.get(otherId) ?? otherId}
          </button>
        );
      })}
    </div>
  );
}

function entityRows(project: Project, kind: EntityKind): EntityRow[] {
  const { world } = project;
  switch (kind) {
    case 'character':
      return world.characters.map((c) => ({
        id: c.id,
        kind,
        label: c.name,
        detail: c.role,
      }));
    case 'location':
      return world.locations.map((l) => ({
        id: l.id,
        kind,
        label: l.name,
        detail: l.description,
      }));
    case 'prop':
      return world.props.map((p) => ({
        id: p.id,
        kind,
        label: p.name,
        detail: p.description,
      }));
    case 'lore':
      return world.loreFacts.map((f) => ({
        id: f.id,
        kind,
        label: f.statement,
        detail: f.tags.join(', ') || undefined,
      }));
    case 'event':
      return world.plotThreads.map((t) => ({
        id: t.id,
        kind,
        label: t.name,
        detail: t.description,
      }));
    default:
      return [];
  }
}

function entityLabelIndex(project: Project): Map<string, string> {
  const index = new Map<string, string>();
  const { world } = project;
  for (const c of world.characters) index.set(c.id, c.name);
  for (const l of world.locations) index.set(l.id, l.name);
  for (const p of world.props) index.set(p.id, p.name);
  for (const f of world.loreFacts) index.set(f.id, f.statement);
  for (const t of world.plotThreads) index.set(t.id, t.name);
  return index;
}
